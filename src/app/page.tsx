import type { Metadata } from "next";
import HomeContent from "@/components/HomeContent";

export const metadata: Metadata = {
  title: "مناجل - متجر المنتجات الفلسطينية الأصيلة",
  description:
    "مناجل متجر فلسطيني للمنتجات الأصيلة: زيت الزيتون، الزعتر، الميرمية وغيرها. جودة عالية وتقاليد عريقة مع شحن سريع داخل فلسطين.",
};

export default function Home() {
  return <HomeContent />;
}
