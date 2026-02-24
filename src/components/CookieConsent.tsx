"use client";

import { useState, useEffect } from "react";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CookieConsent() {
  const { t, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // تحقق من الموافقة المحفوظة في localStorage
    const cookieConsent = localStorage.getItem("cookieConsent");
    if (!cookieConsent) {
      // اعرض النافذة بعد تأخير قصير
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* النص */}
        <div className="flex-1 text-white text-sm md:text-base">
          <p className="opacity-90 leading-relaxed">
            {language === "ar"
              ? "نستخدم ملفات تعريف الارتباط لتحسين تجربتك في متجر مناجل. بالاستمرار في التصفح، فإنك توافق على استخدامنا لها."
              : "We use cookies to improve your experience on the Manajel store. By continuing to browse, you agree to our use of cookies."}
          </p>
        </div>

        {/* الأزرار */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 rounded-lg border border-white/40 text-white hover:border-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            {language === "ar" ? "رفض" : "Decline"}
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-lg text-white transition-all text-sm font-medium hover:shadow-lg"
            style={{ backgroundColor: COLORS.primary }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.opacity = "0.9")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.opacity = "1")
            }
          >
            {language === "ar" ? "أوافق" : "Accept All"}
          </button>
        </div>
      </div>
    </div>
  );
}
