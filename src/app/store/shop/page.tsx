import type { Metadata } from "next";
import ShopContent from "@/components/ShopContent";
import { Suspense } from "react";

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

export default function Shop() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
