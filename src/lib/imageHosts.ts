// Keep in sync with images.remotePatterns in next.config.mjs — a URL stored
// here but missing there renders as a broken image (the optimizer returns 400).
export const ALLOWED_IMAGE_HOSTS = ["imgur.com", "i.imgur.com", "res.cloudinary.com"];

/**
 * Returns null when the value is acceptable as a product image source
 * (data URI, same-site path, or an https URL on an allowed host),
 * otherwise an Arabic reason suitable for showing to the admin.
 */
export function invalidImageUrlReason(value: string): string | null {
  if (!value) return null;
  if (value.startsWith("data:image/")) return null;
  if (value.startsWith("/")) return null; // same-site path (e.g. /images/… or /api/…)

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return `رابط الصورة غير صالح: ${value.slice(0, 80)}`;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return `بروتوكول رابط الصورة غير مدعوم: ${url.protocol}`;
  }

  if (!ALLOWED_IMAGE_HOSTS.includes(url.hostname)) {
    return `نطاق الصور ${url.hostname} غير مدعوم — النطاقات المسموحة: ${ALLOWED_IMAGE_HOSTS.join(", ")}. ارفع الصورة كملف بدلًا من الرابط.`;
  }

  return null;
}
