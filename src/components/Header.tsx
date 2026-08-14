"use client";

import Link from "next/link";
import Image from "next/image";
import { COLORS } from "@/constants/store";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { t, language, dir } = useLanguage();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  // Initialize hooks BEFORE any conditionals
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

  // Renders on every page now, including /store: the hero used to carry its own
  // duplicate overlay header, which meant two headers to keep in sync.

  const navItems = [
    { name: t("nav.home"), href: "/store" },
    { name: t("nav.shop"), href: "/store/shop" },
    { name: t("nav.about"), href: "/store/about" },
    { name: t("nav.contact"), href: "/store/contact" },
  ];

  return (
    <header
      // Solid cream bar with a hairline rule, instead of floating transparently
      // over the hero. One header for the whole store.
      className="text-[#121416] relative z-40 w-full tajawal-regular-all border-b"
      style={{ backgroundColor: "#FBF8F2", borderColor: "rgba(201,166,107,0.28)" }}
    >
      <nav className="max-w-7xl mx-auto px-3 min-[375px]:px-4 sm:px-6 lg:px-8 py-4 lg:py-5 relative z-10">
        {/* Mobile is a simple two-end flex row. The three-track grid only kicks
            in at lg, where the centre nav exists: below that the nav is
            display:none, so it leaves no grid cell and the icons used to fall
            into the middle column instead of sitting at the right edge. */}
        <div className="flex items-center justify-between gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] relative">
          {/* Logo */}
          {/* Below 375px (older/small Androids) the brand lockup + controls
              overflow the row, so everything steps down one notch. The company
              name is never truncated — it shrinks instead. */}
          <Link href="/store" className="flex items-center gap-1.5 min-[375px]:gap-2 lg:gap-3 group">
            <div className="w-8 h-8 min-[375px]:w-9 min-[375px]:h-9 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center overflow-hidden border transition-transform duration-300 group-hover:scale-110" style={{ borderColor: `${gold}88`, boxShadow: "0 8px 18px rgba(201,166,107,0.2)" }}>
              <Image
                src="/images/logo.jpg"
                alt="Manajel Logo"
                width={36}
                height={36}
                priority
                className="object-cover w-full h-full"
              />
            </div>
            {/* Deliberately not translated: the registered company name is part
                of the brand mark, so both lines stay fixed in either language. */}
            <div className="flex flex-col leading-tight">
              <span className="text-xs min-[375px]:text-sm lg:text-lg font-black tracking-tight whitespace-nowrap transition-all duration-300 group-hover:text-opacity-90">
                شركة ومعصرة مناجل
              </span>
              <span className="text-[7px] tracking-[0.08em] min-[375px]:text-[8px] min-[375px]:tracking-[0.12em] lg:text-[10px] opacity-70 font-semibold whitespace-nowrap">
                MANAJEL COMPANY &amp; MILL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation — centre track */}
          <div className="hidden lg:flex justify-center gap-8 xl:gap-10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-sm font-semibold uppercase tracking-[0.18em] text-black/75 transition-colors hover:text-[#96691A] after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-[#C9A66B] after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Language Switcher, Auth & Cart */}
          <div className="hidden lg:flex items-center justify-end gap-4">
            <LanguageSwitcher />
            
            {/* قائمة السلة والطلبات - للجميع */}
            <div className="relative z-50" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="transition-opacity relative flex items-center gap-2 text-black/85 hover:text-black"
                title="السلة والطلبات"
              >
                <div className="relative w-6 h-6 flex items-center justify-center">
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
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-white/20">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </div>
              </button>

              {showUserMenu && (
                <div
                  className="absolute rounded-2xl shadow-xl border overflow-hidden backdrop-blur"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "rgba(201,166,107,0.35)",
                    zIndex: 99999,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.15)",
                    top: "100%",
                    marginTop: "8px",
                    width: "208px",
                    [dir === "rtl" ? "left" : "right"]: 0,
                  }}
                >
                  <Link
                    href="/store/cart"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 transition-colors border-b"
                    style={{
                      color: "#121416",
                      borderColor: "rgba(201,166,107,0.2)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
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
                      {cartCount > 0 && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-white/20">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </div>
                  </Link>
                  <Link
                    href="/store/orders"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 transition-colors"
                    style={{
                      color: "#121416",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
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
                      href="/store/admin/products"
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
                      href="/store/admin/orders"
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
                  href="/store/account"
                  className="transition-opacity w-10 h-10 flex items-center justify-center"
                  title={t("account.title") === "account.title" ? "الحساب" : t("account.title")}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                {/* Truncated: a long full name would otherwise push the action
                    cluster wide enough to squeeze the centred nav. */}
                <span
                  className="text-sm text-black/75 max-w-[10rem] xl:max-w-[14rem] truncate"
                  title={session?.user?.name || undefined}
                >
                  {t("auth.welcome")}
                  {session?.user?.name ? `, ${session.user.name}` : ""}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/store/login"
                  className="px-3 py-1.5 rounded-md bg-black/5 hover:bg-black/10 transition-colors"
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/store/register"
                  className="px-3 py-1.5 rounded-md border transition-colors"
                  style={{ borderColor: `${gold}88`, color: "#121416" }}
                >
                  {t("auth.register")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Icons - Language, Account & Cart */}
          <div className="lg:hidden flex items-center gap-1.5 min-[375px]:gap-2 shrink-0">
            <LanguageSwitcher />
            <Link
              href={isAuthenticated ? "/store/account" : "/store/login"}
              className="transition-opacity w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5"
              title={isAuthenticated ? (t("account.title") === "account.title" ? "الحساب" : t("account.title")) : t("auth.login")}
            >
              <svg
                className="w-[22px] h-[22px]"
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
                className="transition-opacity relative w-10 h-10 flex items-center justify-center rounded-full text-black/85 hover:text-black active:bg-black/5"
                title="السلة والطلبات"
              >
                <svg
                  className="w-[22px] h-[22px]"
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
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold leading-[16px] text-center border border-white/20 lg:min-w-[18px] lg:h-[18px] lg:text-[10px] lg:leading-[18px]">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </button>

              {showUserMenu && (
                <div
                  className="absolute rounded-2xl shadow-xl border overflow-hidden backdrop-blur"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "rgba(201,166,107,0.35)",
                    zIndex: 99999,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.15)",
                    top: "100%",
                    marginTop: "8px",
                    width: "208px",
                    [dir === "rtl" ? "left" : "right"]: 0,
                  }}
                >
                  <Link
                    href="/store/cart"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 transition-colors border-b"
                    style={{
                      color: "#121416",
                      borderColor: "rgba(201,166,107,0.2)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
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
                      {cartCount > 0 && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-white/20">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </div>
                  </Link>
                  <Link
                    href="/store/orders"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 transition-colors"
                    style={{
                      color: "#121416",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
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
