"use client";

import SignupPrompt from "@/components/SignupPrompt";
import { COLORS, STORE_DESCRIPTION } from "@/constants/store";
import { PRODUCTS, Product } from "@/constants/products";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { optimizeImage } from "@/lib/optimizeImage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function HomeContent() {
  const { t, language, dir } = useLanguage();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const desktopUserMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);
  const featuredSwiperRef = useRef<SwiperType | null>(null);
  const testimonialsSwiperRef = useRef<SwiperType | null>(null);
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
      const target = event.target as Node;
      const isInsideDesktop = desktopUserMenuRef.current?.contains(target);
      const isInsideMobile = mobileUserMenuRef.current?.contains(target);

      if (!isInsideDesktop && !isInsideMobile) {
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
  // Run through optimizeImage so every entry gets f_auto,q_auto and a width cap.
  // The third URL had been added without them and was delivered as a raw 1.8 MB
  // PNG — on its own, 65% of this page's weight. Entries that already carry
  // transforms are returned untouched by the helper.
  const heritageImages = [
    "https://res.cloudinary.com/dj5k9x9sl/image/upload/q_auto,f_auto/v1774980574/mill_flxe3m.webp",
    "https://res.cloudinary.com/dj5k9x9sl/image/upload/q_auto,f_auto/v1774980569/mail_ruyrci.webp",
    "https://res.cloudinary.com/dj5k9x9sl/image/upload/v1784456624/7ca2d686-f226-4b96-9ff6-ad28498493b4_fhxpzg.png",
  ].map((url) => optimizeImage(url, 1200));
  const arrivalsReveal = useScrollAnimation({ delay: 100, triggerOnce: false });
  const aboutReveal = useScrollAnimation({ delay: 60, triggerOnce: false });
  const heroTextReveal = useScrollAnimation({ delay: 80, triggerOnce: false });
  const separatorReveal = useScrollAnimation({ delay: 120, triggerOnce: false });
  const heritageTextReveal = useScrollAnimation({ delay: 120, triggerOnce: false });
  const heritageReveal = useScrollAnimation({ delay: 200 });

  useEffect(() => {
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms
    const cacheKey = `manajel-products-cache-${language}`;
    const metaKey = `manajel-products-cache-meta-${language}`;

    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.products)) {
            setProducts(data.products);
            try {
              localStorage.setItem(cacheKey, JSON.stringify(data.products));
              localStorage.setItem(metaKey, JSON.stringify({ ts: Date.now() }));
            } catch {
              // ignore cache errors
            }
          }
        }
      } catch {
        // keep fallback
      }
    };

    (function init() {
      try {
        const cached = localStorage.getItem(cacheKey);
        const metaRaw = localStorage.getItem(metaKey);
        let fresh = false;

        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            if (metaRaw) {
              try {
                const meta = JSON.parse(metaRaw);
                const ts = typeof meta?.ts === "number" ? meta.ts : 0;
                if (Date.now() - ts < CACHE_TTL) fresh = true;
              } catch {
                // ignore meta parse
              }
            }
          }
        }

        if (!fresh) {
          loadProducts();
        }
      } catch {
        loadProducts();
      }
    })();
  }, [language]);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const testimonials = [
    {
      nameAr: "أحمد الكيلاني",
      roleAr: "زبون دائم",
      reviewAr: "الزيت فعلاً مرتب وطعمه واضح من أول تجربة. التوصيل دايما سريع والتغليف مرتب.",
      nameEn: "Ahmad Al-Kilani",
      roleEn: "Loyal Customer",
      reviewEn: "The olive oil is truly authentic and you can taste the quality immediately. Fast delivery and great packaging.",
    },
    {
      nameAr: "لينا أبو خليل",
      roleAr: "عميلة منذ 2022",
      reviewAr: "من أجمل المنتجات الفلسطينية اللي جربتها. الجودة ثابتة بكل طلبية.",
      nameEn: "Lina Abu Khalil",
      roleEn: "Customer Since 2022",
      reviewEn: "One of the best Palestinian products I have tried. The quality is consistent in every order.",
    },
    {
      nameAr: "محمد الصباح",
      roleAr: "صاحب مطعم",
      reviewAr: "اعتمدنا منتجات مناجل بالمطعم، والزباين لاحظوا الفرق عطول بالطعم.",
      nameEn: "Mohammad Al-Sabah",
      roleEn: "Restaurant Owner",
      reviewEn: "We use Manajel products in our restaurant, and customers noticed the flavor difference right away.",
    },
    {
      nameAr: "سمر النجار",
      roleAr: "مشتري متكرر",
      reviewAr: "تعامل راقي وجودة ممتازة. صرت أوصي فيكم لكل العيلة والأصحاب.",
      nameEn: "Samar Al-Najjar",
      roleEn: "Repeat Buyer",
      reviewEn: "Great service and excellent quality. I keep recommending you to family and friends.",
    },
    {
      nameAr: "رامي الخطيب",
      roleAr: "عميل جديد",
      reviewAr: "أول طلب إلي وكان فوق التوقعات. الطعم أصيل والمنتج نظيف وواضح الاهتمام فيه.",
      nameEn: "Rami Al-Khatib",
      roleEn: "New Customer",
      reviewEn: "My first order exceeded expectations. Authentic taste, clean product, and clear attention to detail.",
    },
  ];
  const testimonialSlides = testimonials.length > 0
    ? Array.from({ length: Math.max(testimonials.length, 12) }, (_, idx) => ({
        key: `${idx}-${language}`,
        item: testimonials[idx % testimonials.length],
      }))
    : [];
  const minimumLoopSlides = 8;
  const featuredSlides =
    featuredProducts.length === 0
      ? []
      : Array.from(
          { length: Math.max(featuredProducts.length, minimumLoopSlides) },
          (_, idx) => {
            const product = featuredProducts[idx % featuredProducts.length];
            return {
              key:
                idx < featuredProducts.length
                  ? product.id
                  : `${product.id}-dup-${idx}`,
              product,
            };
          }
        );

  useEffect(() => {
    const swiper = featuredSwiperRef.current;
    if (!swiper) return;

    swiper.update();

    if (featuredSlides.length > 1) {
      swiper.autoplay?.start();
      return;
    }

    swiper.autoplay?.stop();
  }, [featuredSlides.length]);

  useEffect(() => {
    const swiper = testimonialsSwiperRef.current;
    if (!swiper) return;

    swiper.update();

    if (testimonialSlides.length > 1) {
      swiper.autoplay?.start();
      return;
    }

    swiper.autoplay?.stop();
  }, [testimonialSlides.length]);

  return (
    <div className="bg-[#FBF8F2] text-[#121416]">
      <SignupPrompt />

        <section
          className="hero-section relative w-full aspect-[4/5] min-h-[72vh] px-4 text-white sm:aspect-auto sm:min-h-[44vh] md:aspect-[15/8] md:min-h-[44vh] mt-0"
        style={{
          // The image itself lives in the .hero-section rule in globals.css so
          // it can be declared as AVIF with a WebP fallback via image-set().
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(251,248,242,0) 86%, rgba(251,248,242,0.9) 100%), linear-gradient(180deg, rgba(22,17,11,0.5) 0%, rgba(22,17,11,0.28) 32%, rgba(22,17,11,0.26) 62%, rgba(22,17,11,0.42) 100%)",
          }}
        />

        {/* Header overlay on hero */}
        <header className="absolute top-0 left-0 right-0 z-50 w-full text-white tajawal-regular-all">
          <nav className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 lg:py-5 relative z-10">
            <div className="flex justify-between items-center relative lg:gap-8">
              {/* Logo */}
              <Link href="/store" className="flex items-center gap-2 lg:gap-3 group lg:translate-x-2">
                <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-lg flex items-center justify-center overflow-hidden border transition-transform duration-150 hover:duration-300 group-hover:scale-110" style={{ borderColor: `${gold}88`, boxShadow: "0 8px 18px rgba(201,166,107,0.2)" }}>
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
                  <span className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight transition-all duration-150 hover:duration-300 group-hover:text-opacity-90">{t("nav.brand")}</span>
                  <span className="text-[8px] lg:text-[9px] opacity-70 font-semibold tracking-[0.2em]">PALESTINE</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-6 lg:gap-9 lg:-translate-x-2">
                {[
                  { name: t("nav.home"), href: "/store" },
                  { name: t("nav.shop"), href: "/store/shop" },
                  { name: t("nav.about"), href: "/store/about" },
                  { name: t("nav.contact"), href: "/store/contact" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-xs lg:text-sm font-semibold uppercase tracking-[0.1em] text-white/80 hover:text-white transition-colors duration-150 hover:duration-300"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Language Switcher, Auth & Cart */}
              <div className="hidden lg:flex items-center gap-5 lg:gap-6">
                <LanguageSwitcher />
                
                {/* قائمة السلة والطلبات - للجميع */}
                <div className="relative z-50" ref={desktopUserMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="transition-opacity duration-150 hover:duration-300 relative flex items-center gap-2 text-white/85 hover:text-white"
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
                        href="/store/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-3 transition-colors"
                        style={{
                          color: "#121416",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
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
                          <span className="font-semibold text-sm">{t("admin.orders") === "admin.orders" ? "الطلبات" : t("admin.orders")}</span>
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
                          href="/store/admin/products"
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
                          href="/store/admin/orders"
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
                      href="/store/account"
                      className="transition-opacity w-8 h-8 flex items-center justify-center"
                      title={t("account.title") === "account.title" ? "الحساب" : t("account.title")}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                      href="/store/login"
                      className="px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 transition-colors duration-150 hover:duration-300"
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      href="/store/register"
                      className="px-2 py-1 text-xs rounded-md border transition-colors"
                      style={{ borderColor: `${gold}88`, color: "#F2ECE2" }}
                    >
                      {t("auth.register")}
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Icons - Language, Account & Cart */}
              <div className="lg:hidden flex items-center gap-2">
                <LanguageSwitcher />
                <Link
                  href={isAuthenticated ? "/store/account" : "/store/login"}
                  className="transition-opacity w-8 h-8 flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <div className="relative z-50" ref={mobileUserMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="transition-opacity duration-150 hover:duration-300 relative flex items-center justify-center text-white/85 hover:text-white"
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
            </div>
          </nav>
        </header>

        <div
          ref={heroTextReveal.elementRef}
          className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-4 text-center scroll-animate transition-all duration-700 ${heroTextReveal.isVisible ? "visible opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{
            background:
              "radial-gradient(ellipse 62% 42% at 50% 46%, rgba(20,15,8,0.4) 0%, rgba(20,15,8,0.22) 55%, rgba(20,15,8,0) 100%)",
          }}
        >
          <p className="gold-texture-hero text-xl sm:text-5xl md:text-5xl tajawal-regular-all font-extrabold tracking-wide">
            {language === "ar" ? "شركة ومعصرة مناجل للانتاج الزراعي" : "Manajel Company & Mill for Agricultural Production"}
          </p>
          <p className="gold-texture-hero text-xs sm:text-base md:text-2xl font-semibold tajawal-regular-all tracking-wide max-w-3xl">
            {language === "ar" ? "التراث الفلسطيني في كل منتج" : "Palestinian heritage in every product"}
          </p>
        </div>

        <div className="hero-content relative z-10 mx-auto flex min-h-[96vh] w-full max-w-7xl flex-col justify-end pb-6 sm:min-h-[44vh] md:h-full md:min-h-0 md:pb-4 pt-20">
          {/* content inside centered container (kept empty to preserve vertical spacing) */}
        </div>

        <div className="absolute left-0 right-0 bottom-6 z-40 flex justify-center pointer-events-auto">
          <Link
            href={isAdmin ? "/store/admin" : "/store/shop"}
            className="gold-button rounded-xl px-6 py-2 text-sm font-bold"
          >
            {isAdmin ? "لوحة التحكم" : language === "ar" ? "تسوق كل المنتجات" : "Shop All Products"}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div
          ref={aboutReveal.elementRef}
          className={`mx-auto flex min-h-[180px] max-w-4xl flex-col items-center justify-center text-center transition-all duration-700 ${aboutReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <p className="text-2xl sm:text-5xl font-extrabold gold-texture tajawal-regular-all transition-all duration-700">
            {language === "ar" ? "من نحن" : "Who We Are"}
          </p>
          <p className="mt-4 mx-auto max-w-3xl text-sm sm:text-base font-normal tajawal-regular leading-8 text-black/75 transition-all duration-700 delay-150">
            {language === "ar"
              ? "أكثر من مجرد متجر… إحنا في مناجل شركة ومعصرة، بدايتنا كانت في 2021، لكن خبرتنا بهالمجال متوارثة من الأجداد. هدفنا نوصل لكم خير الأرض الفلسطينية زي ما هو، بطعم أصيل وجودة بنفتخر فيها."
              : "More than just a store… At Manajel, we are a company and olive mill. Our journey began in 2021, but our experience in this field has been passed down through generations. Our goal is to bring you the goodness of Palestinian land as it is—authentic in taste and quality we are proud of."}
          </p>
        </div>
      </section>

      <section id="new-arrivals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-20">
        <div
          ref={arrivalsReveal.elementRef}
          className={`mb-12 text-center scroll-animate transition-all duration-700 ${arrivalsReveal.isVisible ? "visible opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="mb-4 flex w-full items-center justify-center gap-3 sm:gap-4 overflow-hidden">
            <span className="h-px flex-1 bg-[#C9A66B]/70" />
            <h2 className="whitespace-nowrap text-1xl md:text-3xl font-black gold-texture tajawal-regular-all">
              {language === "ar" ? "بعض المنتجات المميزة" : "Featured Products"}
            </h2>
            <span className="h-px flex-1 bg-[#C9A66B]/70" />
          </div>
        
          
        </div>

        <div
          onMouseEnter={() => featuredSwiperRef.current?.autoplay?.stop()}
          onMouseLeave={() => featuredSwiperRef.current?.autoplay?.start()}
          className="w-full"
        >
        <Swiper
          key={`featured-${language}-${dir}`}
          modules={[Autoplay, Pagination]}
          spaceBetween={20}
          slidesPerView={1.2}
          centeredSlides={false}
          slidesPerGroup={1}
          loop={featuredSlides.length > 3}
          rewind={false}
          watchOverflow={false}
          speed={1200}
          allowTouchMove={true}
          autoplay={
            featuredSlides.length > 1
              ? {
                  delay: 1300,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: false,
                  stopOnLastSlide: false,
                }
              : false
          }
          onSwiper={(swiper) => {
            featuredSwiperRef.current = swiper;
            if (featuredSlides.length > 1) {
              swiper.autoplay.start();
            }
          }}
          pagination={{ clickable: true }}
          dir={dir}
          breakpoints={{
            640: { slidesPerView: 1.8 },
            1024: { slidesPerView: 2.4 },
            1280: { slidesPerView: 3 },
          }}
            className="featured-products-swiper pb-2"
        >
          {featuredProducts.length === 0
            ? Array.from({ length: 4 }).map((_, idx) => (
                <SwiperSlide key={idx}>
                  <div className="relative h-[340px] sm:h-[420px] rounded-2xl sm:rounded-3xl border border-black/10 bg-black/5 p-3 sm:p-5 overflow-hidden animate-pulse">
                    <div className="rounded-xl sm:rounded-2xl bg-gray-300/60 aspect-video w-full mb-3 sm:mb-4" />
                    <div className="h-6 bg-gray-300/60 rounded mb-2 w-3/4" />
                    <div className="h-4 bg-gray-300/60 rounded mb-2 w-2/3" />
                    <div className="h-4 bg-gray-300/60 rounded mb-2 w-1/2" />
                  </div>
                </SwiperSlide>
              ))
            : featuredSlides.map(({ key, product }, idx) => {
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
                  <SwiperSlide key={key}>
                    <Link
                      href={`/store/products/${product.id}`}
                      className="featured-product-card-auto group block h-full border border-transparent bg-transparent p-0 hover:border-[#C9A66B] transition-all duration-150 hover:duration-300 shadow-lg overflow-hidden"
                      style={{ boxShadow: "0 4px 24px 0 #0002", maxWidth: '240px', minWidth: '0' }}
                    >
                      <div className="aspect-[8/10] overflow-hidden bg-[#F3EEE3] w-full">
                          {/** First 3 slides are typically above the fold on desktop/tablet */}
                          {(() => {
                            const isAboveFoldFeatured = idx < 3;
                            return (
                        <Image
                          src={product.image || "/images/hero.jpg"}
                          alt={product.name}
                          width={800}
                          height={800}
                          className="w-full h-full object-cover featured-product-image"
                            loading={isAboveFoldFeatured ? "eager" : "lazy"}
                            priority={isAboveFoldFeatured}
                            fetchPriority={isAboveFoldFeatured ? "high" : "auto"}
                        />
                            );
                          })()}
                      </div>
                      <div className="px-5 pb-5 pt-2 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[#121416] tajawal-regular text-[13px] md:text-sm lg:text-base leading-tight line-clamp-2">
                            {t(`products.${product.id}.name`) === `products.${product.id}.name` ? product.name : t(`products.${product.id}.name`)}
                          </h3>
                          <div className="flex items-center gap-2 min-w-fit">
                            {hasSale ? (
                              <span className="text-xs sm:text-sm line-through text-red-600 font-semibold">₪{basePrice}</span>
                            ) : null}
                            <span className="text-base sm:text-lg font-bold text-[#C9A66B] flex items-center gap-1">
                              <span className="text-[1.1em]">₪</span>{hasSale ? salePrice : basePrice}
                            </span>
                          </div>
                        </div>
                        <p className={`text-xs sm:text-sm lg:text-xs tajawal-regular text-black/70 leading-5 line-clamp-2 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                          {t(`products.${product.id}.description`) === `products.${product.id}.description`
                            ? product.description
                            : t(`products.${product.id}.description`)}
                        </p>
                      </div>
                    </Link>
                  </SwiperSlide>
              )})}
        </Swiper>
        </div>

        <div
          ref={separatorReveal.elementRef}
          className={`mt-12 sm:mt-14 mb-6 flex items-center justify-center gap-3 sm:gap-5 group transition-all duration-700 ${separatorReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <span className="h-px w-12 sm:w-20 bg-[#C9A66B]/45 transition-transform duration-150 transform-gpu will-change-transform origin-center " />
          <Image
            src="/images/split.png"
            alt="decorative separator"
            width={2008}
            height={512}
            className="h-auto w-full max-w-[220px] sm:max-w-[320px] md:max-w-[420px] opacity-90 transition-transform duration-150 transform-gpu will-change-transform "
            loading="lazy"
          />
          <span className="h-px w-12 sm:w-20 bg-[#C9A66B]/45 transition-transform duration-150 transform-gpu will-change-transform origin-center group-hover:scale-x-110" />
        </div>


        {/*<div className="text-center mt-12">
          <Link
            href={isAdmin ? "/store/admin" : "/store/shop"}
            className="gold-button inline-block px-7 py-2.5 text-base rounded-xl font-bold transition-transform duration-150 hover:duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            {isAdmin ? "لوحة التحكم" : language === "ar" ? "تسوق كل المنتجات" : "Shop All Products"}
          </Link>
        </div>*/}
      </section>

      <section
        id="heritage-story"
        className="py-15 px-4"
        style={{
          background: "#FBF8F2",
        }}
      >
        <div
          ref={heritageReveal.elementRef}
          className={`max-w-7xl mx-auto scroll-animate ${heritageReveal.isVisible ? "visible" : ""}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="order-1 lg:order-1 lg:col-span-6 group relative rounded-2xl overflow-hidden border border-[#C9A66B]/35 bg-black/30 min-h-[280px] shadow-[0_18px_38px_rgba(0,0,0,0.35)] transition-transform duration-150 hover:duration-300 hover:-translate-y-1 hover:scale-[1.01]">
              <div className="slider-container relative w-full h-full rounded-xl border border-[#C9A66B]/40 overflow-hidden shadow-[0_10px_26px_rgba(0,0,0,0.35)]">
                {heritageImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Heritage image ${idx + 1}`}
                    className="slider-img"
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/15 to-black/70 rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent rounded-xl" />

              <div className="absolute inset-x-0 bottom-0 z-10 pb-6 pl-6 pr-4 sm:pb-8 sm:pl-8 sm:pr-6">
                

                <div className="flex flex-wrap gap-2 justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A66B]/50 bg-black/35 px-2.5 py-1 text-xs sm:text-sm text-[#F2ECE2] tajawal-regular-all">
                    <svg className="h-3.5 w-3.5 shrink-0 text-[#E6C88A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                    </svg>
                    {language === "ar" ? "مصدر طبيعي" : "Natural Source"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A66B]/50 bg-black/35 px-2.5 py-1 text-xs sm:text-sm text-[#F2ECE2] tajawal-regular-all">
                    <svg className="h-3.5 w-3.5 shrink-0 text-[#E6C88A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a9 9 0 0 0 9-9c0-4-2.5-7.5-5-9.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a9 9 0 0 1-9-9c0-4 2.5-7.5 5-9.5" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    {language === "ar" ? "تراث فلسطيني" : "Palestinian Heritage"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A66B]/50 bg-black/35 px-2.5 py-1 text-xs sm:text-sm text-[#F2ECE2] tajawal-regular-all">
                    <svg className="h-3.5 w-3.5 shrink-0 text-[#E6C88A]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    </svg>
                    {language === "ar" ? "طرق تقليدية" : "Traditional Methods"}
                  </span>
                </div>
              </div>
            </div>

            <div
              ref={heritageTextReveal.elementRef}
              className={`order-2 lg:order-2 lg:col-span-6 p-2 sm:p-4 md:p-6 lg:p-0 tajawal-regular-all transition-all duration-700 ${heritageTextReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${language === "ar" ? "text-right" : "text-left"}`}
            >
              <p className={`text-3xl sm:text-4xl md:text-10xl mb-5 leading-[1.2] font-extrabold gold-texture ${language === "ar" ? "tracking-[0.01em]" : "tracking-[0.01em]"}`}>
                <span className="block w-full">{language === "ar" ? "حكاية التراث" : "Heritage Story"}</span>
              </p>
              
              <p className={`text-base sm:text-lg text-black/75 leading-8 sm:leading-9 mb-6 ${language === "ar" ? "" : "max-w-xl"}`}>
                {language === "ar"
                  ? "من قلب المعصرة تبدأ الحكاية…"
                  : "From the heart of the mill, the story begins…"}
              </p>
              <p className={`text-sm sm:text-base text-black/70 leading-7 sm:leading-8 max-w-3xl ${language === "ar" ? "lg:ms-auto" : ""}`}>
                {language === "ar"
                  ? "زيت زيتون نقي يُعصر بطرق أصيلة، ليحملك طعم الأرض وروحها." 
                : "Pure olive oil, pressed using traditional methods, carrying the taste of the land and its soul."}
              </p>

              <div className="mt-6">
                <Link
                  href="/store/about"
                  className="inline-flex items-center rounded-lg border border-[#C9A66B]/60 bg-[#C9A66B]/10 px-4 py-2 text-sm font-semibold text-[#C9A66B] transition-colors duration-150 hover:duration-300 hover:bg-[#C9A66B]/20"
                >
                  {language === "ar" ? "اكتشف المزيد" : "Read More"}
                </Link>
              </div>
            </div>
          </div>

          <div className="mb-10 md:mb-14" />

          <section className="mt-28 md:mt-48">
            <div className="mb-6 md:mb-8 flex items-center justify-center gap-3 sm:gap-4 overflow-hidden">
              <span className="h-px flex-1 bg-[#C9A66B]/55" />
              <h3 className="whitespace-nowrap text-2xl md:text-3xl font-black gold-texture tajawal-regular-all">
                {language === "ar" ? "ثقة عملائنا" : "Our Customers Trust"}
              </h3>
              <span className="h-px flex-1 bg-[#C9A66B]/55" />
            </div>

            <div className="w-full">
              <Swiper
                key={`testimonials-${language}-${dir}`}
                modules={[Autoplay, Pagination]}
                spaceBetween={20}
                slidesPerView={1.2}
                centeredSlides={false}
                slidesPerGroup={1}
                loop={testimonialSlides.length > 3}
                watchOverflow={false}
                speed={1200}
                allowTouchMove={true}
                autoplay={
                  testimonialSlides.length > 1
                    ? ({
                        delay: 5300,
                        disableOnInteraction: false,
                        reverseDirection: false,
                      } as any)
                    : false
                }
                onSwiper={(swiper) => {
                  testimonialsSwiperRef.current = swiper;
                  if (testimonialSlides.length > 1) {
                    swiper.autoplay.start();
                  }
                }}
                
                pagination={{ clickable: true }}
                dir={dir}
                breakpoints={{
                  640: { slidesPerView: 1.8 },
                  1024: { slidesPerView: 2.4 },
                  1280: { slidesPerView: 3 },
                }}
                className="featured-products-swiper pb-3"
              >
                {testimonialSlides.map(({ key, item }) => (
                  <SwiperSlide key={key}>
                    <article className="h-full min-h-[210px] rounded-2xl border border-[#C9A66B]/45 bg-white p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 hover:duration-300 hover:-translate-y-1">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm sm:text-base font-extrabold text-[#121416] tajawal-regular-all">
                            {language === "ar" ? item.nameAr : item.nameEn}
                          </p>
                          <p className="text-xs sm:text-sm text-black/60 tajawal-regular">
                            {language === "ar" ? item.roleAr : item.roleEn}
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A66B]/60 bg-[#C9A66B]/12 px-2.5 py-1 text-[11px] font-semibold text-[#96691A]">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.42 0l-3.2-3.2a1 1 0 111.415-1.415l2.493 2.492 6.493-6.492a1 1 0 011.419-.005z" clipRule="evenodd" />
                          </svg>
                          {language === "ar" ? "مشتري مؤكد" : "Verified Purchase"}
                        </span>
                      </div>

                      <div
                        className="mb-3 flex items-center gap-0.5 text-base sm:text-lg"
                        style={{ color: "#E8B923" }}
                        aria-label="5 star rating"
                      >
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                      </div>

                      <p className="text-sm sm:text-[15px] leading-7 text-black/80 tajawal-regular">
                        “{language === "ar" ? item.reviewAr : item.reviewEn}”
                      </p>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        </div>
      </section>

    </div>
  );
}
