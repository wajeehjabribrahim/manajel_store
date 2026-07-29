/**
 * Builds a delivery URL for a product image.
 *
 * `aspect` matters for the shop card: the card box is portrait (8:10) but
 * next/image only ever sizes by width, so a landscape source arrives too short
 * and the browser stretches it to cover — that was the blurry-card bug. Asking
 * the source to crop to the card's aspect first means the delivered pixels map
 * 1:1 onto the box.
 *
 * @param aspect e.g. "4:5" (same as the 8:10 card box). Omit to keep the
 *               original framing — used where the full image must be shown.
 */
export function optimizeImage(url: string | undefined, width = 600, aspect?: string): string {
  if (!url) return "";

  // Images stored in the database are served by /api/products/[id]/image,
  // which does the same crop with sharp.
  if (url.startsWith("/api/products/")) {
    if (!aspect) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}ar=${encodeURIComponent(aspect)}&w=${width}`;
  }

  // If not Cloudinary, return as-is
  if (!url.includes("res.cloudinary.com")) return url;

  // If transformations already present (f_auto or q_auto), don't re-add
  if (url.includes("/upload/") && (url.includes("f_auto") || url.includes("q_auto"))) {
    return url;
  }

  const crop = aspect ? `,c_fill,g_auto,ar_${aspect.replace(":", ":")}` : "";

  return url.replace("/upload/", `/upload/f_auto,q_auto${crop},w_${width}/`);
}
