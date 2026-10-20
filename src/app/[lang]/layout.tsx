import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "../globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DictionaryProvider } from "@/components/DictionaryProvider";
import { Tracker } from "@/components/Tracker";
import { LOCALES } from "@/lib/i18n";
import { getTranslations } from "@/lib/locale";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getTranslations();
  return {
    title: { default: t.meta.title, template: `%s · ${t.siteName}` },
    description: t.meta.description,
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    openGraph: { locale: lang === "en" ? "en_GB" : "fr_FR", siteName: t.siteName },
  };
}

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
};

export default async function SiteLayout({ children }: LayoutProps<"/[lang]">) {
  const { lang, t } = await getTranslations();

  return (
    <html lang={lang}>
      <body className="min-h-dvh">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          {t.skipToContent}
        </a>
        <DictionaryProvider value={t}>
          <Header lang={lang} />
          <main id="contenu">{children}</main>
          <Footer lang={lang} t={t} />
          <Tracker />
        </DictionaryProvider>
      </body>
    </html>
  );
}
