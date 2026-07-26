import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "من نحن — قصة مناجل",
  description:
    "تعرف على قصة مناجل: علامة فلسطينية من سلفيت لزيت الزيتون البكر الممتاز المعصور على البارد والمنتجات التراثية.",
  alternates: {
    canonical: "https://www.mnajel.com/store/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
