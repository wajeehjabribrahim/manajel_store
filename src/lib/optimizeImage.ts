export function optimizeImage(url: string | undefined, width = 600): string {
  if (!url) return "";

  // If not Cloudinary, return as-is
  if (!url.includes("res.cloudinary.com")) return url;

  // If transformations already present (f_auto or q_auto), don't re-add
  if (url.includes("/upload/") && (url.includes("f_auto") || url.includes("q_auto"))) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width}/`
  );
}
