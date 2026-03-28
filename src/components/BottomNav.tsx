"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const [cartCount, setCartCount] = useState(0);

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="w-full">
        <div className="w-full bg-[#0f1214]/95 backdrop-blur rounded-none shadow-lg py-2">
          <div className="flex items-center justify-around">
            <Link href="/shipping-policy" className="flex flex-col items-center justify-center gap-1 text-white/90 hover:text-white text-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v6H3z" />
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M14 9h3l4 4v3h-2a2 2 0 0 1-2-2v-1h-3V9z" />
                <circle cx="7.5" cy="17.5" r="1.5" strokeWidth="1.5" />
                <circle cx="18.5" cy="17.5" r="1.5" strokeWidth="1.5" />
              </svg>
              <span>التوصيل</span>
            </Link>

            <Link href="/shop" className="flex flex-col items-center justify-center gap-1 text-white/90 hover:text-white text-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 2h12l1 4H5L6 2z" />
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 10v8a1 1 0 001 1h8a1 1 0 001-1v-8" />
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 6a3 3 0 006 0" />
              </svg>
              <span>تسوق</span>
            </Link>

            <Link href="/cart" className="relative flex flex-col items-center justify-center gap-1 text-white/90 hover:text-white text-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.2 6.4A1 1 0 007.8 21h8.4a1 1 0 00.99-.84L18 13M7 13H5.4"/></svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 right-[28%] min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#C9A66B] text-black text-[11px] font-bold flex items-center justify-center">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
              <span>السلة</span>
            </Link>

            <Link href="/account" className="flex flex-col items-center justify-center gap-1 text-white/90 hover:text-white text-xs" aria-label="الحساب">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.33 0-10 1.67-10 5v1h20v-1c0-3.33-6.67-5-10-5z" />
              </svg>
              <span>الحساب</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
