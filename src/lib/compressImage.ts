/**
 * Downscales and re-encodes an image file in the browser before it is sent as
 * a base64 data URL.
 *
 * Why: the forms accept files up to 2 MB, but base64 inflates a file by ~33%,
 * so a 1.2 MB photo became ~1.6M characters and the API — which caps a stored
 * image at 1,500,000 characters — rejected it. The user only saw a generic
 * failure. Compressing first removes the mismatch and cuts stored size by an
 * order of magnitude.
 */

const MAX_DIMENSION = 1400;
// Comfortably under the API's 1,500,000-character cap.
const MAX_DATA_URL_CHARS = 1_300_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Failed to read file"));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  // GIFs would lose animation, and SVGs do not benefit — pass them through.
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return readAsDataUrl(file);
  }

  let bitmap: ImageBitmap;
  try {
    // from-image applies EXIF rotation so phone photos are not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return readAsDataUrl(file);
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readAsDataUrl(file);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const supportsWebp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
    const type = supportsWebp ? "image/webp" : "image/jpeg";

    // Step the quality down until it fits; the first pass almost always does.
    for (const quality of [0.82, 0.7, 0.6, 0.5]) {
      const dataUrl = canvas.toDataURL(type, quality);
      if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
    }

    // Still too big (a very large photo): halve the dimensions once more.
    const smaller = document.createElement("canvas");
    smaller.width = Math.max(1, Math.round(width / 2));
    smaller.height = Math.max(1, Math.round(height / 2));
    const sctx = smaller.getContext("2d");
    if (sctx) {
      sctx.drawImage(bitmap, 0, 0, smaller.width, smaller.height);
      return smaller.toDataURL(type, 0.7);
    }

    return canvas.toDataURL(type, 0.5);
  } finally {
    bitmap.close?.();
  }
}
