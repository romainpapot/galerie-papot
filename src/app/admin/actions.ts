"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteImage, filesFrom, saveImage } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";
import { STATUSES, isStatus } from "@/lib/status";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

function refreshSite() {
  revalidatePath("/", "layout");
}

/* ───────────── Œuvres ───────────── */

const artworkSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(200),
  description: z.string().trim().max(10000),
  medium: z.string().trim().max(200),
  support: z.string().trim().max(200),
  dimensions: z.string().trim().max(200),
  price: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, "").replace(",", "."))
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Prix invalide.")
    .transform((v) => (v === "" ? null : Number(v))),
  themeId: z
    .string()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || Number.isInteger(v), "Thème invalide."),
  status: z.enum(STATUSES, { error: "Statut invalide." }),
  isNew: z.boolean(),
});

function parseArtwork(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "");
  return artworkSchema.safeParse({
    title: get("title"),
    description: get("description"),
    medium: get("medium"),
    support: get("support"),
    dimensions: get("dimensions"),
    price: get("price"),
    themeId: get("themeId"),
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

export async function createTheme(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = themeName.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const slug = await uniqueSlug(name.data, async (s) =>
    Boolean(await prisma.theme.findUnique({ where: { slug: s } })),
  );
  await prisma.theme.create({ data: { name: name.data, slug } });
  refreshSite();
  return {};
}

export async function updateTheme(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = themeName.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const wanted = slugify(String(formData.get("slug") ?? "")) || slugify(name.data);
  const clash = await prisma.theme.findFirst({ where: { slug: wanted, id: { not: id } } });
  if (clash) return { error: `L'adresse « ${wanted} » est déjà utilisée par le thème ${clash.name}.` };

  await prisma.theme.update({ where: { id }, data: { name: name.data, slug: wanted } });
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
