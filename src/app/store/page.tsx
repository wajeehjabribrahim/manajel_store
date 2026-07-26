import type { Metadata } from "next";
import HomeContent from "@/components/HomeContent";

export const metadata: Metadata = {
  title: "المتجر — زيت زيتون فلسطيني بكر ممتاز ومنتجات تراثية",
  description:
    "متجر مناجل يقدم زيت زيتون فلسطيني بكر ممتاز معصور على البارد ومنتجات تراثية عالية الجودة من المزارع مباشرة.",
  alternates: {
    canonical: "https://www.mnajel.com/store",
  },
  openGraph: {
    title: "متجر مناجل — زيت زيتون فلسطيني ومنتجات تراثية",
    url: "https://www.mnajel.com/store",
  },
};

export default function Home() {
  const siteUrl = "https://www.mnajel.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "مناجل — الصفحة الرئيسية",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "المتجر",
            item: `${siteUrl}/store`,
          },
        ],
      },
      {
        "@type": "SiteNavigationElement",
        name: ["المتجر", "من نحن", "تواصل معنا", "الأسئلة الشائعة", "زيت الزيتون", "الزعتر البلدي"],
        url: [
          `${siteUrl}/store/shop`,
          `${siteUrl}/store/about`,
          `${siteUrl}/store/contact`,
          `${siteUrl}/store/faq`,
          `${siteUrl}/store/shop?category=olive-oil`,
          `${siteUrl}/store/shop?category=zatar`,
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent />
    </>
  );
}
