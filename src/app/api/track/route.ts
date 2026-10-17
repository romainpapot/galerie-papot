import { z } from "zod";
import { MAX_DURATION, deviceFromUserAgent, isBot, trafficSource, visitorId } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const payload = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("view"),
    id: z.string().regex(/^[\w-]{8,40}$/),
    path: z.string().startsWith("/").max(300),
    referrer: z.string().max(500).catch(""),
    utm: z.string().max(100).catch(""),
  }),
  z.object({
    type: z.literal("duration"),
    id: z.string().regex(/^[\w-]{8,40}$/),
    seconds: z.number().int().min(0),
  }),
]);

const ARTWORK_PATH = /^\/oeuvres\/([^/]+)\/?$/;

/** Réception des mesures d'audience envoyées par le composant Tracker. */
export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  // Ni les robots ni le galeriste connecté au back-office ne sont comptés
  if (isBot(userAgent) || (await getSession())) return new Response(null, { status: 204 });

  let data: z.infer<typeof payload>;
  try {
    data = payload.parse(JSON.parse(await request.text()));
  } catch {
    return new Response(null, { status: 400 });
  }

  if (data.type === "duration") {
    await prisma.pageView.updateMany({
      where: { id: data.id },
      data: { duration: Math.min(data.seconds, MAX_DURATION) },
    });
    return new Response(null, { status: 204 });
  }

  const slug = ARTWORK_PATH.exec(data.path)?.[1];
  const artwork = slug
    ? await prisma.artwork.findUnique({ where: { slug }, select: { id: true } })
    : null;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  await prisma.pageView
    .create({
      data: {
        id: data.id,
        path: data.path,
        artworkId: artwork?.id ?? null,
        visitorId: visitorId(ip, userAgent),
        source: trafficSource(data.referrer, data.utm, new URL(request.url).hostname),
        device: deviceFromUserAgent(userAgent),
      },
    })
    .catch(() => {}); // identifiant déjà reçu (double envoi) : on ignore

  return new Response(null, { status: 204 });
}
