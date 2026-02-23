"use client";

import ProductCard from "@/components/ProductCard";
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
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  
  const feature1 = useScrollAnimation({ delay: 0 });
  const feature2 = useScrollAnimation({ delay: 100 });
  const feature3 = useScrollAnimation({ delay: 200 });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.products)) {
            setProducts(data.products);
          }
        }
      } catch {
        // keep fallback
      }
    };

    loadProducts();
  }, [language]);

  const featuredProducts = products.filter((p) => p.featured);

  return (
    <>
      <SignupPrompt />
      <section
        className="hero-section text-white py-20 px-4 relative"
        style={{
          backgroundImage: "url('/images/hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
        <div className="hero-content max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">{t("home.title")}</h1>
          <p className="text-xl md:text-2xl mb-6 opacity-90">
            {t("home.subtitle")}
          </p>
          <p className="text-lg max-w-3xl mx-auto mb-8 opacity-85">
            {STORE_DESCRIPTION}
          </p>
          <Link
            href={isAdmin ? "/admin" : "/shop"}
            className="inline-block px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}
          >
            {isAdmin
              ? "لوحة التحكم"
              : t("common.shopNow")}
          </Link>
        </div>
        {/* Bottom Wave Decoration */}
        <div className="hero-wave-bottom"></div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in-down">
          <h2
            style={{ color: COLORS.primary }}
            className="text-4xl font-bold mb-4"
          >
            {t("home.featuredProducts")}
          </h2>
          <p className="text-gray-900">
            {t("home.featuredDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              animationDelay={index * 100}
              isFirstProduct={index === 0}
            />
          ))}
        </div>
      </section>

      {/* Why Choose Section */}
      <section
        style={{ backgroundColor: COLORS.light }}
        className="py-16 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <h2
            style={{ color: COLORS.primary }}
            className="text-4xl font-bold text-center mb-12"
          >
            {t("home.whyChoose")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              ref={feature1.elementRef}
              className={`text-center scroll-animate ${feature1.isVisible ? "visible" : ""}`}
            >
              <div
                style={{ backgroundColor: COLORS.primary }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-2xl">🌿</span>
              </div>
              <h3
                style={{ color: COLORS.primary }}
                className="text-xl font-bold mb-2"
              >
                {t("home.authentic")}
              </h3>
              <p className="text-gray-900">{t("home.authenticDesc")}</p>
            </div>

            <div 
              ref={feature2.elementRef}
              className={`text-center scroll-animate ${feature2.isVisible ? "visible" : ""}`}
            >
              <div
                style={{ backgroundColor: COLORS.primary }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-2xl">🛠️</span>
              </div>
              <h3
                style={{ color: COLORS.primary }}
                className="text-xl font-bold mb-2"
              >
                {t("home.handcrafted")}
              </h3>
              <p className="text-gray-900">{t("home.handcraftedDesc")}</p>
            </div>

            <div 
              ref={feature3.elementRef}
              className={`text-center scroll-animate ${feature3.isVisible ? "visible" : ""}`}
            >
              <div
                style={{ backgroundColor: COLORS.primary }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-2xl">❤️</span>
              </div>
              <h3
                style={{ color: COLORS.primary }}
                className="text-xl font-bold mb-2"
              >
                {t("home.supportLocal")}
              </h3>
              <p className="text-gray-900">{t("home.supportLocalDesc")}</p>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
