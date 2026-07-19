"use client";

import { useEffect, useState } from "react";

type ToastData = { id: number; message: string; type: "success" | "error" };

let toastId = 0;

/** Show a toast notification from anywhere in the app (client-side only). */
export function showToast(message: string, type: "success" | "error" = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("manajel-toast", { detail: { message, type } }));
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const toast: ToastData = {
        id: ++toastId,
        message: String(detail.message || ""),
        type: detail.type === "error" ? "error" : "success",
      };
      if (!toast.message) return;
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };

    window.addEventListener("manajel-toast", onToast);
    return () => window.removeEventListener("manajel-toast", onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 lg:bottom-8">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`toast-item flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg tajawal-regular-all ${
            toast.type === "error" ? "bg-red-600" : "bg-[#1f5d4e]"
          }`}
        >
          {toast.type === "error" ? (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
