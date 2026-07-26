import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الشحن والتوصيل",
  description: "تفاصيل الشحن والتوصيل لطلبات متجر مناجل.",
  alternates: {
    canonical: "https://www.mnajel.com/store/shipping-policy",
  },
};

export default function ShippingPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
