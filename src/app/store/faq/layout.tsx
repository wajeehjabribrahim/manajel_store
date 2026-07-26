import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description:
    "إجابات عن الأسئلة الشائعة حول منتجات مناجل، زيت الزيتون الفلسطيني، الشحن والتوصيل والدفع.",
  alternates: {
    canonical: "https://www.mnajel.com/store/faq",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
