"use client";

import SignupPrompt from "@/components/SignupPrompt";
import { COLORS, STORE_DESCRIPTION } from "@/constants/store";
import { PRODUCTS, Product } from "@/constants/products";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useRef } from "react";

export default function HomeContent() {
  const { t, language, dir } = useLanguage();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [heritageImageIndex, setHeritageImageIndex] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
  const heritageImages = [
    "/images/mill.png",
    "/images/mail.jpg",
    "/images/oil.jpg",
  ];

  const arrivalsReveal = useScrollAnimation({ delay: 100 });
  const heritageReveal = useScrollAnimation({ delay: 200 });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.products)) {
            setProducts(data.products);
            try {
              localStorage.setItem(`manajel-products-cache-${language}`, JSON.stringify(data.products));
            } catch {
              // ignore cache errors
            }
          }
        }
      } catch {
        // keep fallback
      }
    };

    try {
      const cached = localStorage.getItem(`manajel-products-cache-${language}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      }
    } catch {
      // ignore cache errors
    }
    loadProducts();
  }, [language]);

  useEffect(() => {
    if (heritageImages.length <= 1) return;

    const timer = setInterval(() => {
      setHeritageImageIndex((prev) => (prev + 1) % heritageImages.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [heritageImages.length]);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="bg-[#121416] text-[#F2ECE2]">
      <SignupPrompt />

      <section
        className="hero-section relative w-full aspect-[4/5] min-h-[88vh] px-4 text-white sm:aspect-auto sm:min-h-[44vh] md:aspect-[5/4] md:min-h-[76vh] mt-0"
        style={{
          backgroundImage: "url('/images/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, rgba(12,12,14,0.88) 0%, rgba(24,28,31,0.74) 45%, rgba(76,51,38,0.52) 100%)",
          }}
        />

        {/* Header overlay on hero */}
        <header className="absolute top-0 left-0 right-0 z-50 w-full text-white">
          <nav className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 md:py-4 relative z-10">
            <div className="flex justify-between items-center relative">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border transition-transform duration-300 group-hover:scale-110" style={{ borderColor: `${gold}88`, boxShadow: "0 8px 18px rgba(201,166,107,0.2)" }}>
                  <Image
                    src="/images/logo.jpg"
                    alt="Manajel Logo"
                    width={40}
                    height={40}
                    priority
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-black tracking-tight transition-all duration-300 group-hover:text-opacity-90">{t("nav.brand")}</span>
                  <span className="text-[8px] opacity-70 font-semibold tracking-[0.2em]">PALESTINE</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex gap-6 lg:gap-8">
                {[
                  { name: t("nav.home"), href: "/" },
                  { name: t("nav.shop"), href: "/shop" },
                  { name: t("nav.about"), href: "/about" },
                  { name: t("nav.contact"), href: "/contact" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Language Switcher, Auth & Cart */}
              <div className="hidden md:flex items-center gap-4 lg:gap-5">
                <LanguageSwitcher />
                
                {/* قائمة السلة والطلبات - للجميع */}
                <div className="relative z-50" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="transition-opacity relative flex items-center gap-2 text-white/85 hover:text-white"
                    title="السلة والطلبات"
                  >
                    <div className="relative w-5 h-5 flex items-center justify-center">
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
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
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
                          <span className="font-semibold text-sm">{t("nav.cart")}</span>
                          {cartCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border border-white/20">
                              {cartCount > 99 ? "99+" : cartCount}
                            </span>
                          )}
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
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
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
                          <span className="font-semibold text-sm">{t("orders.myOrders")}</span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
                
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin/products"
                          className="transition-opacity"
                          title={t("admin.addProduct") === "admin.addProduct" ? "إضافة منتج" : t("admin.addProduct")}
                        >
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
                        </Link>
                      </>
                    )}
                    
                    <Link
                      href="/account"
                      className="transition-opacity w-8 h-8 flex items-center justify-center"
                      title={t("account.title") === "account.title" ? "الحساب" : t("account.title")}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.644 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                    <span className="text-xs text-white/75">
                      {t("auth.welcome")}
                      {session?.user?.name ? `, ${session.user.name}` : ""}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      href="/register"
                      className="px-2 py-1 text-xs rounded-md border transition-colors"
                      style={{ borderColor: `${gold}88`, color: "#F2ECE2" }}
                    >
                      {t("auth.register")}
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Icons - Language, Account & Cart */}
              <div className="md:hidden flex items-center gap-2">
                <LanguageSwitcher />
                <Link
                  href={isAuthenticated ? "/account" : "/login"}
                  className="transition-opacity w-8 h-8 flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.644 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <div className="relative z-50" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="transition-opacity relative flex items-center justify-center text-white/85 hover:text-white"
                  >
                    <div className="relative w-5 h-5 flex items-center justify-center">
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
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      {cartCount > 0 ? (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold leading-[16px] text-center border border-white/20">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      ) : null}
                    </div>
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
                          {cartCount > 0 && (
                            <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-white/20">
                              {cartCount > 99 ? "99+" : cartCount}
                            </span>
                          )}
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
            </div>
          </nav>
        </header>

        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <p
            className="text-1xl sm:text-3xl md:text-5xl font-extrabold tracking-wide"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 25%, rgba(255,250,209,0.95) 0%, rgba(255,250,209,0) 36%), radial-gradient(circle at 82% 76%, rgba(255,221,132,0.78) 0%, rgba(255,221,132,0) 34%), linear-gradient(130deg, #fff7cf 0%, #ffe9a8 12%, #efc96a 26%, #9a6f1f 40%, #f7d57f 54%, #b17a23 68%, #ffefb7 82%, #c3872a 100%)",
              backgroundSize: "220% 220%, 190% 190%, 100% 100%",
              backgroundPosition: "45% 25%, 60% 80%, 0% 50%",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              textShadow: "0 1px 0 rgba(255,246,200,0.28), 0 0 10px rgba(229,177,63,0.16)",
            }}
          >
            شركة ومعصرة مناجل للانتاج الزراعي
          </p>
          <p
            className="text-xs sm:text-base md:text-xl font-semibold"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 22%, rgba(255, 250, 209, 0.98) 0%, rgba(255, 250, 209, 0) 34%), radial-gradient(circle at 82% 76%, rgba(255, 221, 132, 0.82) 0%, rgba(255, 221, 132, 0) 33%), linear-gradient(130deg, #fff7cf 0%, #ffe9a8 10%, #efc96a 22%, #9a6f1f 36%, #f7d57f 50%, #b17a23 64%, #ffefb7 77%, #c3872a 90%, #fbe09a 100%)",
              backgroundSize: "220% 220%, 190% 190%, 100% 100%",
              backgroundPosition: "45% 25%, 60% 80%, 0% 50%",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              textShadow: "0 1px 0 rgba(255, 246, 200, 0.25)",
            }}
          >
            التراث الفلسطيني في كل منتج
          </p>
        </div>

        <div className="hero-content relative z-10 mx-auto flex min-h-[88vh] w-full max-w-7xl flex-col justify-end pb-6 sm:min-h-[44vh] md:h-full md:min-h-0 md:pb-4 pt-20">

          <div className="mt-4 md:mt-6 flex justify-center">
            <Link
              href={isAdmin ? "/admin" : "/shop"}
              className="gold-button rounded-xl px-6 py-2 text-sm font-bold"
            >
              {isAdmin ? "لوحة التحكم" : "تسوق كل المنتجات"}
            </Link>
            
          </div>
        </div>
      </section>

      <section id="new-arrivals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div
          ref={arrivalsReveal.elementRef}
          className={`mb-12 text-center scroll-animate ${arrivalsReveal.isVisible ? "visible" : ""}`}
        >
          <h2 className="text-2xl md:text-3xl font-black mb-4 text-white">
            {language === "ar" ? "بعض المنتجات المميزة" : "Featured Products"}
          </h2>
          
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-6 auto-rows-fr">
          {featuredProducts.length === 0
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className={`relative h-full animate-pulse rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-5 ${idx % 2 === 0 ? "lg:col-span-7" : "lg:col-span-5"}`}>
                  <div className="rounded-xl sm:rounded-2xl bg-gray-700/50 h-36 sm:h-56 w-full mb-3 sm:mb-4" />
                  <div className="h-6 bg-gray-700/50 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-700/50 rounded mb-2 w-2/3" />
                  <div className="h-4 bg-gray-700/50 rounded mb-2 w-1/2" />
                </div>
              ))
            : featuredProducts.map((product, index) => {
                const sizeValues = Object.values(product.sizes || {}).filter(
                  (s) => typeof s?.price === "number" && s.price > 0
                );
                const saleSize = sizeValues.find(
                  (s) =>
                    typeof s?.salePrice === "number" &&
                    s.salePrice > 0 &&
                    s.salePrice < s.price
                );

                const hasSale = Boolean(saleSize);
                const basePrice = hasSale
                  ? (saleSize?.price ?? product.price)
                  : (sizeValues[0]?.price ?? product.price);
                const salePrice = hasSale
                  ? saleSize?.salePrice
                  : undefined;

                return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className={`group rounded-2xl sm:rounded-3xl border border-white/15 bg-[#171a1d] p-3 sm:p-5 hover:border-[#C9A66B]/70 transition-all duration-300 ${index === 0 ? "lg:col-span-7" : index === 1 ? "lg:col-span-5" : index === 2 ? "lg:col-span-5" : "lg:col-span-7"}`}
                >
                  <div
                    className="mb-3 sm:mb-4 h-36 sm:h-56 rounded-xl sm:rounded-2xl bg-cover bg-center"
                    style={{
                      backgroundImage: `linear-gradient(120deg, rgba(14,16,18,0.45), rgba(77,55,42,0.32)), url('${product.image || "/images/hero.jpg"}')`,
                    }}
                  />
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base sm:text-2xl font-extrabold text-white leading-tight">{t(`products.${product.id}.name`) === `products.${product.id}.name` ? product.name : t(`products.${product.id}.name`)}</h3>
                    <span className="text-right">
                      {hasSale ? (
                        <span className="block text-xs line-through" style={{ color: "rgb(220, 38, 38)" }}>₪{basePrice}</span>
                      ) : null}
                      <span className="text-xs sm:text-sm font-bold text-[#C9A66B]">
                        ₪{hasSale ? salePrice : basePrice}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/72 leading-6 sm:leading-7 line-clamp-3">
                    {t(`products.${product.id}.description`) === `products.${product.id}.description`
                      ? product.description
                      : t(`products.${product.id}.description`)}
                  </p>
                </Link>
              )})}
        </div>

        <div className="text-center mt-12">
          <Link
            href={isAdmin ? "/admin" : "/shop"}
            className="gold-button inline-block px-7 py-2.5 text-base rounded-xl font-bold transition-transform hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            {isAdmin ? "لوحة التحكم" : "تسوق كل المنتجات"}
          </Link>
        </div>
      </section>

      <section
        id="heritage-story"
        className="py-24 px-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(17,20,22,1) 0%, rgba(26,30,33,1) 52%, rgba(20,19,18,1) 100%)",
        }}
      >
        <div
          ref={heritageReveal.elementRef}
          className={`max-w-7xl mx-auto scroll-animate ${heritageReveal.isVisible ? "visible" : ""}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 rounded-3xl border border-white/10 p-8 md:p-12 bg-[#171b1f]">
              <p className="text-4xl uppercase tracking-[0.24em] text-[#C9A66B] mb-4">
                {language === "ar" ? "حكاية التراث" : "Heritage Story"}
              </p>
              <h2 className="text-1.5x1 md:text-2xl font-black mb-6 leading-[1.02] text-white">
                {language === "ar" ? "من قلب المعصرة" : "From the Heart of the mill"}
              </h2>
              <p className="text-white/75 leading-8 mb-6">
                {language === "ar"
                  ? "هنا تبدأ الحكاية… حيث تتحول ثمار الزيتون إلى زيتٍ نقي يحمل روح الأرض, نحافظ على طرق العصر الأصيلة لنقدم لكم جودة تُحاكي التراث وطعمًا لا يُنسى."
                  : "Here is where the story begins… where olives are transformed into pure oil that carries the spirit of the land.We preserve traditional pressing methods to deliver quality that reflects heritage and a taste that is unforgettable"}
              </p>
              <p className="text-white/75 leading-8">
                {language === "ar"
                  ? "من الزيت إلى كل منتج , كل قطعة تحمل سياقًا ثقافيًا واضحًا بنقدمها كمشهد فني موثوق." 
                  : "From olive oil to all products, each piece carries cultural context and is presented as a trustworthy art-like composition."}
              </p>
            </div>

            <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-[#C9A66B]/35 bg-black/30 min-h-[320px]">
              {heritageImages.map((imagePath, index) => (
                <div
                  key={imagePath}
                  className={`absolute inset-0 h-full min-h-[320px] bg-cover bg-center transition-opacity duration-1000 ${
                    index === heritageImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45)), url('${imagePath}')`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">🌿 {language === "ar" ? "مصدر طبيعي موثوق" : "Trusted natural sourcing"}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">🫒 {language === "ar" ? "تراث فلسطيني أصيل" : "Authentic Palestinian heritage"}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">✨ {language === "ar" ? "طرق تقليدية" : "Traditional methods"}</div>
          </div>
        </div>
      </section>

     
    </div>
  );
}
