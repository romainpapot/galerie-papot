import { NextResponse, type NextRequest } from "next/server";

/*
 * Langue du site public. Les pages sont rangées dans app/[lang] :
 * - /en/…        → servi tel quel (anglais) ;
 * - /fr/…        → redirigé vers l'adresse sans préfixe (le français n'en a pas) ;
 * - /…           → réécrit en interne vers /fr/…, sauf si le visiteur préfère l'anglais
 *                  (choix mémorisé par le sélecteur, sinon navigateur dans une autre
 *                  langue que le français) : il est alors redirigé vers /en/….
 * Les valeurs sont recopiées de src/lib/i18n.ts : le proxy ne doit pas dépendre du code de l'application.
 */
const LOCALE_COOKIE = "lang";

function prefersEnglish(request: NextRequest) {
  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  if (chosen === "fr" || chosen === "en") return chosen === "en";

  // Sans en-tête (robots d'indexation notamment), on reste sur le français
  const header = request.headers.get("accept-language");
  if (!header) return false;
  const languages = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q === undefined ? 1 : Number(q) || 0 };
    })
    .filter((l) => l.tag && l.q > 0)
    .sort((a, b) => b.q - a.q);
  if (!languages.length) return false;
  // Public international : toute langue préférée autre que le français mène à l'anglais
  return !languages[0].tag.startsWith("fr") && languages[0].tag !== "*";
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  if (/^\/en(\/|$)/.test(pathname)) return NextResponse.next();

  if (/^\/fr(\/|$)/.test(pathname)) {
    url.pathname = pathname.slice(3) || "/";
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, "fr", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return response;
  }

  if (prefersEnglish(request)) {
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    return NextResponse.redirect(url);
  }

  url.pathname = pathname === "/" ? "/fr" : `/fr${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Ni le back-office, ni l'API, ni les images et fichiers statiques
  matcher: ["/((?!_next/|api/|admin|uploads/|.*\\..*).*)"],
};
