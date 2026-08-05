import type { Metadata } from "next";
import ShopContent from "@/components/ShopContent";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { STORE_LAUNCHED } from "@/lib/storeStatus";
import { serializeJsonLd } from "@/lib/jsonLd";

const SITE = "https://www.mnajel.com";

export const metadata: Metadata = {
  title: "تسوق زيت الزيتون والمنتجات التراثية",
  description:
    "تسوق زيت زيتون فلسطيني بكر ممتاز، زعتر بلدي، فريكة ومنتجات تراثية طبيعية من متجر مناجل.",
  alternates: {
    canonical: "https://www.mnajel.com/store/shop",
  },
};

// Cache this page at the edge for 1 hour (3600 seconds)
export const revalidate = 3600;

// The catalogue itself is rendered client-side, so this server-side ItemList is
// what search engines and AI answer engines use to see the full product range.
async function getCatalogueJsonLd() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, price: true, inStock: true },
      orderBy: { displayOrder: "asc" },
    });

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "منتجات مناجل — Manajel products",
      numberOfItems: products.length,
      // Before launch the entries are plain name+url list items: a nested
      // Product without offers is reported as an error by Google, and it could
      // not produce a rich result anyway while prices are withheld.
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: `${SITE}/store/products/${product.id}`,
        ...(STORE_LAUNCHED
          ? {
              item: {
                "@type": "Product",
                name: product.name,
                url: `${SITE}/store/products/${product.id}`,
                offers: {
                  "@type": "Offer",
                  priceCurrency: "ILS",
                  price: product.price,
                  availability: product.inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              },
            }
          : {}),
      })),
    };
  } catch (error) {
    console.error("[shop] failed to build ItemList:", error);
    return null;
  }
}

export default async function Shop() {
  const jsonLd = await getCatalogueJsonLd();

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <ShopContent />
      </Suspense>
    </>
  );
}
