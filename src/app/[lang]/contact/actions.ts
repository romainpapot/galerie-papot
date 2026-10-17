"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getDictionary, type Dictionary } from "@/lib/dictionaries";
import { artworkReference, formatPrice } from "@/lib/format";
import { toLocale } from "@/lib/i18n";
import { notifyGallery } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, toStatus } from "@/lib/status";

export type ContactState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<"name" | "email" | "phone" | "message", string>>;
  values?: Record<string, string>;
};

// Messages d'erreur dans la langue du visiteur
const schemaFor = (errors: Dictionary["form"]["errors"]) =>
  z.object({
    name: z.string().trim().min(2, errors.name).max(120),
    email: z.string().trim().email(errors.email).max(200),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v === "" || /^[+\d][\d\s.()-]{5,}$/.test(v), errors.phone),
    message: z.string().trim().min(5, errors.message).max(5000),
    artworkId: z.coerce.number().int().positive().optional().catch(undefined),
  });

// Limitation simple contre les envois en rafale (par IP, en mémoire)
const recent = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

export async function sendInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(
    ["name", "email", "phone", "message", "artworkId"].map((k) => [k, String(formData.get(k) ?? "")]),
  );

  const lang = toLocale(formData.get("lang"));
  const t = getDictionary(lang).form;

  // Champ piège invisible : rempli uniquement par les robots
  if (formData.get("website")) return { ok: true };

  const parsed = schemaFor(t.errors).safeParse(raw);
  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["errors"]>;
      errors[key] ??= issue.message;
    }
    return { ok: false, errors, values: raw };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (tooMany(ip)) {
    return { ok: false, message: t.errors.tooMany, values: raw };
  }

  const { name, email, phone, message, artworkId } = parsed.data;
  const artwork = artworkId ? await prisma.artwork.findUnique({ where: { id: artworkId } }) : null;

  await prisma.inquiry.create({
    data: {
      artworkId: artwork?.id ?? null,
      visitorName: name,
      visitorEmail: email,
      visitorPhone: phone,
      message,
      locale: lang,
    },
  });

  const site = process.env.SITE_URL || "http://localhost:3000";
  const about = artwork
    ? `Œuvre : ${artwork.title} (${artworkReference(artwork.id)})\nStatut : ${STATUS_LABELS[toStatus(artwork.status)]} · ${formatPrice(artwork.price)}\n${site}/oeuvres/${artwork.slug}\n\n`
    : "";
  // Le galeriste sait ainsi dans quelle langue répondre
  const language = lang === "en" ? "Langue du visiteur : anglais (site en anglais)\n" : "";

  try {
    await notifyGallery({
      subject: `${lang === "en" ? "[EN] " : ""}${
        artwork
          ? `Nouvelle demande · ${artwork.title} (${artworkReference(artwork.id)})`
          : `Nouvelle demande de contact · ${name}`
      }`,
      replyTo: email,
      text: `${about}${language}De : ${name}\nEmail : ${email}\nTéléphone : ${phone || "—"}\n\n${message}\n\n—\nToutes les demandes : ${site}/admin/demandes`,
    });
  } catch (e) {
    // La demande est enregistrée en base même si l'email échoue
    console.error("Échec de l'envoi de la notification email", e);
  }

  return { ok: true };
}
