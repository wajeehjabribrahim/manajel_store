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
        className="text-white py-20 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[#C9A66B]">Manajel</p>
          <h1 className="text-5xl font-bold mb-4">{t.about.title}</h1>
          <p className="text-xl text-white/80">
            {t.about.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <AnimatedSection animationType="fade-left">
            <h2 className="text-3xl font-bold mb-6 text-[#C9A66B]">
              {t.about.ourStory}
            </h2>
            <p className="text-white/80 mb-4 leading-relaxed">
              {t.about.storyPara1}
            </p>
            <p className="text-white/80 mb-4 leading-relaxed">
              {t.about.storyPara2}
            </p>
            <p className="text-white/80 mb-4 leading-relaxed">
              {t.about.storyPara3}
            </p>
            <p className="text-white/80 leading-relaxed">
              {t.about.storyPara4}
            </p>
          </AnimatedSection>
          <AnimatedSection animationType="fade-right" delay={100}>
            <div
              className="rounded-xl border border-white/10 bg-[#171a1d] p-8 flex flex-col justify-center"
            >
              <h3 className="text-2xl font-bold mb-4 text-[#C9A66B]">
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
                    <span className="text-white/80">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>

        {/* Products Section */}
        <AnimatedSection animationType="fade-up">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-[#C9A66B]">
              {t.about.products}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                t.about.product1,
                t.about.product2,
                t.about.product3,
                t.about.product4,
                t.about.product5,
                t.about.product6,
              ].map((product, i) => (
                <div
                  key={i}
                  style={{ borderLeft: "4px solid #C9A66B" }}
                  className="pl-4"
                >
                  <h4 className="font-bold mb-2 text-[#F2ECE2]">
                    {product}
                  </h4>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/shop"
                className="inline-block px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
                style={{ backgroundColor: "#C9A66B", color: "#14171a", border: "1px solid rgba(201,166,107,0.75)" }}
              >
                {t.common.shopNow}
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* Contact CTA */}
        <AnimatedSection animationType="scale" delay={200}>
          <div
            className="rounded-xl border border-white/10 bg-[#171a1d] p-12 text-center"
          >
            <h3 className="text-2xl font-bold mb-4 text-[#C9A66B]">
              {t.about.contactCTA}
            </h3>
            <p className="text-white/80 mb-6">
              {t.about.contactDesc}
            </p>
            <Link
              href="/contact"
              className="inline-block px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
              style={{ backgroundColor: "#C9A66B", color: "#14171a", border: "1px solid rgba(201,166,107,0.75)" }}
            >
              {t.about.contactButton}
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
