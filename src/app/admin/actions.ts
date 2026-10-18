"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteImage, filesFrom, saveImage } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";
import { OPTION_INFO, isOptionKind, normalizeDimensions } from "@/lib/options";
import { STATUSES, isStatus } from "@/lib/status";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

function refreshSite() {
  revalidatePath("/", "layout");
}

/* ───────────── Œuvres ───────────── */

const optionalId = (message: string) =>
  z
    .string()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || Number.isInteger(v), message);

const artworkSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(200),
  description: z.string().trim().max(10000),
  titleEn: z.string().trim().max(200),
  descriptionEn: z.string().trim().max(10000),
  mediumId: optionalId("Type de peinture invalide."),
  supportId: optionalId("Support invalide."),
  dimensionsId: optionalId("Dimensions invalides."),
  price: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, "").replace(",", "."))
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Prix invalide.")
    .transform((v) => (v === "" ? null : Number(v))),
  themeId: optionalId("Thème invalide."),
  artistId: optionalId("Artiste invalide."),
  status: z.enum(STATUSES, { error: "Statut invalide." }),
  isNew: z.boolean(),
});

function parseArtwork(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "");
  return artworkSchema.safeParse({
    title: get("title"),
    description: get("description"),
    titleEn: get("titleEn"),
    descriptionEn: get("descriptionEn"),
    mediumId: get("mediumId"),
    supportId: get("supportId"),
    dimensionsId: get("dimensionsId"),
    price: get("price"),
    themeId: get("themeId"),
    artistId: get("artistId"),
    status: get("status"),
    isNew: formData.get("isNew") === "on",
  });
}

function fieldErrors(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { error: "Merci de corriger les champs signalés.", fieldErrors };
}

export async function createArtwork(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseArtwork(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const main = filesFrom(formData, "image")[0];
  if (!main) return { error: "Ajoutez au moins l'image principale.", fieldErrors: { image: "Image obligatoire." } };

  let imageUrl: string;
  let extras: string[];
  try {
    imageUrl = await saveImage(main);
    extras = await Promise.all(filesFrom(formData, "extraImages").map(saveImage));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec de l'envoi de l'image." };
  }

  const slug = await uniqueSlug(parsed.data.title, async (s) =>
    Boolean(await prisma.artwork.findUnique({ where: { slug: s } })),
  );

  await prisma.artwork.create({
    data: {
      ...parsed.data,
      slug,
      imageUrl,
      images: { create: extras.map((url, position) => ({ url, position })) },
    },
  });

  refreshSite();
  redirect("/admin/oeuvres?ok=cree");
}

export async function updateArtwork(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseArtwork(formData);
  if (!parsed.success) return fieldErrors(parsed.error);

  const artwork = await prisma.artwork.findUnique({ where: { id }, include: { images: true } });
  if (!artwork) return { error: "Œuvre introuvable." };

  const removeIds = formData.getAll("removeImage").map(Number);
  const toRemove = artwork.images.filter((img) => removeIds.includes(img.id));

  let imageUrl = artwork.imageUrl;
  let extras: string[] = [];
  try {
    const main = filesFrom(formData, "image")[0];
    if (main) imageUrl = await saveImage(main);
    extras = await Promise.all(filesFrom(formData, "extraImages").map(saveImage));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec de l'envoi de l'image." };
  }

  const startPos = Math.max(-1, ...artwork.images.map((i) => i.position)) + 1;
  await prisma.artwork.update({
    where: { id },
    data: {
      ...parsed.data,
      imageUrl,
      images: {
        deleteMany: { id: { in: toRemove.map((i) => i.id) } },
        create: extras.map((url, i) => ({ url, position: startPos + i })),
      },
    },
  });

  if (imageUrl !== artwork.imageUrl) await deleteImage(artwork.imageUrl);
  await Promise.all(toRemove.map((i) => deleteImage(i.url)));

  refreshSite();
  redirect("/admin/oeuvres?ok=modifie");
}

export async function deleteArtwork(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const artwork = await prisma.artwork.findUnique({ where: { id }, include: { images: true } });
  if (!artwork) return;

  await prisma.artwork.delete({ where: { id } });
  await Promise.all([artwork.imageUrl, ...artwork.images.map((i) => i.url)].map(deleteImage));

  refreshSite();
  redirect("/admin/oeuvres?ok=supprime");
}

/** Changement rapide de statut / nouveauté depuis la liste. */
export async function quickUpdateArtwork(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = formData.get("status");
  const isNew = formData.get("isNew");

  await prisma.artwork.update({
    where: { id },
    data: {
      ...(isStatus(status) ? { status } : {}),
      ...(isNew !== null ? { isNew: isNew === "true" } : {}),
    },
  });
  refreshSite();
}

/* ───────────── Thèmes ───────────── */

const themeName = z.string().trim().min(1, "Nom obligatoire.").max(80);
const themeNameEn = z.string().trim().max(80).catch("");

export async function createTheme(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = themeName.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const nameEn = themeNameEn.parse(formData.get("nameEn") ?? "");

  const slug = await uniqueSlug(name.data, async (s) =>
    Boolean(await prisma.theme.findUnique({ where: { slug: s } })),
  );
  await prisma.theme.create({ data: { name: name.data, nameEn, slug } });
  refreshSite();
  return {};
}

export async function updateTheme(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = themeName.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };
  const nameEn = themeNameEn.parse(formData.get("nameEn") ?? "");

  const wanted = slugify(String(formData.get("slug") ?? "")) || slugify(name.data);
  const clash = await prisma.theme.findFirst({ where: { slug: wanted, id: { not: id } } });
  if (clash) return { error: `L'adresse « ${wanted} » est déjà utilisée par le thème ${clash.name}.` };

  await prisma.theme.update({ where: { id }, data: { name: name.data, nameEn, slug: wanted } });
  refreshSite();
  return {};
}

export async function deleteTheme(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const count = await prisma.artwork.count({ where: { themeId: id } });
  if (count > 0) {
    return { error: `Ce thème contient ${count} œuvre${count > 1 ? "s" : ""}. Réaffectez-les avant de le supprimer.` };
  }
  await prisma.theme.delete({ where: { id } });
  refreshSite();
  return {};
}

/* ───────────── Artistes ───────────── */

const artistName = z.string().trim().min(1, "Nom obligatoire.").max(120);

export async function createArtist(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = artistName.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const slug = await uniqueSlug(name.data, async (s) =>
    Boolean(await prisma.artist.findUnique({ where: { slug: s } })),
  );
  await prisma.artist.create({ data: { name: name.data, slug } });
  refreshSite();
  return {};
}

export async function updateArtist(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = artistName.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const wanted = slugify(String(formData.get("slug") ?? "")) || slugify(name.data);
  const clash = await prisma.artist.findFirst({ where: { slug: wanted, id: { not: id } } });
  if (clash) return { error: `L'adresse « ${wanted} » est déjà utilisée par ${clash.name}.` };

  await prisma.artist.update({ where: { id }, data: { name: name.data, slug: wanted } });
  refreshSite();
  return {};
}

export async function deleteArtist(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const count = await prisma.artwork.count({ where: { artistId: id } });
  if (count > 0) {
    return { error: `Cet artiste a ${count} œuvre${count > 1 ? "s" : ""}. Réaffectez-les avant de le supprimer.` };
  }
  await prisma.artist.delete({ where: { id } });
  refreshSite();
  return {};
}

/* ───────────── Listes (type de peinture, support, dimensions) ───────────── */

const optionName = z.string().trim().min(1, "Valeur obligatoire.").max(120);
const optionNameEn = z.string().trim().max(120).catch("");

async function parseOption(
  formData: FormData,
  id?: number,
): Promise<{ error: string } | { kind: string; name: string; nameEn: string }> {
  const kind = formData.get("kind");
  if (!isOptionKind(kind)) return { error: "Liste inconnue." };
  const parsed = optionName.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const name = kind === "DIMENSIONS" ? normalizeDimensions(parsed.data) : parsed.data;
  const nameEn = kind === "DIMENSIONS" ? "" : optionNameEn.parse(formData.get("nameEn") ?? "");

  // Doublon à la casse près (« acrylique » / « Acrylique ») : refusé pour garder un nommage uniforme
  const others = await prisma.listOption.findMany({ where: { kind, id: id ? { not: id } : undefined } });
  const clash = others.find((o) => o.name.localeCompare(name, "fr", { sensitivity: "base" }) === 0);
  if (clash) return { error: `« ${clash.name} » existe déjà dans la liste ${OPTION_INFO[kind].label}.` };

  return { kind, name, nameEn };
}

export async function createOption(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const data = await parseOption(formData);
  if ("error" in data) return data;
  await prisma.listOption.create({ data });
  refreshSite();
  return {};
}

export async function updateOption(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = await parseOption(formData, id);
  if ("error" in data) return data;
  const current = await prisma.listOption.findUnique({ where: { id } });
  if (current?.kind !== data.kind) return { error: "Valeur introuvable." };
  await prisma.listOption.update({ where: { id }, data: { name: data.name, nameEn: data.nameEn } });
  refreshSite();
  return {};
}

export async function deleteOption(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const count = await prisma.artwork.count({
    where: { OR: [{ mediumId: id }, { supportId: id }, { dimensionsId: id }] },
  });
  if (count > 0) {
    return { error: `Valeur utilisée par ${count} œuvre${count > 1 ? "s" : ""}. Modifiez-les avant de la supprimer.` };
  }
  await prisma.listOption.delete({ where: { id } });
  refreshSite();
  return {};
}

/* ───────────── Demandes ───────────── */

export async function setInquiryRead(formData: FormData) {
  await requireAdmin();
  await prisma.inquiry.update({
    where: { id: Number(formData.get("id")) },
    data: { isRead: formData.get("isRead") === "true" },
  });
  revalidatePath("/admin", "layout");
}

export async function deleteInquiry(formData: FormData) {
  await requireAdmin();
  await prisma.inquiry.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/admin", "layout");
}
