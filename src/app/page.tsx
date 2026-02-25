import type { Metadata } from "next";
import HomeContent from "@/components/HomeContent";

export const metadata: Metadata = {
  title: "زيت زيتون فلسطيني بكر ممتاز | Manajel",
  description:
    "متجر مناجل يقدم زيت زيتون فلسطيني طبيعي 100% ومنتجات تراثية عالية الجودة من المزارع مباشرة.",
};

export default function Home() {
  return <HomeContent />;
}
