"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/constants/store";
import Link from "next/link";

export default function SignupPrompt() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Don't show if user is already logged in or if we've already shown it
    if (status === "authenticated" || status === "loading") {
      return;
    }

    // Check if this is first visit (no localStorage flag)
    const visitFlag = localStorage.getItem("signupPromptShown");
    if (!visitFlag && !hasShown) {
      // Wait a moment before showing the modal
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        localStorage.setItem("signupPromptShown", "true");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, hasShown]);

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
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8" style={{ direction: "rtl" }}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>

          {/* Icon */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">👤</div>
          </div>

          {/* Title */}
          <h2
            style={{ color: COLORS.primary }}
            className="text-2xl font-bold text-center mb-4"
          >
            إنشاء حساب خاص بك
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            قم بإنشاء حساب لحفظ معلوماتك الشخصية ومتابعة طلباتك بسهولة. استمتع بتجربة تسوق أفضل!
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-xl">✓</span>
              <p className="text-gray-700">حفظ معلوماتك الشخصية وعنوانك</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-xl">✓</span>
              <p className="text-gray-700">متابعة طلباتك بكل سهولة</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 font-bold text-xl">✓</span>
              <p className="text-gray-700">عروض حصرية وتخفيفات خاصة</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRegisterClick}
              className="w-full text-white font-semibold py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.primary }}
            >
              إنشاء حساب جديد
            </button>
            <button
              onClick={handleLoginClick}
              className="w-full font-semibold py-3 rounded-lg transition-colors border-2"
              style={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
              }}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={handleClose}
              className="w-full text-gray-600 font-medium py-2 hover:text-gray-800 transition-colors"
            >
              متابعة التصفح
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
