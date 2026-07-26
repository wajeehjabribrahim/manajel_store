import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description:
    "تواصل مع فريق مناجل للاستفسار عن زيت الزيتون الفلسطيني البكر الممتاز والمنتجات التراثية أو الطلبات.",
  alternates: {
    canonical: "https://www.mnajel.com/store/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
