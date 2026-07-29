"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last-resort boundary for React render errors. It replaces the root layout,
// so it has to render <html> and <body> itself. Kept deliberately plain — it
// only ever appears when the app has already failed.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          backgroundColor: "#FBF8F2",
          color: "#121416",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#C9A66B" }}>
          حدث خطأ غير متوقع
        </h1>
        <p style={{ maxWidth: "38ch", lineHeight: 1.8, opacity: 0.8 }}>
          نعتذر عن الإزعاج. تم تسجيل المشكلة وسنعمل على إصلاحها.
        </p>
        <a
          href="/"
          style={{
            border: "1px solid rgba(201,166,107,0.7)",
            borderRadius: "0.5rem",
            padding: "0.6rem 1.6rem",
            color: "#96691A",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          العودة للصفحة الرئيسية
        </a>
      </body>
    </html>
  );
}
