"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function BottomNav() {
  const { t, language } = useLanguage();
  const [cartCount, setCartCount] = useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const getCartCount = () => {
      try {
        const raw = localStorage.getItem("manajel-cart");
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return 0;
        return parsed.reduce((sum: number, item: any) => {
          const qty = Number(item?.quantity);
          return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
        }, 0);
      } catch {
        return 0;
      }
    };

    setCartCount(getCartCount());

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "manajel-cart") setCartCount(getCartCount());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("manajel-cart-updated", handleStorage as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("manajel-cart-updated", handleStorage as EventListener);
    };
  }, []);

  // Show mobile account prompt for unauthenticated users
  useEffect(() => {
    try {
      if (status === "loading") return;
      if (status === "authenticated") return; // don't show to logged-in users

      // Only on mobile viewport (treat tablets as desktop)
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 769;
      if (!isMobile) return;

      // Only show on homepage path
      const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
      if (path !== '/store') return;

      const timer = setTimeout(() => setShowPrompt(true), 900);
      return () => clearTimeout(timer);
    } catch {
      // ignore
    }
  }, [status, pathname]);

  const handleDismissPrompt = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowPrompt(false);
  };

  const goToLogin = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowPrompt(false);
    router.push('/store/login');
  };

  const goToRegister = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowPrompt(false);
    router.push('/store/register');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="w-full">
        <div className="w-full bg-white/95 backdrop-blur rounded-none border-t border-black/10 shadow-lg py-2">
          <div className="flex items-center justify-around">
            <Link href="/store" className="flex flex-col items-center justify-center gap-1 text-black/80 hover:text-black text-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5M5.25 9.75V21h13.5V9.75" />
           
              </svg>
              <span>{language === "ar" ? "الرئيسية" : "Home"}</span>
            </Link>

            <Link href="/store/shop" className="flex flex-col items-center justify-center gap-1 text-black/80 hover:text-black text-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 2h12l1 4H5L6 2z" />
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 10v8a1 1 0 001 1h8a1 1 0 001-1v-8" />
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 6a3 3 0 006 0" />
              </svg>
              <span>{t("nav.shop")}</span>
            </Link>

            <Link href="/store/cart" className="relative flex flex-col items-center justify-center gap-1 text-black/80 hover:text-black text-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.2 6.4A1 1 0 007.8 21h8.4a1 1 0 00.99-.84L18 13M7 13H5.4"/></svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 right-[28%] min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center border border-white/20">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
              <span>{t("nav.cart")}</span>
            </Link>

            <Link href="/store/account" className="flex flex-col items-center justify-center gap-1 text-black/80 hover:text-black text-xs" aria-label={t("account.title")}>
              <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
    />
    <path
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 20.118a7.5 7.5 0 0115 0"
    />
  </svg>
              <span>{t("account.title")}</span>
            </Link>
            {/* Mobile-only account prompt bubble */}
{showPrompt && (
  <div
    className={`absolute bottom-12 z-50 ${
      language === "ar" ? "right-6" : "left-6"
    }`}
  >
    <div
      className="relative w-72 bg-white border border-black/10 text-black/80 rounded-lg pt-8 pb-3 px-3 shadow-xl tajawal-regular-all"
      style={{ direction: language === "ar" ? "rtl" : "ltr" }}
    >
      <button
        onClick={handleDismissPrompt}
        className={`absolute top-2 ${
          language === "ar" ? "left-2" : "right-2"
        } text-black/50 hover:text-black`}
      >
        ✕
      </button>

      <div className="text-sm mb-3">
        {language === "ar"
          ? "قم بإنشاء حساب أو تسجيل الدخول لاستقبال جميع التحديثات والعروض."
          : "Create an account or sign in to receive the latest updates and exclusive offers."}
      </div>

      <div className="flex gap-2">
        <button
          onClick={goToLogin}
          className="flex-1 rounded-md py-1 text-sm bg-transparent border border-black/20"
        >
          {language === "ar" ? "تسجيل الدخول" : "Sign In"}
        </button>

        <button
          onClick={goToRegister}
          className="flex-1 rounded-md py-1 text-sm gold-button"
        >
          {language === "ar" ? "إنشاء حساب" : "Create Account"}
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        </div>
      </div>
    </nav>
  );
}
