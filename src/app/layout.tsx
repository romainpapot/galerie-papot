import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Galerie Papot — Peintures originales",
    template: "%s · Galerie Papot",
  },
  description:
    "Galerie d'art en ligne : peintures originales et colorées. Découvrez les dernières œuvres, leur disponibilité et contactez la galerie.",
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
