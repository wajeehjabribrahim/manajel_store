import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE = "https://www.mnajel.com";

// Regenerated hourly so new products appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE}/store`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/store/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/store/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/store/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/store/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/store/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/store/shipping-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/store/return-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return [
      ...staticPages,
      ...products.map((product) => ({
        url: `${SITE}/store/products/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    // Never let a DB hiccup produce an empty sitemap.
    console.error("[sitemap] failed to load products:", error);
    return staticPages;
  }
}
