import "server-only";
import nodemailer from "nodemailer";

type Mail = { subject: string; text: string; replyTo?: string };

/**
 * Envoie une notification au galeriste. Sans SMTP_HOST configuré, le message
 * est affiché dans la console du serveur (pratique en développement).
 */
export async function notifyGallery({ subject, text, replyTo }: Mail) {
  const to = process.env.GALLERY_EMAIL;
  if (!process.env.SMTP_HOST || !to) {
    console.info(`[email non envoyé : SMTP non configuré]\nÀ : ${to ?? "?"}\nObjet : ${subject}\n\n${text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || to,
    to,
    replyTo,
    subject,
    text,
  });
}
