import ShopContent from "@/components/ShopContent";
import { Suspense } from "react";

// Cache this page at the edge for 1 hour (3600 seconds)
export const revalidate = 3600;

export default function Shop() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
