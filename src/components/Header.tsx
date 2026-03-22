"use client";

import Link from "next/link";
import Image from "next/image";
import { COLORS } from "@/constants/store";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { t, language, dir } = useLanguage();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);
  const gold = "#C9A66B";

  const getCartCount = () => {
    try {
      const raw = localStorage.getItem("manajel-cart");
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return 0;
      return parsed.reduce((sum, item) => {
        const qty = Number(item?.quantity);
        return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
      }, 0);
    } catch {
      return 0;
    }
  };

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    // منع تحرك الصفحة عندما تظهر القائمة
    if (showUserMenu) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    }

    const handleClickOutside = (event: MouseEvent) => {
      const isClickInside = 
        (userMenuRef.current && userMenuRef.current.contains(event.target as Node)) ||
        (mobileUserMenuRef.current && mobileUserMenuRef.current.contains(event.target as Node));
      
      if (!isClickInside) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, [showUserMenu]);

  useEffect(() => {
    const updateCartCount = () => setCartCount(getCartCount());

    updateCartCount();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "manajel-cart") {
        updateCartCount();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", updateCartCount);
    document.addEventListener("visibilitychange", updateCartCount);
    window.addEventListener("manajel-cart-updated", updateCartCount as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", updateCartCount);
      document.removeEventListener("visibilitychange", updateCartCount);
      window.removeEventListener("manajel-cart-updated", updateCartCount as EventListener);
    };
  }, []);

  const navItems = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.shop"), href: "/shop" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  return (
    <header
      style={{
        background: "linear-gradient(180deg, #14171a 0%, #101214 100%)",
        borderBottom: "1px solid rgba(201,166,107,0.25)",
      }}
      className="text-white shadow-2xl relative sticky top-0 z-40 backdrop-blur"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 relative z-10">
        <div className="flex justify-between items-center relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border transition-transform duration-300 group-hover:scale-110" style={{ borderColor: `${gold}88`, boxShadow: "0 8px 18px rgba(201,166,107,0.2)" }}>
              <Image
                src="/images/logo.jpg"
                alt="Manajel Logo"
                width={48}
                height={48}
                priority
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight transition-all duration-300 group-hover:text-opacity-90">{t("nav.brand")}</span>
              <span className="text-[10px] opacity-70 font-semibold tracking-[0.2em]">PALESTINE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold uppercase tracking-[0.12em] text-white/80 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Language Switcher, Auth & Cart */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            
            {/* قائمة السلة والطلبات - للجميع */}
            <div className="relative z-50" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="transition-opacity relative w-10 h-10 flex items-center justify-center text-white/85 hover:text-white"
                title="السلة والطلبات"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {cartCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-[18px] text-center border border-white/20">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </button>

              {showUserMenu && (
                <div
                  className="absolute rounded-2xl shadow-xl border overflow-hidden backdrop-blur"
                  style={{
                    backgroundColor: "#14171a",
                    borderColor: "rgba(201,166,107,0.35)",
                    zIndex: 99999,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
                    top: "100%",
                    marginTop: "8px",
                    width: "208px",
                    [dir === "rtl" ? "left" : "right"]: 0,
                  }}
                >
                  <Link
                    href="/cart"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 transition-colors border-b"
                    style={{
                      color: "#F2ECE2",
                      borderColor: "rgba(201,166,107,0.2)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0h2m-2 0H9m4 0a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                      </svg>
                      <span className="font-semibold">{t("nav.cart")}</span>
                    </div>
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 transition-colors"
                    style={{
                      color: "#F2ECE2",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span className="font-semibold">{t("orders.myOrders")}</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/products"
                      className="transition-opacity"
                      title={t("admin.addProduct") === "admin.addProduct" ? "إضافة منتج" : t("admin.addProduct")}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="transition-opacity"
                      title={t("admin.orders") === "admin.orders" ? "الطلبات" : t("admin.orders")}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </Link>
                  </>
                )}
                
                <Link
                  href="/account"
                  className="transition-opacity w-10 h-10 flex items-center justify-center"
                  title={t("account.title") === "account.title" ? "الحساب" : t("account.title")}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.644 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <span className="text-sm text-white/75">
                  {t("auth.welcome")}
                  {session?.user?.name ? `, ${session.user.name}` : ""}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-md border transition-colors"
                  style={{ borderColor: `${gold}88`, color: "#F2ECE2" }}
                >
                  {t("auth.register")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Icons - Language, Account & Cart */}
          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              className="transition-opacity w-10 h-10 flex items-center justify-center"
              title={isAuthenticated ? (t("account.title") === "account.title" ? "الحساب" : t("account.title")) : t("auth.login")}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
            
            {/* قائمة السلة والطلبات للموبايل */}
            <div className="relative z-50" ref={mobileUserMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="transition-opacity relative w-10 h-10 flex items-center justify-center text-white/85 hover:text-white"
                title="السلة والطلبات"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {cartCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-[18px] text-center border border-white/20">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </button>

              {showUserMenu && (
                <div
                  className="absolute rounded-2xl shadow-xl border overflow-hidden backdrop-blur"
                  style={{
                    backgroundColor: "#14171a",
                    borderColor: "rgba(201,166,107,0.35)",
                    zIndex: 99999,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
                    top: "100%",
                    marginTop: "8px",
                    width: "208px",
                    [dir === "rtl" ? "left" : "right"]: 0,
                  }}
                >
                  <Link
                    href="/cart"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 transition-colors border-b"
                    style={{
                      color: "#F2ECE2",
                      borderColor: "rgba(201,166,107,0.2)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0h2m-2 0H9m4 0a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                      </svg>
                      <span className="font-semibold">{t("nav.cart")}</span>
                    </div>
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 transition-colors"
                    style={{
                      color: "#F2ECE2",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span className="font-semibold">{t("orders.myOrders")}</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button - Removed */}
        </div>
      </nav>
    </header>
  );
}
