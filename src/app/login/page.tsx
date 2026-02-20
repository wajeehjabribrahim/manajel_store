"use client";

import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12" />}>
      <LoginPageClient />
    </Suspense>
  );
}
