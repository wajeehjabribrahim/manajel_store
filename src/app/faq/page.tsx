"use client";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

export default function FAQ() {
  const { language } = useLanguage();
  const t = translations[language];

  const faqs = [
    { question: t.faq.q1, answer: t.faq.a1 },
    { question: t.faq.q2, answer: t.faq.a2 },
    { question: t.faq.q3, answer: t.faq.a3 },
    { question: t.faq.q4, answer: t.faq.a4 },
    { question: t.faq.q5, answer: t.faq.a5 },
    { question: t.faq.q6, answer: t.faq.a6 },
    { question: t.faq.q7, answer: t.faq.a7 },
    { question: t.faq.q8, answer: t.faq.a8 },
    { question: t.faq.q9, answer: t.faq.a9 },
    { question: t.faq.q10, answer: t.faq.a10 },
  ];

  return (
    <div>
      <section
        style={{ backgroundColor: COLORS.primary }}
        className="text-white py-12 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{t.faq.title}</h1>
          <p className="text-lg opacity-90">
            {t.faq.description}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: COLORS.border }}
            >
              <summary
                style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}
                className="cursor-pointer p-4 font-semibold"
              >
                {faq.question}
              </summary>
              <div className="p-4 bg-white">
                <p className="text-gray-900">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Additional Help */}
        <div
          style={{ backgroundColor: COLORS.accent }}
          className="rounded-lg p-8 mt-12 text-center"
        >
          <h2
            style={{ color: COLORS.primary }}
            className="text-2xl font-bold mb-4"
          >
            {t.faq.contactSection}
          </h2>
          <p className="text-gray-900 mb-6">
            {t.faq.contactDesc}
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 rounded-lg font-semibold"
            style={{ backgroundColor: COLORS.primary, color: "white" }}
          >
            {t.faq.contactCTA}
          </a>
        </div>
      </section>
    </div>
  );
}
