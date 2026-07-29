import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves product images that are stored as base64 in the database as real
// binary responses. The product LIST endpoint replaces inline base64 with
// links to this route, which shrinks its JSON payload from megabytes to
// kilobytes and lets browsers/CDNs cache each image separately.
//
// URL shape: /api/products/:id/image        → main image (imageData column)
//            /api/products/:id/image?i=2    → images[2] from the gallery
// The list endpoint appends ?v=<updatedAt> so caches bust when a product
// is edited; the content itself is immutable for a given version.

// [\s\S] instead of the `s` regex flag — the tsconfig target predates ES2018.
// [\s\S] instead of the `s` regex flag — the tsconfig target predates ES2018.
const DATA_URI_RE = /^data:([^;,]+);base64,([\s\S]+)$/;

const IMAGE_HEADERS = {
  // s-maxage is what makes the CDN cache it — with max-age alone every
  // image request would still invoke the function and hit the database.
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
};

/**
 * Optionally crops to `ar` (e.g. "4:5") at width `w`. The shop card box is
 * portrait, so a landscape image delivered at full frame is too short and the
 * browser upscales it to cover — cropping here keeps it pixel-exact.
 */
async function binaryResponse(
  dataUri: string,
  crop?: { aspect: string; width: number }
): Promise<NextResponse> {
  const match = DATA_URI_RE.exec(dataUri);
  if (!match) {
    return NextResponse.json({ error: "Stored image is not a data URI" }, { status: 404 });
  }

  // Uint8Array so the sharp output (Buffer<ArrayBufferLike>) can be assigned back.
  let buffer: Uint8Array = Buffer.from(match[2], "base64");
  let contentType = match[1] || "image/webp";

  if (crop) {
    const [w, h] = crop.aspect.split(":").map(Number);
    if (w > 0 && h > 0) {
      try {
        const sharp = (await import("sharp")).default;
        const ratio = w / h;
        const meta = await sharp(buffer).metadata();
        const srcW = meta.width || crop.width;
        const srcH = meta.height || Math.round(crop.width / ratio);

        // Largest region of the requested aspect that fits inside the source,
        // then capped at the requested width. Deriving it from the source
        // instead of passing withoutEnlargement means the output always has
        // the exact aspect and is never upscaled.
        let boxW = srcW;
        let boxH = Math.round(srcW / ratio);
        if (boxH > srcH) {
          boxH = srcH;
          boxW = Math.round(srcH * ratio);
        }

        const outW = Math.max(1, Math.min(boxW, crop.width));
        const outH = Math.max(1, Math.round(outW / ratio));

        buffer = await sharp(buffer)
          .resize({ width: outW, height: outH, fit: "cover", position: "attention" })
          .webp({ quality: 82 })
          .toBuffer();
        contentType = "image/webp";
      } catch (error) {
        // Fall back to the stored image rather than failing the request.
        console.error("[product image] crop failed:", error);
      }
    }
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      ...IMAGE_HEADERS,
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
    },
  });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id ? String(params.id) : "";
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { image: true, imageData: true, images: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const search = new URL(req.url).searchParams;
    const indexParam = search.get("i");

    // Optional crop for the shop card (?ar=4:5&w=600)
    const aspect = search.get("ar");
    const cropWidth = Number(search.get("w"));
    const crop =
      aspect && /^\d+:\d+$/.test(aspect) && Number.isFinite(cropWidth) && cropWidth > 0
        ? { aspect, width: Math.min(cropWidth, 2000) }
        : undefined;

    // Gallery image by index
    if (indexParam !== null) {
      const index = Number(indexParam);
      let gallery: string[] = [];
      try {
        const parsed = product.images ? JSON.parse(product.images) : [];
        gallery = Array.isArray(parsed) ? parsed : [];
      } catch {
        gallery = [];
      }

      const entry = Number.isInteger(index) ? gallery[index] : undefined;
      if (typeof entry !== "string" || !entry) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      if (entry.startsWith("data:")) return binaryResponse(entry, crop);
      // External URL stored in the gallery — just point the client at it.
      // Resolved against req.url so same-site relative paths survive too.
      return NextResponse.redirect(new URL(entry, req.url), 302);
    }

    // Main image
    if (product.imageData) return binaryResponse(product.imageData, crop);
    if (product.image) return NextResponse.redirect(new URL(product.image, req.url), 302);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  } catch (error) {
    console.error("[product image] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
