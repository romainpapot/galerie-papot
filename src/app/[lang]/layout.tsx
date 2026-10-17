import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "../globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Tracker } from "@/components/Tracker";
import { getDictionary } from "@/lib/dictionaries";
import { LOCALES } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  const t = getDictionary(lang);
  return {
    title: { default: t.meta.title, template: "%s · Galerie Papot" },
    description: t.meta.description,
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    openGraph: { locale: lang === "en" ? "en_GB" : "fr_FR", siteName: "Galerie Papot" },
  };
}

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
};

export default async function SiteLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  const t = getDictionary(lang);

  return (
    <html lang={lang}>
      <body className="min-h-dvh">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          {t.skipToContent}
        </a>
        <Header lang={lang} />
        <main id="contenu">{children}</main>
        <Footer lang={lang} />
        <Tracker />
      </body>
    </html>
  );
}
