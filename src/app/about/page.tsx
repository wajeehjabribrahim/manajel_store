"use client";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";
import AnimatedSection from "@/components/AnimatedSection";

export default function About() {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    <div className="bg-[#121416] text-[#F2ECE2]">
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(180deg, #14171a 0%, #101214 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="text-white py-12 sm:py-20 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold gold-texture mb-0 leading-tight">
            {t.about.title}
          </h1>
          
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-0">
          <AnimatedSection animationType="fade-left">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 text-[#C9A66B] text-center">
              {t.about.ourStory}
            </h2>
            <p className="text-[13px] sm:text-base text-white/80 mb-4 leading-relaxed">
              {t.about.storyPara1}
            </p>
            <p className="text-[13px] sm:text-base text-white/80 mb-4 leading-relaxed">
              {t.about.storyPara2}
            </p>
            <p className="text-[13px] sm:text-base text-white/80 mb-4 leading-relaxed">
              {t.about.storyPara3}
            </p>
            <p className="text-[13px] sm:text-base text-white/80 leading-relaxed">
              {t.about.storyPara4}
            </p>
          </AnimatedSection>
          <AnimatedSection animationType="fade-right" delay={100}>
            <div
              className="rounded-xl border border-white/10 bg-[#171a1d] p-6 sm:p-8 flex flex-col justify-center"
            >
              <h3 className="text-lg sm:text-2xl font-bold mb-4 text-[#C9A66B]">
                {t.about.ourValues}
              </h3>
              <ul className="space-y-3">
                {[
                  t.about.value1,
                  t.about.value2,
                  t.about.value3,
                  t.about.value4,
                  t.about.value5,
                  t.about.value6,
                ].map((value, i) => (
                  <li key={i} className="flex items-start">
                    <span className="font-bold mr-3 text-[#C9A66B]">
                      ✓
                    </span>
                    <span className="text-[13px] sm:text-base text-white/80">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>

        {/* Products Section */}
        <AnimatedSection animationType="fade-up">
          <div className="mb-16">
            <h2 className="text-xl sm:text-3xl font-bold mb-2 text-center text-[#C9A66B]">
              {t.about.products}
            </h2>
            <p className="text-center text-white/70 text-sm sm:text-base mb-8">
              {language === "ar" 
                ? "مجموعة منتقاة من أفضل المنتجات الفلسطينية الأصيلة"
                : "A curated selection of the finest authentic Palestinian products"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  name: t.about.product1,
                  desc: language === "ar" 
                    ? "زيت عالي الجودة معصور بطرق تقليدية"
                    : "High-quality oil pressed traditionally"
                },
                {
                  name: t.about.product2,
                  desc: language === "ar"
                    ? "مزيج عطري من الأعشاب الطبيعية"
                    : "Aromatic blend of natural herbs"
                },
                {
                  name: t.about.product3,
                  desc: language === "ar"
                    ? "أعشاب طبيعية من جبال فلسطين"
                    : "Natural herbs from Palestinian mountains"
                },
                {
                  name: t.about.product4,
                  desc: language === "ar"
                    ? "حبوب مقرومة بطريقة تقليدية"
                    : "Grains roasted using traditional methods"
                },
              ].map((product, i) => (
                <div
                  key={i}
                  className="group rounded-lg border border-[#C9A66B]/40 bg-[#171a1d]/60 p-5 backdrop-blur-sm hover:border-[#C9A66B]/70 hover:bg-[#171a1d] transition-all duration-300 hover:shadow-lg hover:shadow-[#C9A66B]/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm sm:text-base font-bold text-[#F2ECE2] flex-1 group-hover:text-[#C9A66B] transition-colors">
                      {product.name}
                    </h4>
                    <span className="text-[#C9A66B] text-lg ml-2">✓</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {product.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/shop"
                className="gold-button inline-block px-7 py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-transform hover:scale-105"
              >
                {t.common.shopNow}
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* Contact CTA */}
        <AnimatedSection animationType="scale" delay={200}>
          <div
            className="rounded-xl border border-white/10 bg-[#171a1d] p-6 sm:p-12 text-center"
          >
            
            <p className="text-[13px] sm:text-base text-white/80 mb-6">
              {t.about.contactDesc}
            </p>
            <Link
              href="/contact"
              className="gold-button inline-block px-7 py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-transform hover:scale-105"
            >
              {t.about.contactButton}
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
