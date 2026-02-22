"use client";
import { COLORS, STORE_DESCRIPTION, CONTACT_INFO } from "@/constants/store";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";
import AnimatedSection from "@/components/AnimatedSection";

export default function About() {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          backgroundColor: COLORS.primary,
        }}
        className="text-white py-20 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">{t.about.title}</h1>
          <p className="text-xl opacity-90">
            {t.about.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <AnimatedSection animationType="fade-left">
            <h2
              style={{ color: COLORS.primary }}
              className="text-3xl font-bold mb-6"
            >
              {t.about.ourStory}
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              وُلدت فكرة مناجل من الأرض… من بين أشجار الزيتون التي رافقتنا لسنوات وكانت جزءًا من يومنا وتاريخ عائلتنا. لم يكن الزيت بالنسبة لنا مجرد منتج، بل حكاية تعبٍ ومواسم، ورائحة معاصر، وذكريات قطاف اجتمع فيها الأهل والأصدقاء.
            </p>
            <p className="text-gray-700 mb-4 leading-relaxed">
              مع مرور الوقت، أدركنا أن ما نملكه ليس فقط زيت زيتون عالي الجودة، بل تجربة كاملة تستحق أن تصل إلى كل بيت. من هنا بدأت رحلة مناجل؛ رحلة هدفها نقل أصالة الأرض ونقاء المنتج إلى عملائنا بطريقة عصرية وسهلة.
            </p>
            <p className="text-gray-700 mb-4 leading-relaxed">
              نعتني بكل خطوة في رحلتنا — من العناية بالأشجار، إلى القطاف، إلى العصر والتعبئة — لنضمن أن يصل إليكم زيت زيتون طبيعي يحمل الطعم الحقيقي الذي نؤمن به ونفخر بتقديمه.
            </p>
            <p className="text-gray-700 leading-relaxed">
              مناجل ليست معصرة فقط، بل امتداد لأرض وهوية ورسالة: أن يبقى الخير الذي تمنحه الطبيعة حاضرًا على موائدكم كما نعيشه نحن كل موسم.
            </p>
          </AnimatedSection>
          <AnimatedSection animationType="fade-right" delay={100}>
            <div
              style={{ backgroundColor: COLORS.accent }}
              className="rounded-lg p-8 flex flex-col justify-center"
            >
              <h3
                style={{ color: COLORS.primary }}
                className="text-2xl font-bold mb-4"
              >
                بعض قيمنا
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
                    <span
                      style={{ color: COLORS.primary }}
                      className="font-bold mr-3"
                    >
                      ✓
                    </span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>

        {/* Products Section */}
        <AnimatedSection animationType="fade-up">
          <div className="mb-16">
            <h2
              style={{ color: COLORS.primary }}
              className="text-3xl font-bold mb-8 text-center"
            >
              بعض منتجاتنا
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
                  style={{ borderLeft: `4px solid ${COLORS.primary}` }}
                  className="pl-4"
                >
                  <h4
                    style={{ color: COLORS.primary }}
                    className="font-bold mb-2"
                  >
                    {product}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Contact CTA */}
        <AnimatedSection animationType="scale" delay={200}>
          <div
            style={{ backgroundColor: COLORS.accent }}
            className="rounded-lg p-12 text-center"
          >
            <h3
              style={{ color: COLORS.primary }}
              className="text-2xl font-bold mb-4"
            >
              {t.about.contactCTA}
            </h3>
            <p className="text-gray-900 mb-6">
              {t.about.contactDesc}
            </p>
            <Link
              href="/contact"
              className="inline-block px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
              style={{ backgroundColor: COLORS.primary, color: "white" }}
            >
              {t.about.contactButton}
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
