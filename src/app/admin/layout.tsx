import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "../globals.css";

// Layout racine du back-office (toujours en français) ; le site public a le sien dans app/[lang].
export const metadata: Metadata = {
  title: { default: "Galerie Papot", template: "%s · Galerie Papot" },
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
