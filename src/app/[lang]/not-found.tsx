import Link from "next/link";
import { localePath } from "@/lib/i18n";
import { getTranslations } from "@/lib/locale";

export default async function NotFound() {
  const { lang, t } = await getTranslations();
  return (
    <div className="container-page py-32 text-center">
      <p className="font-serif text-6xl">{t.notFound.title}</p>
      <p className="mt-4 text-muted">{t.notFound.text}</p>
      <Link href={localePath(lang, "/oeuvres")} className="btn btn-primary mt-8">{t.notFound.action}</Link>
    </div>
  );
}
