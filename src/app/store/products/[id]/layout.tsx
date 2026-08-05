import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { STORE_LAUNCHED } from "@/lib/storeStatus";
import { serializeJsonLd } from "@/lib/jsonLd";

const SITE = "https://www.mnajel.com";

// The product page itself is a client component, so metadata and JSON-LD live
// here in a server layout — this is what search engines and AI answer engines
// read without executing any JavaScript.

type SizeEntry = { price?: number };

async function getProduct(id: string) {
  try {
    return await prisma.product.findUnique({ where: { id } });
  } catch (error) {
    console.error("[product metadata] DB error:", error);
    return null;
  }
}

function collectPrices(sizes: string | null, basePrice: number): number[] {
  const prices: number[] = typeof basePrice === "number" && basePrice > 0 ? [basePrice] : [];

  if (sizes) {
    try {
      const parsed = JSON.parse(sizes) as Record<string, SizeEntry>;
      Object.values(parsed).forEach((entry) => {
        if (typeof entry?.price === "number" && entry.price > 0) prices.push(entry.price);
      });
    } catch {
      // sizes is optional/free-form — fall back to the base price
    }
  }

  return prices;
}

function collectImages(image: string | null, images: string | null): string[] {
  const out: string[] = [];
  if (image) out.push(image);

  if (images) {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        parsed.forEach((src) => {
          if (typeof src === "string" && src && !src.startsWith("data:")) out.push(src);
        });
      }
    } catch {
      // ignore malformed image lists
    }
  }

  // Absolute URLs only — relative paths are meaningless to external consumers.
  return [...new Set(out)]
    .filter((src) => !src.startsWith("data:"))
    .map((src) => (src.startsWith("http") ? src : `${SITE}${src.startsWith("/") ? "" : "/"}${src}`));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getProduct(params.id);
  const url = `${SITE}/store/products/${params.id}`;

  if (!product) {
    return {
      title: "المنتج غير متوفر",
      robots: { index: false, follow: true },
    };
  }

  const title = product.nameEn ? `${product.name} — ${product.nameEn}` : product.name;
  const description =
    (product.description || "").replace(/\s+/g, " ").trim().slice(0, 300) ||
    `${product.name} من متجر مناجل — منتجات فلسطينية طبيعية عالية الجودة.`;
  const images = collectImages(product.image, product.images);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: images.length ? images.slice(0, 1) : undefined,
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  if (!product) return <>{children}</>;

  const url = `${SITE}/store/products/${params.id}`;
  const prices = collectPrices(product.sizes, product.price);
  const images = collectImages(product.image, product.images);
  const description = (product.description || "").replace(/\s+/g, " ").trim();

  const low = prices.length ? Math.min(...prices) : product.price;
  const high = prices.length ? Math.max(...prices) : product.price;
  const availability = product.inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  // Prices reach search engines and AI models only once the store is launched —
  // see STORE_LAUNCHED. Until then the Product is published without offers.
  const offers = !STORE_LAUNCHED
    ? undefined
    : low !== high
    ? {
        "@type": "AggregateOffer",
        priceCurrency: "ILS",
        lowPrice: low,
        highPrice: high,
        offerCount: prices.length,
        availability,
        url,
      }
    : {
        "@type": "Offer",
        priceCurrency: "ILS",
        price: low,
        availability,
        url,
        seller: { "@id": `${SITE}/#organization` },
      };

  // Google requires offers/review/aggregateRating on a Product and reports an
  // error otherwise. Before launch we withhold prices, so a Product node could
  // never produce a rich result — publishing one only generates Search Console
  // errors. The node returns automatically with STORE_LAUNCHED.
  const productNode = !STORE_LAUNCHED
    ? []
    : [
        {
          "@type": "Product",
          "@id": `${url}#product`,
          name: product.name,
          alternateName: product.nameEn || undefined,
          description: description || undefined,
          image: images.length ? images : undefined,
          sku: product.id,
          category: product.category,
          brand: { "@type": "Brand", name: "مناجل | Manajel" },
          countryOfOrigin: "PS",
          offers,
          // aggregateRating is deliberately omitted unless real reviews exist —
          // empty or fabricated ratings are a structured-data violation.
          ...(product.reviews > 0 && product.rating > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.rating,
                  reviewCount: product.reviews,
                },
              }
            : {}),
        },
      ];

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@graph": [
      ...productNode,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "مناجل", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "المتجر", item: `${SITE}/store` },
          { "@type": "ListItem", position: 3, name: "المنتجات", item: `${SITE}/store/shop` },
          { "@type": "ListItem", position: 4, name: product.name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {children}
    </>
  );
}
