/**
 * Prépare les photos des tableaux : recadrage, luminosité harmonisée,
 * cadre noir et fond blanc.
 *
 *   npm run photos:encadrer            → traite toutes les photos de a-traiter/
 *   npm run photos:encadrer -- x.jpg   → traite seulement les fichiers indiqués
 *
 * Le tableau est repéré automatiquement sur le mur (4 coins de la toile), puis
 * redressé (correction de perspective). Les coins détectés sont enregistrés dans
 * photos-tableaux/reglages.json et un aperçu est écrit dans photos-tableaux/apercus/ ;
 * on peut corriger les coins à la main puis relancer.
 *
 * Réglages par photo dans photos-tableaux/reglages.json :
 *   {
 *     "IMG_1234.jpg": {
 *       "coins": [[x, y], [x, y], [x, y], [x, y]],  // haut-gauche, haut-droit, bas-droit, bas-gauche
 *       "recadrage": { "left": 120, "top": 80, "width": 2400, "height": 3000 },  // à la place des coins
 *       "rotation": 1.5,          // degrés, pour redresser une photo penchée
 *       "luminosite": 0.1,        // correction manuelle d'exposition (-0.5 à 0.5, soit ±50 %)
 *       "balanceBlancs": 1        // 0 = aucune, 1 = mur rendu parfaitement neutre
 *     }
 *   }
 * Coins et recadrage s'expriment en pixels de la photo une fois orientée (EXIF).
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

const ROOT = path.join(process.cwd(), "photos-tableaux");
const SOURCE_DIR = path.join(ROOT, "a-traiter");
const OUTPUT_DIR = path.join(ROOT, "traitees");
const SETTINGS_FILE = path.join(ROOT, "reglages.json");
const PREVIEW_DIR = path.join(ROOT, "apercus");

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic", ".heif"]);

/** Plus grand côté du tableau (hors cadre) dans l'image finale. */
const MAX_SIDE = 2400;
/** Épaisseur du cadre noir et de la marge blanche, en part du plus petit côté. */
const FRAME_RATIO = 0.035;
const MARGIN_RATIO = 0.08;
const FRAME_COLOR = { r: 17, g: 17, b: 17 };
const BACKGROUND = { r: 255, g: 255, b: 255 };

/**
 * Harmonisation : le mur blanc autour du tableau sert de référence. Il est rendu
 * neutre et amené à la même luminosité sur toutes les photos, ce qui uniformise
 * l'éclairage sans modifier le contenu des œuvres (un tableau sombre reste sombre).
 */
const WALL_TARGET = 228;
const MAX_WB_GAIN = 0.25;
const EXPOSURE_RANGE: [number, number] = [0.6, 2.2];
/** Seuil (lumière linéaire) au-delà duquel les hautes lumières sont adoucies. */
const HIGHLIGHT_KNEE = 0.8;
/** Anneau de mur échantillonné autour de la toile (agrandissements du contour). */
const WALL_RING: [number, number] = [1.04, 1.18];

/** Détection du tableau : taille de travail et écart minimal à la couleur du mur. */
const DETECT_SIZE = 800;
const WALL_DISTANCE = 60;
/** Retrait vers l'intérieur des coins détectés, pour ne garder aucun bout de mur. */
const CORNER_INSET = 0.006;

type Point = [number, number];
type Crop = { left: number; top: number; width: number; height: number };
type Settings = {
  coins?: Point[];
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

async function saveSettings(settings: Record<string, Settings>) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2) + "\n");
}

/**
 * Repère le tableau sur le mur : pixels qui s'écartent de la couleur du mur (estimée
 * sur le pourtour de la photo), plus grande zone connexe, puis ses 4 points extrêmes.
 */
async function detectCorners(image: Sharp, width: number, height: number): Promise<Point[]> {
  const { data, info } = await image
    .clone()
    .resize({ width: DETECT_SIZE, height: DETECT_SIZE, fit: "inside" })
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;

  // Éclairage du mur modélisé par une surface quadratique par canal, ajustée sur
  // le pourtour de la photo (le mur est rarement éclairé de façon uniforme).
  const band = Math.max(2, Math.round(Math.min(w, h) * 0.03));
  const terms = (x: number, y: number) => {
    const u = x / w - 0.5;
    const v = y / h - 0.5;
    return [1, u, v, u * u, u * v, v * v];
  };
  const normal = [0, 1, 2].map(() => Array.from({ length: 6 }, () => new Array(7).fill(0)));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= band && x < w - band && y >= band && y < h - band) continue;
      const t = terms(x, y);
      const i = (y * w + x) * channels;
      for (let c = 0; c < 3; c++) {
        for (let r = 0; r < 6; r++) {
          for (let k = 0; k < 6; k++) normal[c][r][k] += t[r] * t[k];
          normal[c][r][6] += t[r] * data[i + c];
        }
      }
    }
  }
  const wall = normal.map((m) => solve(m));

  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = terms(x, y);
      const i = (y * w + x) * channels;
      let d = 0;
      for (let c = 0; c < 3; c++) {
        const expected = wall[c].reduce((sum, coef, k) => sum + coef * t[k], 0);
        d += (data[i + c] - expected) ** 2;
      }
      mask[y * w + x] = Math.sqrt(d) > WALL_DISTANCE ? 1 : 0;
    }
  }

  // Plus grande zone connexe (parcours en largeur).
  const label = new Int32Array(w * h);
  const queue = new Int32Array(w * h);
  let best: number[] = [];
  let current = 0;
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || label[start]) continue;
    current++;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    label[start] = current;
    while (head < tail) {
      const p = queue[head++];
      const x = p % w;
      const neighbours = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w];
      for (const n of neighbours) {
        if (n >= 0 && n < w * h && mask[n] && !label[n]) {
          label[n] = current;
          queue[tail++] = n;
        }
      }
    }
    if (tail > best.length) best = Array.from(queue.subarray(0, tail));
  }
  if (best.length < w * h * 0.05) throw new Error("tableau introuvable sur la photo, indiquer les coins à la main");

  const extremes = [
    { score: (x: number, y: number) => -x - y, point: [0, 0] as Point },
    { score: (x: number, y: number) => x - y, point: [0, 0] as Point },
    { score: (x: number, y: number) => x + y, point: [0, 0] as Point },
    { score: (x: number, y: number) => -x + y, point: [0, 0] as Point },
  ].map((e) => ({ ...e, best: -Infinity }));
  for (const p of best) {
    const x = p % w;
    const y = (p - x) / w;
    for (const e of extremes) {
      const s = e.score(x + 0.5, y + 0.5);
      if (s > e.best) {
        e.best = s;
        e.point = [x + 0.5, y + 0.5];
      }
    }
  }

  const scale = width / w;
  const corners = extremes.map((e) => [e.point[0] * scale, e.point[1] * (height / h)] as Point);
  const cx = corners.reduce((sum, [x]) => sum + x, 0) / 4;
  const cy = corners.reduce((sum, [, y]) => sum + y, 0) / 4;
  return corners.map(([x, y]) => [Math.round(x + (cx - x) * CORNER_INSET * 2), Math.round(y + (cy - y) * CORNER_INSET * 2)]);
}

/** Résout un système linéaire donné sous forme de matrice augmentée (pivot de Gauss). */
function solve(m: number[][]) {
  const n = m.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

/** Résout l'homographie qui envoie le rectangle (0,0)-(w,h) sur le quadrilatère. */
function homography(w: number, h: number, quad: Point[]) {
  const src: Point[] = [[0, 0], [w, 0], [w, h], [0, h]];
  const m: number[][] = [];
  src.forEach(([x, y], k) => {
    const [u, v] = quad[k];
    m.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    m.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  });
  return [...solve(m), 1];
}

/** Redresse le quadrilatère de la toile en rectangle (interpolation bilinéaire). */
async function unwarp(image: Sharp, quad: Point[]) {
  const { data, info } = await image
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const width = Math.round((dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2);
  const height = Math.round((dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2);
  const [a, b, c, d, e, f, g, hh] = homography(width, height, quad);
  const { width: sw, height: sh, channels } = info;
  const out = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const z = g * px + hh * py + 1;
      const u = clamp((a * px + b * py + c) / z - 0.5, 0, sw - 1.001);
      const v = clamp((d * px + e * py + f) / z - 0.5, 0, sh - 1.001);
      const x0 = Math.floor(u);
      const y0 = Math.floor(v);
      const fx = u - x0;
      const fy = v - y0;
      const i00 = (y0 * sw + x0) * channels;
      const i10 = i00 + channels;
      const i01 = i00 + sw * channels;
      const i11 = i01 + channels;
      const o = (y * width + x) * 3;
      for (let k = 0; k < 3; k++) {
        const top = data[i00 + k] + (data[i10 + k] - data[i00 + k]) * fx;
        const bottom = data[i01 + k] + (data[i11 + k] - data[i01 + k]) * fx;
        out[o + k] = Math.round(top + (bottom - top) * fy);
      }
    }
  }
  return sharp(out, { raw: { width, height, channels: 3 } });
}

/** Aperçu de la photo d'origine avec le contour retenu, pour vérifier la détection. */
async function writePreview(image: Sharp, width: number, quad: Point[], file: string) {
  const preview = await image.clone().resize({ width: 1000 }).toBuffer({ resolveWithObject: true });
  const k = preview.info.width / width;
  const points = quad.map(([x, y]) => `${(x * k).toFixed(1)},${(y * k).toFixed(1)}`).join(" ");
  const svg = `<svg width="${preview.info.width}" height="${preview.info.height}"><polygon points="${points}" fill="none" stroke="#ff00ff" stroke-width="2"/></svg>`;
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await sharp(preview.data)
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 85 })
    .toFile(path.join(PREVIEW_DIR, `${path.parse(file).name}.jpg`));
}

/** Couleur médiane du mur dans un anneau autour du contour de la toile. */
async function sampleWall(image: Sharp, width: number, quad: Point[]) {
  const { data, info } = await image
    .clone()
    .resize({ width: DETECT_SIZE, height: DETECT_SIZE, fit: "inside" })
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const k = info.width / width;
  const cx = quad.reduce((sum, [x]) => sum + x, 0) / 4;
  const cy = quad.reduce((sum, [, y]) => sum + y, 0) / 4;
  const scaled = (f: number) => quad.map(([x, y]) => [(cx + (x - cx) * f) * k, (cy + (y - cy) * f) * k] as Point);
  const inside = (poly: Point[], x: number, y: number) =>
    poly.every(([x1, y1], i) => {
      const [x2, y2] = poly[(i + 1) % poly.length];
      return (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1) >= 0;
    });
  const inner = scaled(WALL_RING[0]);
  const outer = scaled(WALL_RING[1]);

  const samples: number[][] = [[], [], []];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (!inside(outer, x + 0.5, y + 0.5) || inside(inner, x + 0.5, y + 0.5)) continue;
      const i = (y * info.width + x) * info.channels;
      for (let c = 0; c < 3; c++) samples[c].push(data[i + c]);
    }
  }
  if (samples[0].length < 500) return null;
  return samples.map((values) => values.sort((a, b) => a - b)[values.length >> 1]);
}

const toLinear = (v: number) => {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (x: number) =>
  255 * (x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055);
const LINEAR = Float64Array.from({ length: 256 }, (_, v) => toLinear(v));

/** Adoucit les hautes lumières au lieu de les écrêter brutalement. */
function shoulder(x: number) {
  if (x <= HIGHLIGHT_KNEE) return x;
  const room = 1 - HIGHLIGHT_KNEE;
  return HIGHLIGHT_KNEE + room * (1 - Math.exp(-(x - HIGHLIGHT_KNEE) / room));
}

/**
 * Balance des blancs et exposition calées sur le mur, appliquées en lumière
 * linéaire (comme un réglage d'exposition sur l'appareil).
 */
function harmonize(data: Buffer, channels: number, wall: number[] | null, settings: Settings) {
  let gains = [1, 1, 1];
  let exposure = 1;
  if (wall) {
    const linearWall = wall.map(toLinear);
    const gray = (linearWall[0] + linearWall[1] + linearWall[2]) / 3;
    const strength = clamp(settings.balanceBlancs ?? 1, 0, 1);
    gains = linearWall.map((m) => 1 + clamp((gray / m - 1) * strength, -MAX_WB_GAIN, MAX_WB_GAIN));
    const wallLum =
      0.2126 * linearWall[0] * gains[0] + 0.7152 * linearWall[1] * gains[1] + 0.0722 * linearWall[2] * gains[2];
    exposure = clamp(toLinear(WALL_TARGET) / wallLum, ...EXPOSURE_RANGE);
  }
  exposure *= 1 + clamp(settings.luminosite ?? 0, -0.5, 0.5);

  const luts = gains.map((gain) =>
    Uint8Array.from({ length: 256 }, (_, v) => clamp(Math.round(fromLinear(shoulder(LINEAR[v] * gain * exposure))), 0, 255)),
  );
  for (let i = 0; i < data.length; i += channels) {
    data[i] = luts[0][data[i]];
    data[i + 1] = luts[1][data[i + 1]];
    data[i + 2] = luts[2][data[i + 2]];
  }
  return { wall, gains, exposure };
}

async function processFile(file: string, settings: Settings) {
  let image = sharp(await sharp(path.join(SOURCE_DIR, file)).rotate().toBuffer());
  const { width = 0, height = 0 } = await image.metadata();
  let detected = false;
  let wall: number[] | null = null;

  if (settings.recadrage) {
    image = sharp(await image.extract(settings.recadrage).toBuffer());
  } else {
    if (!settings.coins) {
      settings.coins = await detectCorners(image, width, height);
      detected = true;
    }
    await writePreview(image, width, settings.coins, file);
    wall = await sampleWall(image, width, settings.coins);
    image = await unwarp(image, settings.coins);
  }
  if (settings.rotation) {
    image = sharp(await image.rotate(settings.rotation, { background: BACKGROUND }).toBuffer());
  }

  const { data, info } = await image
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const stats = harmonize(data, info.channels, wall, settings);

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
      `(mur ${stats.wall ? stats.wall.join("/") : "non mesuré"}, exposition ×${stats.exposure.toFixed(2)}, ` +
      `balance ${stats.gains.map((g) => g.toFixed(2)).join("/")})` +
      (detected ? "  [coins détectés automatiquement]" : ""),
  );
  return detected;
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
  let changed = false;
  for (const file of files) {
    try {
      settings[file] ??= {};
      if (await processFile(file, settings[file])) changed = true;
    } catch (err) {
      failures++;
      console.error(`✗ ${file} : ${(err as Error).message}`);
    }
  }
  if (changed) await saveSettings(settings);
  if (failures) process.exitCode = 1;
}

main();
