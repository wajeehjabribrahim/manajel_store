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

// One pill for both calls to action on this page — the hero's and the one under
// the featured products — so they read as the same control in two places.
const CTA_PILL =
  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FBF8F2] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 md:text-[11px]";
const CTA_PILL_STYLE = {
  backgroundColor: "#3E2F1C",
  boxShadow: "0 8px 20px rgba(62,47,28,0.26)",
};

export default function HomeContent() {
  const { t, language, dir } = useLanguage();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  // Which language the loaded products belong to. Switching language re-runs the
  // fetch, and until it resolves `products` still holds the previous language's
  // names — that is why featured product names showed in Arabic under English.
  const [productsLang, setProductsLang] = useState<string | null>(null);
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
            setProductsLang(language);
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
            setProductsLang(language);
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

  // Only render products fetched for the language currently on screen.
  const featuredProducts =
    productsLang === language ? products.filter((p) => p.featured).slice(0, 4) : [];
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
          className="hero-section relative w-full aspect-[4/5] min-h-[72vh] sm:aspect-auto sm:min-h-[52vh] md:aspect-[15/8] md:min-h-[56vh] mt-0"
        style={{
          // The image itself lives in the .hero-section rule in globals.css so
          // it can be declared as AVIF with a WebP fallback via image-set().
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Cream scrim instead of the old dark one, and horizontal at every
            width: the lockup sits on the left in both languages, so only the
            left band is lightened and the bottle on the right keeps its colour.
            The earlier vertical ramp on phones washed out most of the photo. */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background:
              // Held high across the text column (which ends at 62%) so the
              // photograph's dark patches can't swallow the gold, then dropped
              // fast — the bottle from ~72% on keeps its full colour.
              "linear-gradient(to right, rgba(251,248,242,0.93) 0%, rgba(251,248,242,0.9) 40%, rgba(251,248,242,0.86) 58%, rgba(251,248,242,0.3) 74%, rgba(251,248,242,0.05) 88%, rgba(251,248,242,0) 96%), linear-gradient(180deg, rgba(251,248,242,0) 84%, rgba(251,248,242,0.9) 100%)",
          }}
        />
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            // Always "to right": the lockup stays on the left in both
            // languages so it never lands on the bottle.
            background: `linear-gradient(to right, rgba(251,248,242,0.95) 0%, rgba(251,248,242,0.92) 30%, rgba(251,248,242,0.72) 44%, rgba(251,248,242,0.25) 62%, rgba(251,248,242,0) 80%), linear-gradient(180deg, rgba(251,248,242,0) 88%, rgba(251,248,242,0.92) 100%)`,
          }}
        />

        {/* The shared <Header /> now renders on this page too, so the hero no
            longer carries its own duplicate overlay header. */}

        <div
          ref={heroTextReveal.elementRef}
          // Pinned to the left in both languages, on purpose: the photograph's
          // subject sits on the right, so a mirrored RTL lockup would land on
          // top of the bottle. In RTL the cross axis runs right-to-left, so
          // flex-end — not flex-start — is the left edge.
          className={`hero-content relative z-20 mx-auto flex h-full w-full max-w-7xl flex-col justify-center gap-3 px-4 text-left scroll-animate transition-all duration-700 sm:px-6 md:gap-5 lg:px-8 ${language === "ar" ? "items-end" : "items-start"} ${heroTextReveal.isVisible ? "visible opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          {/* Capped to 70% of the column on phones so a line never runs under
              the bottle on the right. */}
          <h1 className="hero-display gold-texture max-w-[62%] text-2xl leading-[1.35] sm:text-3xl md:max-w-[18ch] md:text-[2.75rem] md:leading-[1.25]">
            {language === "ar" ? "شركة ومعصرة مناجل للانتاج الزراعي" : "Manajel Company & Mill for Agricultural Production"}
          </h1>

          {/* Decorative olive-branch rule. The artwork carries its own side
              lines and a transparent ground, so it stands alone. */}
          <Image
            src="/images/zakhrafa.png"
            alt=""
            aria-hidden="true"
            width={2172}
            height={724}
            sizes="(max-width: 767px) 180px, 240px"
            className="h-auto w-[180px] md:w-[240px]"
          />

          <p className="max-w-[70%] text-sm font-normal leading-7 text-[#3E2F1C]/85 tajawal-regular sm:text-base md:max-w-[42ch] md:text-base md:leading-8">
            {language === "ar" ? "التراث الفلسطيني في كل منتج" : "Palestinian heritage in every product"}
          </p>

          <Link
            href="/store/shop"
            className={`mt-1 ${CTA_PILL}`}
            style={CTA_PILL_STYLE}
          >
            {language === "ar" ? "تسوّق الآن" : "Shop Now"}
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              // The arrow points along the reading direction, so it flips in Arabic.
              style={{ transform: language === "ar" ? "scaleX(-1)" : undefined }}
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
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

        {/* Moved out of the hero: the call to action follows the featured
            products, and sits above the separator so it still belongs to this
            section rather than introducing the heritage story below it. */}
        <div className="text-center mt-12">
          <Link
            href={isAdmin ? "/store/admin" : "/store/shop"}
            className={CTA_PILL}
            style={CTA_PILL_STYLE}
          >
            {isAdmin ? "لوحة التحكم" : language === "ar" ? "تسوق كل المنتجات" : "Shop All Products"}
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: language === "ar" ? "scaleX(-1)" : undefined }}
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
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
