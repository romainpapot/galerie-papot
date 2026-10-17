import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/images";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
};

// Les images envoyées après le build ne sont pas servies par /public :
// on les lit depuis UPLOAD_DIR.
export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: segments } = await ctx.params;
  const name = path.basename(segments.join("/"));
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type || segments.length !== 1) return new Response("Not found", { status: 404 });

  const file = path.join(uploadDir(), name);
  try {
    await stat(file);
    const data = await readFile(file);
    return new Response(data, {
      headers: {
        "Content-Type": type,
        // Noms de fichiers uniques (UUID) : contenu immuable
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
