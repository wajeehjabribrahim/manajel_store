"use client";

import SignupPrompt from "@/components/SignupPrompt";
import { COLORS, STORE_DESCRIPTION } from "@/constants/store";
import { PRODUCTS, Product } from "@/constants/products";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function HomeContent() {
  const { t, language } = useLanguage();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [heritageImageIndex, setHeritageImageIndex] = useState(0);
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

      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70 backdrop-blur">
            <a href="#new-arrivals" className="hover:text-white transition-colors">
              {language === "ar" ? "وصل حديثًا" : "Arrivals"}
            </a>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <a href="/about" className="hover:text-white transition-colors">
              {language === "ar" ? "قصتنا" : "Story"}
            </a>
          </div>
        </div>
      </div>

      <section
        className="hero-section relative min-h-[44vh] px-4 text-white md:min-h-[76vh]"
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

        <div className="hero-content relative z-10 mx-auto flex min-h-[44vh] w-full max-w-7xl flex-col justify-end pb-6 md:min-h-[76vh] md:pb-10">
          <div className="max-w-4xl">
              

              <p className="text-base md:text-lg max-w-2xl text-white/85 leading-8">
                {STORE_DESCRIPTION || t("home.subtitle")}
              </p>
          </div>

          <div className="mt-4 md:mt-6 flex flex-wrap gap-4">
            <Link
              href={isAdmin ? "/admin" : "/shop"}
              className="gold-button rounded-xl px-8 py-3 font-bold"
            >
              {isAdmin ? "لوحة التحكم" : t("common.shopNow")}
            </Link>
            <a
              href="#new-arrivals"
              className="rounded-xl border border-white/25 bg-white/5 px-8 py-3 font-semibold text-white/90"
            >
              {language === "ar" ? "اكتشف المجموعة" : "Explore collection"}
            </a>
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
            className="gold-button inline-block px-10 py-4 text-lg rounded-xl font-bold transition-transform hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            {isAdmin ? "لوحة التحكم" : t("common.shopNow")}
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
              <h2 className="text-1.5xl md:text-6xl font-black mb-6 leading-[1.02] text-white">
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
