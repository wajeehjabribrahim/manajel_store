"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SignupPrompt() {
  const { status } = useSession();
  const { language } = useLanguage();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const isArabic = language === "ar";

  useEffect(() => {
    if (status === "authenticated" || status === "loading") return;
    if (!isDesktop) return;

    const timer = setTimeout(() => setIsOpen(true), 2000);

    return () => clearTimeout(timer);
  }, [status, isDesktop]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 769);

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isOpen) return null;

  const handleRegisterClick = () => {
    setIsOpen(false);
    router.push("/store/register");
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    router.push("/store/login");
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] transition-opacity"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 transform transition-all duration-300 ${
          isOpen
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0"
        }`}
      >
        <div
          className="max-h-[88vh] overflow-y-auto rounded-2xl border border-black/10 bg-[#FFFFFF] p-4 sm:p-8 text-[#121416] shadow-2xl tajawal-regular-all"
          style={{
            direction: isArabic ? "rtl" : "ltr",
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`absolute top-3 sm:top-4 text-xl sm:text-2xl text-black/50 hover:text-black ${
              isArabic ? "right-3 sm:right-4" : "left-3 sm:left-4"
            }`}
            aria-label={isArabic ? "إغلاق" : "Close"}
          >
            ✕
          </button>

          {/* Icon */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">
              👤
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-3 sm:mb-4 text-center text-lg sm:text-2xl font-bold text-[#C9A66B] leading-snug">
            {isArabic
              ? "إنشاء حساب خاص بك"
              : "Create Your Account"}
          </h2>

          {/* Description */}
          <p className="mb-4 sm:mb-6 text-center text-sm sm:text-base leading-relaxed text-black/80">
            {isArabic
              ? "قم بإنشاء حساب لحفظ معلوماتك الشخصية ومتابعة طلباتك بسهولة. استمتع بتجربة تسوق أفضل!"
              : "Create an account to save your personal information and easily track your orders. Enjoy a better shopping experience!"}
          </p>

          {/* Features */}
          <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-8">
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-lg sm:text-xl">
                ✓
              </span>

              <p className="text-black/85 text-sm sm:text-base">
                {isArabic
                  ? "حفظ معلوماتك الشخصية وعنوانك"
                  : "Save your personal information and address"}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-lg sm:text-xl">
                ✓
              </span>

              <p className="text-black/85 text-sm sm:text-base">
                {isArabic
                  ? "متابعة طلباتك بكل سهولة"
                  : "Track your orders with ease"}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-lg sm:text-xl">
                ✓
              </span>

              <p className="text-black/85 text-sm sm:text-base">
                {isArabic
                  ? "عروض حصرية وتخفيضات خاصة"
                  : "Exclusive offers and special discounts"}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRegisterClick}
              className="gold-button w-full rounded-lg py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-opacity hover:opacity-90"
            >
              {isArabic
                ? "إنشاء حساب جديد"
                : "Create New Account"}
            </button>

            <button
              onClick={handleLoginClick}
              className="w-full rounded-lg border-2 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-colors"
              style={{
                borderColor: "rgba(201,166,107,0.6)",
                color: "#121416",
                backgroundColor: "#FFFFFF",
              }}
            >
              {isArabic
                ? "تسجيل الدخول"
                : "Log In"}
            </button>

            <button
              onClick={handleClose}
              className="w-full py-1.5 sm:py-2 text-sm sm:text-base font-medium text-black/65 transition-colors hover:text-black"
            >
              {isArabic
                ? "متابعة التصفح"
                : "Continue Browsing"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}