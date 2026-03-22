import type { Metadata } from "next";
import HomeContent from "@/components/HomeContent";

export const metadata: Metadata = {
  title: "زيت زيتون فلسطيني بكر ممتاز | Manajel",
  description:
    "متجر مناجل يقدم زيت زيتون فلسطيني طبيعي 100% ومنتجات تراثية عالية الجودة من المزارع مباشرة.",
  alternates: {
    canonical: "https://www.mnajel.com",
  },
};

export default function Home() {
  const siteUrl = "https://www.mnajel.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Manajel",
        alternateName: ["مناجل", "Mnajel", "Manajel"],
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
      },
      {
        "@type": "WebSite",
        name: "مناجل | Manajel",
        url: siteUrl,
        inLanguage: ["ar", "en"],
      },
      {
        "@type": "SiteNavigationElement",
        name: ["المتجر", "من نحن", "تواصل معنا", "الأسئلة الشائعة", "زيت الزيتون", "الزعتر البلدي"],
        url: [
          `${siteUrl}/shop`,
          `${siteUrl}/about`,
          `${siteUrl}/contact`,
          `${siteUrl}/faq`,
          `${siteUrl}/shop?category=olive-oil`,
          `${siteUrl}/shop?category=zatar`,
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
