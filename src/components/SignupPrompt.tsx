"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPrompt() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Don't show if user is already logged in or if we've already shown it
    if (status === "authenticated" || status === "loading") {
      return;
    }

    // Show the modal after 2 seconds for every visit
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [status]);

  if (!isOpen) return null;

  const handleRegisterClick = () => {
    setIsOpen(false);
    router.push("/register");
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    router.push("/login");
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
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 transform transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="max-h-[88vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#171a1d] p-4 sm:p-8 text-[#F2ECE2] shadow-2xl" style={{ direction: "rtl" }}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 text-xl sm:text-2xl text-white/50 hover:text-white"
          >
            ✕
          </button>

          {/* Icon */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">👤</div>
          </div>

          {/* Title */}
          <h2 className="mb-3 sm:mb-4 text-center text-lg sm:text-2xl font-bold text-[#C9A66B] leading-snug">
            إنشاء حساب خاص بك
          </h2>

          {/* Description */}
          <p className="mb-4 sm:mb-6 text-center text-sm sm:text-base leading-relaxed text-white/80">
            قم بإنشاء حساب لحفظ معلوماتك الشخصية ومتابعة طلباتك بسهولة. استمتع بتجربة تسوق أفضل!
          </p>

          {/* Features */}
          <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-8">
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-lg sm:text-xl">✓</span>
              <p className="text-white/85 text-sm sm:text-base">حفظ معلوماتك الشخصية وعنوانك</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-lg sm:text-xl">✓</span>
              <p className="text-white/85 text-sm sm:text-base">متابعة طلباتك بكل سهولة</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-lg sm:text-xl">✓</span>
              <p className="text-white/85 text-sm sm:text-base">عروض حصرية وتخفيفات خاصة</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRegisterClick}
              className="gold-button w-full rounded-lg py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-opacity hover:opacity-90"
            >
              إنشاء حساب جديد
            </button>
            <button
              onClick={handleLoginClick}
              className="w-full rounded-lg border-2 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-colors"
              style={{
                borderColor: "rgba(201,166,107,0.6)",
                color: "#F2ECE2",
                backgroundColor: "#121416",
              }}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={handleClose}
              className="w-full py-1.5 sm:py-2 text-sm sm:text-base font-medium text-white/65 transition-colors hover:text-white"
            >
              متابعة التصفح
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
