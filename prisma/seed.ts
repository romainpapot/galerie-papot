/**
 * Données de démonstration : thèmes, listes, œuvres (avec visuels générés) et
 * compte administrateur. Relancer `npm run db:seed` réinitialise le catalogue
 * (artistes compris).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";

const prisma = new PrismaClient();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");

// Générateur pseudo-aléatoire déterministe (mêmes visuels à chaque seed)
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Composition abstraite colorée servant de visuel provisoire. */
async function demoImage(name: string, palette: string[], w: number, h: number, seed: number) {
  const rand = rng(seed);
  const shapes = Array.from({ length: 14 }, (_, i) => {
    const c = palette[i % palette.length];
    const cx = Math.round(rand() * w);
    const cy = Math.round(rand() * h);
    const rx = Math.round((0.15 + rand() * 0.35) * w);
    const ry = Math.round((0.1 + rand() * 0.3) * h);
    const rot = Math.round(rand() * 180);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${(0.55 + rand() * 0.4).toFixed(2)}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  }).join("");
  const strokes = Array.from({ length: 6 }, () => {
    const x1 = Math.round(rand() * w), y1 = Math.round(rand() * h);
    const x2 = Math.round(rand() * w), y2 = Math.round(rand() * h);
    return `<path d="M${x1} ${y1} Q ${Math.round(rand() * w)} ${Math.round(rand() * h)} ${x2} ${y2}" stroke="${palette[Math.floor(rand() * palette.length)]}" stroke-width="${Math.round(8 + rand() * 30)}" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><filter id="soft"><feGaussianBlur stdDeviation="${Math.round(w / 90)}"/></filter></defs>
    <rect width="100%" height="100%" fill="${palette[0]}"/>
    <g filter="url(#soft)">${shapes}</g>${strokes}
  </svg>`;

  await mkdir(uploadDir, { recursive: true });
  const file = `demo-${name}.webp`;
  await writeFile(path.join(uploadDir, file), await sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer());
  return `/uploads/${file}`;
}

const themes = [
  { name: "Voitures", nameEn: "Cars", slug: "voitures" },
  { name: "Fruits", nameEn: "Fruit", slug: "fruits" },
  { name: "Animaux", nameEn: "Animals", slug: "animaux" },
  { name: "Portraits", nameEn: "Portraits", slug: "portraits" },
];

const P = {
  sun: ["#f6c445", "#e94f37", "#3f88c5", "#1b998b", "#f7f0e1"],
  citrus: ["#ffe066", "#f25f5c", "#70c1b3", "#247ba0", "#50514f"],
  jungle: ["#0b6e4f", "#f4d35e", "#ee964b", "#f95738", "#08a045"],
  night: ["#1d3557", "#e63946", "#f1faee", "#a8dadc", "#ffb703"],
  pop: ["#ff006e", "#fb5607", "#ffbe0b", "#3a86ff", "#8338ec"],
};

const artworks = [
  { title: "Cabriolet au soleil couchant", theme: "voitures", palette: P.sun, ratio: [3, 2], medium: "Acrylique", support: "Toile de lin", dimensions: "120 × 80 cm", price: 2400, status: "DISPONIBLE", isNew: true, description: "Une décapotable des années 60 saisie dans la lumière rasante de la fin d'été. Les aplats de couleurs vives évoquent la vitesse et la nostalgie des routes du Sud.", en: { title: "Convertible at Sunset", medium: "Acrylic", support: "Linen canvas", description: "A 1960s convertible caught in the low light of late summer. Flat areas of vivid colour evoke speed and nostalgia for the roads of the South of France." } },
  { title: "Coccinelle turquoise", theme: "voitures", palette: P.pop, ratio: [1, 1], medium: "Huile", support: "Toile", dimensions: "80 × 80 cm", price: 1600, status: "RESERVE", isNew: true, description: "Hommage à une icône populaire, réinterprétée dans une palette pop et joyeuse.", en: { title: "Turquoise Beetle", medium: "Oil", support: "Canvas", description: "A tribute to a popular icon, reinterpreted in a joyful pop palette." } },
  { title: "Grand Prix", theme: "voitures", palette: P.night, ratio: [2, 1], medium: "Acrylique et posca", support: "Bois", dimensions: "150 × 75 cm", price: 3200, status: "VENDU", isNew: false, description: "L'effervescence d'une ligne de départ, entre bruit des moteurs et éclats de couleur.", en: { title: "Grand Prix", medium: "Acrylic and Posca", support: "Wood", description: "The buzz of a starting grid, between roaring engines and bursts of colour." } },
  { title: "Agrumes de Menton", theme: "fruits", palette: P.citrus, ratio: [4, 5], medium: "Gouache", support: "Papier 300 g", dimensions: "40 × 50 cm", price: 680, status: "DISPONIBLE", isNew: true, description: "Citrons et oranges éclatants, peints sur le vif lors de la fête du citron.", en: { title: "Menton Citrus", medium: "Gouache", support: "300 gsm paper", description: "Bright lemons and oranges, painted from life during the Menton Lemon Festival." } },
  { title: "Pastèque d'été", theme: "fruits", palette: P.pop, ratio: [1, 1], medium: "Acrylique", support: "Toile", dimensions: "60 × 60 cm", price: 890, status: "DISPONIBLE", isNew: false, description: "Une tranche de fraîcheur, généreuse et graphique.", en: { title: "Summer Watermelon", medium: "Acrylic", support: "Canvas", description: "A slice of freshness, generous and graphic." } },
  { title: "Corbeille de cerises", theme: "fruits", palette: P.sun, ratio: [3, 4], medium: "Huile", support: "Toile de lin", dimensions: "60 × 80 cm", price: 1200, status: "VENDU", isNew: false, description: "Nature morte contemporaine aux rouges profonds.", en: { title: "Basket of Cherries", medium: "Oil", support: "Linen canvas", description: "A contemporary still life in deep reds." } },
  { title: "Le flamant rose", theme: "animaux", palette: P.pop, ratio: [2, 3], medium: "Acrylique", support: "Toile", dimensions: "80 × 120 cm", price: 2100, status: "DISPONIBLE", isNew: true, description: "Élégance et déséquilibre : un flamant rose sur une patte, dans un décor tropical imaginaire.", en: { title: "The Flamingo", medium: "Acrylic", support: "Canvas", description: "Elegance and imbalance: a flamingo on one leg, in an imaginary tropical setting." } },
  { title: "Toucan", theme: "animaux", palette: P.jungle, ratio: [4, 5], medium: "Encre et acrylique", support: "Papier marouflé sur toile", dimensions: "50 × 65 cm", price: 950, status: "RESERVE", isNew: false, description: "Le bec du toucan comme un éclat de soleil au cœur de la jungle.", en: { title: "Toucan", medium: "Ink and acrylic", support: "Paper mounted on canvas", description: "The toucan's beak like a burst of sunlight in the heart of the jungle." } },
  { title: "Le lion bleu", theme: "animaux", palette: P.night, ratio: [1, 1], medium: "Huile", support: "Toile", dimensions: "100 × 100 cm", price: null, status: "DISPONIBLE", isNew: false, description: "Un portrait de fauve tout en puissance, où le bleu remplace l'or attendu.", en: { title: "The Blue Lion", medium: "Oil", support: "Canvas", description: "A portrait of a big cat full of power, where blue replaces the expected gold." } },
  { title: "Regard d'Afrique", theme: "portraits", palette: P.sun, ratio: [3, 4], medium: "Huile", support: "Toile", dimensions: "75 × 100 cm", price: 2800, status: "DISPONIBLE", isNew: false, description: "Portrait intense aux couleurs chaudes, entre force et douceur.", en: { title: "African Gaze", medium: "Oil", support: "Canvas", description: "An intense portrait in warm colours, between strength and gentleness." } },
  { title: "Jeune fille au foulard", theme: "portraits", palette: P.citrus, ratio: [4, 5], medium: "Pastel à l'huile", support: "Papier", dimensions: "40 × 50 cm", price: 540, status: "VENDU", isNew: false, description: "Un clin d'œil aux maîtres flamands, revisité en couleurs acidulées.", en: { title: "Girl with a Headscarf", medium: "Oil pastel", support: "Paper", description: "A nod to the Flemish masters, revisited in tangy colours." } },
] as const;

async function main() {
  await prisma.inquiry.deleteMany();
  await prisma.artworkImage.deleteMany();
  await prisma.artwork.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.listOption.deleteMany();
  await prisma.artist.deleteMany();

  const themeIds = new Map<string, number>();
  for (const t of themes) themeIds.set(t.slug, (await prisma.theme.create({ data: t })).id);

  // Valeurs des listes (type de peinture, support, dimensions), créées une seule fois chacune
  const optionIds = new Map<string, number>();
  async function option(kind: string, name: string, nameEn = "") {
    const key = `${kind}:${name}`;
    if (!optionIds.has(key)) optionIds.set(key, (await prisma.listOption.create({ data: { kind, name, nameEn } })).id);
    return optionIds.get(key)!;
  }

  for (const [i, a] of artworks.entries()) {
    const [rw, rh] = a.ratio;
    const base = 1600;
    const w = rw >= rh ? base : Math.round((base * rw) / rh);
    const h = rw >= rh ? Math.round((base * rh) / rw) : base;
    const slug = a.title
      .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const imageUrl = await demoImage(`${i + 1}`, [...a.palette], w, h, i * 97 + 13);
    const detail = await demoImage(`${i + 1}-detail`, [...a.palette].reverse(), 1200, 1200, i * 31 + 7);

    await prisma.artwork.create({
      data: {
        slug,
        title: a.title,
        description: a.description,
        titleEn: a.en.title,
        descriptionEn: a.en.description,
        mediumId: await option("MEDIUM", a.medium, a.en.medium),
        supportId: await option("SUPPORT", a.support, a.en.support),
        dimensionsId: await option("DIMENSIONS", a.dimensions),
        price: a.price,
        status: a.status,
        isNew: a.isNew,
        imageUrl,
        themeId: themeIds.get(a.theme)!,
        // Dates décalées pour que les dernières œuvres soient les plus récentes
        createdAt: new Date(Date.now() - (artworks.length - i) * 86400000 * 3),
        images: { create: [{ url: detail, position: 0 }] },
      },
    });
  }

  const username = process.env.ADMIN_USERNAME || "galerie";
  const password = process.env.ADMIN_PASSWORD || "changez-ce-mot-de-passe";
  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash: await bcrypt.hash(password, 12) },
    create: { username, passwordHash: await bcrypt.hash(password, 12) },
  });

  console.log(`✓ ${themes.length} thèmes, ${optionIds.size} valeurs de listes, ${artworks.length} œuvres, compte admin « ${username} »`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
