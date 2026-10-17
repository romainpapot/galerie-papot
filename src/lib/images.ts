import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];

export function uploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR || "uploads");
}

/**
 * Enregistre une image envoyée depuis le back-office : redimensionnée à
 * 2400 px max (largeur ou hauteur), convertie en WebP haute qualité.
 * Renvoie l'URL publique (/uploads/…).
 */
export async function saveImage(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error(`Format non pris en charge (${file.type || "inconnu"}). Utilisez JPEG, PNG ou WebP.`);
  }
  if (file.size > MAX_BYTES) throw new Error("Image trop lourde (20 Mo maximum).");

  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer();

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(dir, name), output);
  return `/uploads/${name}`;
}

export async function deleteImage(url: string) {
  if (!url.startsWith("/uploads/")) return;
  const name = path.basename(url);
  try {
    await unlink(path.join(uploadDir(), name));
  } catch {
    // fichier déjà absent : rien à faire
  }
}

/** Fichiers non vides d'un champ <input type="file" multiple>. */
export function filesFrom(formData: FormData, field: string) {
  return formData
    .getAll(field)
    .filter((v): v is File => v instanceof File && v.size > 0);
}
