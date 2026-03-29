"use client";

import { CONTACT_INFO } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

export default function FloatingWhatsApp() {
  const { language } = useLanguage();
  const whatsappHref = `https://wa.me/${normalizePhone(CONTACT_INFO.phone)}`;

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={language === "ar" ? "تواصل واتساب" : "WhatsApp chat"}
      title={language === "ar" ? "تواصل واتساب" : "WhatsApp chat"}
      className="fixed bottom-12 right-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 shadow-lg transition-transform duration-200 hover:scale-105 md:bottom-16 md:right-6"
      style={{
        backgroundColor: "#25D366",
        boxShadow: "0 12px 24px rgba(37,211,102,0.3)",
      }}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .2 5.32.2 11.89c0 2.09.55 4.13 1.6 5.92L0 24l6.35-1.67a11.82 11.82 0 0 0 5.7 1.46h.01c6.56 0 11.89-5.33 11.9-11.9.01-3.18-1.23-6.17-3.44-8.4Zm-8.46 18.3h-.01a9.8 9.8 0 0 1-4.98-1.36l-.36-.21-3.77.99 1.01-3.67-.24-.38a9.85 9.85 0 0 1-1.51-5.25c0-5.45 4.43-9.88 9.88-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.9 9.88Zm5.42-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.16-.17.2-.34.22-.64.08-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.5-1.77-1.67-2.07-.18-.3-.02-.47.13-.62.13-.13.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.66-.5h-.56c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.5s1.06 2.9 1.2 3.1c.15.2 2.09 3.2 5.08 4.48.71.31 1.26.5 1.7.64.71.23 1.35.2 1.86.12.57-.09 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
