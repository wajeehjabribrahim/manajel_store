import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الاسترجاع",
  description: "سياسة الاسترجاع والاستبدال لمنتجات متجر مناجل.",
  alternates: {
    canonical: "https://www.mnajel.com/store/return-policy",
  },
};

export default function ReturnPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
