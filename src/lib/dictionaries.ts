import type { ArtworkStatus } from "./status";
import type { Locale } from "./i18n";

/*
 * Textes par défaut de l'interface publique, en français et en anglais.
 * Le dictionnaire anglais doit avoir exactement la même forme que le français
 * (vérifié par TypeScript). Chaque texte peut être remplacé depuis le back-office
 * (table site_texts, voir src/lib/site-texts.ts) : il ne contient donc que des
 * chaînes. Les variables s'écrivent {nom} et sont remplies par `fill()` ; les
 * paragraphes sont séparés par une ligne vide. Les contenus du catalogue (titres,
 * descriptions, thèmes) sont traduits dans le back-office, pas ici.
 */

const fr = {
  siteName: "Galerie Papot",
  meta: {
    title: "Galerie Papot — Peintures originales",
    description:
      "Galerie d'art en ligne : peintures originales et colorées. Découvrez les dernières œuvres, leur disponibilité et contactez la galerie.",
  },
  skipToContent: "Aller au contenu",
  nav: {
    artworks: "Œuvres",
    approach: "Démarche",
    contact: "Contact",
    main: "Navigation principale",
    mobile: "Navigation mobile",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    language: "Langue",
  },
  footer: {
    tagline: "Peintures originales · Pièces uniques",
    label: "Pied de page",
    admin: "Espace galeriste",
  },
  status: { DISPONIBLE: "Disponible", RESERVE: "Réservé", VENDU: "Vendu" } satisfies Record<ArtworkStatus, string>,
  priceOnRequest: "Prix sur demande",
  card: { new: "Nouveau", sold: "Œuvre vendue" },
  home: {
    eyebrow: "Peintures originales",
    titleLine1: "La couleur",
    titleLine2: "comme langage",
    intro: "Des œuvres uniques, vibrantes et joyeuses, à découvrir et à accueillir chez vous.",
    discover: "Découvrir les œuvres",
    news: "Nouveautés",
    allArtworks: "Toutes les œuvres →",
    comingSoon: "Les premières œuvres arrivent bientôt.",
    approach: "Démarche",
    approachText:
      "Chaque toile naît d'une émotion simple : la lumière d'un fruit, l'éclat d'une carrosserie, le regard d'un animal. La couleur y est un point de départ, jamais un décor.\n\nPeintes à l'acrylique, à l'huile ou à la gouache, les œuvres sont toutes des pièces uniques, signées et accompagnées d'un certificat d'authenticité.",
    contactGallery: "Contacter la galerie",
    artists: "Les artistes",
    artistWorks: "Voir les œuvres →",
    themes: "Thèmes",
    artworkCountOne: "{n} œuvre",
    artworkCountMany: "{n} œuvres",
  },
  catalogue: {
    title: "Œuvres",
    description: "Catalogue des peintures de la Galerie Papot, filtrables par thème.",
    intro: "L'ensemble du travail de l'atelier. Les œuvres vendues sont conservées ici en archive.",
    allThemes: "Tous les thèmes",
    filterByTheme: "Filtrer par thème",
    allArtists: "Tous les artistes",
    filterByArtist: "Filtrer par artiste",
    availableOnly: "Disponibles uniquement",
    availability: "Disponibilité",
    all: "Toutes",
    available: "Disponibles",
    countOne: "{n} œuvre",
    countMany: "{n} œuvres",
    empty: "Aucune œuvre ne correspond à ces critères.",
  },
  artwork: {
    breadcrumb: "Fil d'Ariane",
    by: "par",
    artistWorks: "Voir les œuvres de {name}",
    medium: "Technique",
    support: "Support",
    dimensions: "Dimensions",
    theme: "Thème",
    reference: "Référence",
    statement: "Note d'intention",
    related: "Dans le même thème",
    zoom: "Agrandir l'image",
    view: "Vue {n}",
    viewOf: "{title}, vue {n}",
    otherViews: "Autres vues",
    close: "Fermer",
  },
  action: {
    contact: "Se positionner / Contacter la galerie",
    reserved: "Actuellement réservé",
    reservedNote: "Une option est en cours sur cette œuvre.",
    waitlist: "Être placé en liste d'attente",
    sold: "Œuvre vendue",
    soldNote: "Cette œuvre a trouvé sa place chez un collectionneur.",
    similar: "Demander une réédition ou une œuvre dans le même esprit",
  },
  contact: {
    title: "Contact",
    description: "Contactez la Galerie Papot pour une œuvre, une réservation ou une commande.",
    intro: "Une question, une envie de commande ou de visite d'atelier ? Écrivez-nous.",
    introSold:
      "Cette œuvre est vendue, mais la galerie peut vous proposer une réédition ou une création dans le même esprit.",
    introReserved: "Cette œuvre fait l'objet d'une option. Laissez vos coordonnées pour être prévenu si elle se libère.",
    introAvailable: "Vous souhaitez acquérir cette œuvre ou en savoir plus ? La galerie vous répond rapidement.",
    reference: "« {title} » (réf. {ref})",
    messageSold:
      "Bonjour,\n\nL'œuvre {ref} m'a beaucoup plu. Serait-il possible d'envisager une réédition ou une œuvre dans le même style ?",
    messageReserved: "Bonjour,\n\nJe souhaite être placé en liste d'attente pour l'œuvre {ref}.",
    messageAvailable: "Bonjour,\n\nJe suis intéressé par l'œuvre {ref} et souhaiterais me positionner.",
    ref: "Réf.",
  },
  form: {
    thanks: "Merci !",
    sent: "Votre message a bien été envoyé. La galerie vous répondra dans les meilleurs délais.",
    website: "Site web",
    name: "Nom",
    phone: "Téléphone",
    optional: "Facultatif",
    email: "Email",
    message: "Message",
    sending: "Envoi…",
    send: "Envoyer le message",
    errors: {
      name: "Merci d'indiquer votre nom.",
      email: "Adresse email invalide.",
      phone: "Numéro de téléphone invalide.",
      message: "Votre message est un peu court.",
      tooMany: "Trop de messages envoyés. Merci de réessayer plus tard.",
    },
  },
  notFound: {
    title: "Introuvable",
    text: "Cette page ou cette œuvre n'existe pas (ou plus).",
    action: "Voir les œuvres",
  },
};

export type Dictionary = typeof fr;

const en: Dictionary = {
  siteName: "Galerie Papot",
  meta: {
    title: "Galerie Papot — Original paintings",
    description:
      "Online art gallery: original, colourful paintings. Discover the latest works, check their availability and get in touch with the gallery.",
  },
  skipToContent: "Skip to content",
  nav: {
    artworks: "Artworks",
    approach: "Approach",
    contact: "Contact",
    main: "Main navigation",
    mobile: "Mobile navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
  },
  footer: {
    tagline: "Original paintings · One-of-a-kind pieces",
    label: "Footer",
    admin: "Gallery login",
  },
  status: { DISPONIBLE: "Available", RESERVE: "Reserved", VENDU: "Sold" },
  priceOnRequest: "Price on request",
  card: { new: "New", sold: "Sold" },
  home: {
    eyebrow: "Original paintings",
    titleLine1: "Colour",
    titleLine2: "as a language",
    intro: "Unique, vibrant and joyful works to discover and welcome into your home.",
    discover: "Discover the artworks",
    news: "New works",
    allArtworks: "All artworks →",
    comingSoon: "The first works are coming soon.",
    approach: "Approach",
    approachText:
      "Each canvas is born from a simple emotion: the glow of a piece of fruit, the gleam of a car's bodywork, the gaze of an animal. Colour is always the starting point, never mere decoration.\n\nPainted in acrylic, oil or gouache, every work is a signed, one-of-a-kind piece delivered with a certificate of authenticity.",
    contactGallery: "Contact the gallery",
    artists: "The artists",
    artistWorks: "See the works →",
    themes: "Themes",
    artworkCountOne: "{n} artwork",
    artworkCountMany: "{n} artworks",
  },
  catalogue: {
    title: "Artworks",
    description: "Catalogue of paintings by Galerie Papot, filterable by theme.",
    intro: "The complete work of the studio. Sold works are kept here as an archive.",
    allThemes: "All themes",
    filterByTheme: "Filter by theme",
    allArtists: "All artists",
    filterByArtist: "Filter by artist",
    availableOnly: "Available only",
    availability: "Availability",
    all: "All",
    available: "Available",
    countOne: "{n} artwork",
    countMany: "{n} artworks",
    empty: "No artwork matches these criteria.",
  },
  artwork: {
    breadcrumb: "Breadcrumb",
    by: "by",
    artistWorks: "See works by {name}",
    medium: "Medium",
    support: "Support",
    dimensions: "Dimensions",
    theme: "Theme",
    reference: "Reference",
    statement: "Artist's statement",
    related: "More in this theme",
    zoom: "Enlarge image",
    view: "View {n}",
    viewOf: "{title}, view {n}",
    otherViews: "Other views",
    close: "Close",
  },
  action: {
    contact: "Express interest / Contact the gallery",
    reserved: "Currently reserved",
    reservedNote: "This work is currently on hold.",
    waitlist: "Join the waiting list",
    sold: "Sold",
    soldNote: "This work has found its home with a collector.",
    similar: "Ask for a new edition or a work in the same spirit",
  },
  contact: {
    title: "Contact",
    description: "Contact Galerie Papot about an artwork, a reservation or a commission.",
    intro: "A question, a commission or a studio visit in mind? Write to us.",
    introSold: "This work has been sold, but the gallery can offer you a new edition or a creation in the same spirit.",
    introReserved: "This work is currently on hold. Leave your details to be notified if it becomes available.",
    introAvailable: "Would you like to acquire this work or find out more? The gallery will get back to you quickly.",
    reference: "“{title}” (ref. {ref})",
    messageSold: "Hello,\n\nI really liked the work {ref}. Would a new edition or a work in the same style be possible?",
    messageReserved: "Hello,\n\nI would like to be placed on the waiting list for the work {ref}.",
    messageAvailable: "Hello,\n\nI am interested in the work {ref} and would like to express my interest.",
    ref: "Ref.",
  },
  form: {
    thanks: "Thank you!",
    sent: "Your message has been sent. The gallery will reply as soon as possible.",
    website: "Website",
    name: "Name",
    phone: "Phone",
    optional: "Optional",
    email: "Email",
    message: "Message",
    sending: "Sending…",
    send: "Send message",
    errors: {
      name: "Please enter your name.",
      email: "Invalid email address.",
      phone: "Invalid phone number.",
      message: "Your message is a little short.",
      tooMany: "Too many messages sent. Please try again later.",
    },
  },
  notFound: {
    title: "Not found",
    text: "This page or artwork does not exist (or no longer exists).",
    action: "See the artworks",
  },
};

const dictionaries: Record<Locale, Dictionary> = { fr, en };

/** Textes par défaut (sans les modifications du back-office : voir getTranslations côté serveur). */
export function getDictionary(lang: Locale) {
  return dictionaries[lang];
}

/** Clés des textes, ex. « home.intro » ou « form.errors.name ». */
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TextKey = Leaves<Dictionary>;

/** Remplace les variables {nom} d'un texte. */
export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Choisit la forme singulier / pluriel (« 0 œuvre », « 2 œuvres ») et remplit {n}. */
export function plural(n: number, one: string, many: string) {
  return fill(n > 1 ? many : one, { n });
}

/** Paragraphes d'un texte long (séparés par une ligne vide). */
export function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
