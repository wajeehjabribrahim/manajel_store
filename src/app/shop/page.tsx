"use client";

import ShopContent from "@/components/ShopContent";
import { Suspense } from "react";

export default function Shop() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
