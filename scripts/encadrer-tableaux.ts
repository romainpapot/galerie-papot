/**
 * Prépare les photos des tableaux : recadrage, luminosité harmonisée,
 * cadre noir et fond blanc.
 *
 *   npm run photos:encadrer            → traite toutes les photos de a-traiter/
 *   npm run photos:encadrer -- x.jpg   → traite seulement les fichiers indiqués
 *
 * Réglages facultatifs par photo dans photos-tableaux/reglages.json :
 *   {
 *     "IMG_1234.jpg": {
 *       "recadrage": { "left": 120, "top": 80, "width": 2400, "height": 3000 },
 *       "rotation": 1.5,          // degrés, pour redresser une photo penchée
 *       "luminosite": 0.05,       // correction manuelle (-0.3 à 0.3)
 *       "balanceBlancs": 0.5      // 0 = aucune, 1 = neutralisation complète
 *     }
 *   }
 * Le recadrage s'exprime en pixels de la photo une fois orientée (EXIF).
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "photos-tableaux");
const SOURCE_DIR = path.join(ROOT, "a-traiter");
const OUTPUT_DIR = path.join(ROOT, "traitees");
const SETTINGS_FILE = path.join(ROOT, "reglages.json");

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic", ".heif"]);

/** Plus grand côté du tableau (hors cadre) dans l'image finale. */
const MAX_SIDE = 2400;
/** Épaisseur du cadre noir et de la marge blanche, en part du plus petit côté. */
const FRAME_RATIO = 0.035;
const MARGIN_RATIO = 0.08;
const FRAME_COLOR = { r: 17, g: 17, b: 17 };
const BACKGROUND = { r: 255, g: 255, b: 255 };

/** Luminance médiane visée et force du rapprochement (0 = aucun, 1 = total). */
const TARGET_MEDIAN = 0.47;
const MEDIAN_STRENGTH = 0.6;
/** Percentiles utilisés pour étirer les niveaux (noir / blanc). */
const LOW_PERCENTILE = 0.005;
const HIGH_PERCENTILE = 0.995;
/** Multiplication maximale du contraste lors de l'étirement des niveaux. */
const MAX_STRETCH = 1.5;
const DEFAULT_WHITE_BALANCE = 0.5;
const MAX_WB_GAIN = 0.15;

type Crop = { left: number; top: number; width: number; height: number };
type Settings = {
  recadrage?: Crop;
  rotation?: number;
  luminosite?: number;
  balanceBlancs?: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

async function loadSettings(): Promise<Record<string, Settings>> {
  try {
    return JSON.parse(await fs.readFile(SETTINGS_FILE, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw new Error(`reglages.json illisible : ${(err as Error).message}`);
  }
}

function percentile(histogram: Uint32Array, total: number, p: number) {
  const target = total * p;
  let sum = 0;
  for (let i = 0; i < histogram.length; i++) {
    sum += histogram[i];
    if (sum >= target) return i;
  }
  return histogram.length - 1;
}

/** Harmonise balance des blancs, niveaux et luminosité. */
function harmonize(data: Buffer, channels: number, settings: Settings) {
  const pixels = data.length / channels;

  // Balance des blancs « monde gris » partielle et bornée : un tableau n'est pas
  // neutre, on corrige seulement la dominante de l'éclairage.
  const means = [0, 0, 0];
  for (let i = 0; i < data.length; i += channels) {
    means[0] += data[i];
    means[1] += data[i + 1];
    means[2] += data[i + 2];
  }
  const gray = (means[0] + means[1] + means[2]) / 3;
  const wb = clamp(settings.balanceBlancs ?? DEFAULT_WHITE_BALANCE, 0, 1);
  const gains = means.map((m) =>
    m > 0 ? 1 + clamp((gray / m - 1) * wb, -MAX_WB_GAIN, MAX_WB_GAIN) : 1,
  );
  const luminance = (i: number) =>
    0.2126 * data[i] * gains[0] + 0.7152 * data[i + 1] * gains[1] + 0.0722 * data[i + 2] * gains[2];

  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += channels) histogram[clamp(Math.round(luminance(i)), 0, 255)]++;
  let low = percentile(histogram, pixels, LOW_PERCENTILE);
  let high = Math.max(low + 1, percentile(histogram, pixels, HIGH_PERCENTILE));
  const median = percentile(histogram, pixels, 0.5);

  // Étirement des niveaux plafonné : une photo peu contrastée gagne du contraste
  // sans que les couleurs du tableau ne soient dénaturées.
  const minRange = 255 / MAX_STRETCH;
  if (high - low < minRange) {
    const center = clamp((low + high) / 2, minRange / 2, 255 - minRange / 2);
    low = center - minRange / 2;
    high = center + minRange / 2;
  }

  // Gamma qui rapproche la médiane (après étirement) de la cible.
  const stretchedMedian = clamp((median - low) / (high - low), 0.02, 0.98);
  const target =
    stretchedMedian + (TARGET_MEDIAN - stretchedMedian) * MEDIAN_STRENGTH + (settings.luminosite ?? 0);
  const gamma = Math.log(clamp(target, 0.05, 0.95)) / Math.log(stretchedMedian);

  // Courbe appliquée à la luminance ; les trois canaux sont multipliés par le
  // même rapport, ce qui conserve les teintes.
  const curve = new Float32Array(256);
  for (let v = 0; v < 256; v++) curve[v] = 255 * Math.pow(clamp((v - low) / (high - low), 0, 1), gamma);

  for (let i = 0; i < data.length; i += channels) {
    const y = luminance(i);
    const yi = Math.min(255, Math.floor(y));
    const target = curve[yi] + (curve[Math.min(255, yi + 1)] - curve[yi]) * (y - yi);
    const ratio = y > 0.5 ? target / y : 0;
    for (let c = 0; c < 3; c++) data[i + c] = clamp(Math.round(data[i + c] * gains[c] * ratio), 0, 255);
  }
  return { gains, low: Math.round(low), high: Math.round(high), median, gamma };
}

async function processFile(file: string, settings: Settings) {
  let image = sharp(path.join(SOURCE_DIR, file)).rotate();
  if (settings.recadrage) image = sharp(await image.extract(settings.recadrage).toBuffer());
  if (settings.rotation) {
    image = sharp(await image.rotate(settings.rotation, { background: BACKGROUND }).toBuffer());
  }

  const { data, info } = await image
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const stats = harmonize(data, info.channels, settings);

  const frame = Math.round(Math.min(info.width, info.height) * FRAME_RATIO);
  const framed = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .extend({ top: frame, bottom: frame, left: frame, right: frame, background: FRAME_COLOR })
    .png()
    .toBuffer();
  const margin = Math.round(Math.min(info.width, info.height) * MARGIN_RATIO);

  const output = path.join(OUTPUT_DIR, `${path.parse(file).name}.jpg`);
  await sharp(framed)
    .extend({ top: margin, bottom: margin, left: margin, right: margin, background: BACKGROUND })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(output);

  console.log(
    `✓ ${file} → traitees/${path.basename(output)}  ` +
      `(niveaux ${stats.low}–${stats.high}, médiane ${stats.median}, gamma ${stats.gamma.toFixed(2)}, ` +
      `gains ${stats.gains.map((g) => g.toFixed(2)).join("/")})`,
  );
}

async function main() {
  const requested = process.argv.slice(2);
  const files = requested.length
    ? requested.map((f) => path.basename(f))
    : (await fs.readdir(SOURCE_DIR)).filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase())).sort();

  if (!files.length) {
    console.log("Aucune photo dans photos-tableaux/a-traiter/.");
    return;
  }

  const settings = await loadSettings();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let failures = 0;
  for (const file of files) {
    try {
      await processFile(file, settings[file] ?? {});
    } catch (err) {
      failures++;
      console.error(`✗ ${file} : ${(err as Error).message}`);
    }
  }
  if (failures) process.exitCode = 1;
}

main();
