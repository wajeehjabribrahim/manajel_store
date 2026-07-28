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
const DATA_URI_RE = /^data:([^;,]+);base64,([\s\S]+)$/;

function binaryResponse(dataUri: string): NextResponse {
  const match = DATA_URI_RE.exec(dataUri);
  if (!match) {
    return NextResponse.json({ error: "Stored image is not a data URI" }, { status: 404 });
  }

  const buffer = Buffer.from(match[2], "base64");
  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": match[1] || "image/webp",
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
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

    const indexParam = new URL(req.url).searchParams.get("i");

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
      if (entry.startsWith("data:")) return binaryResponse(entry);
      // External URL stored in the gallery — just point the client at it.
      // Resolved against req.url so same-site relative paths survive too.
      return NextResponse.redirect(new URL(entry, req.url), 302);
    }

    // Main image
    if (product.imageData) return binaryResponse(product.imageData);
    if (product.image) return NextResponse.redirect(new URL(product.image, req.url), 302);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  } catch (error) {
    console.error("[product image] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
