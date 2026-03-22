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
    <div className="bg-[#121416] text-[#F2ECE2]">
      <section
        style={{
          background: "linear-gradient(180deg, #14171a 0%, #101214 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="text-white py-12 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[#C9A66B]">FAQ</p>
          <h1 className="text-4xl font-bold mb-2">{t.faq.title}</h1>
          <p className="text-lg text-white/80">
            {t.faq.description}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="overflow-hidden rounded-lg border border-white/10 bg-[#171a1d]"
            >
              <summary
                className="cursor-pointer p-4 font-semibold text-[#C9A66B] bg-[#121416]"
              >
                {faq.question}
              </summary>
              <div className="p-4">
                <p className="text-white/80">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Additional Help */}
        <div
          className="mt-12 rounded-xl border border-white/10 bg-[#171a1d] p-8 text-center"
        >
          <h2 className="mb-4 text-2xl font-bold text-[#C9A66B]">
            {t.faq.contactSection}
          </h2>
          <p className="mb-6 text-white/80">
            {t.faq.contactDesc}
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 rounded-lg font-semibold"
            style={{ backgroundColor: "#C9A66B", color: "#14171a", border: "1px solid rgba(201,166,107,0.75)" }}
          >
            {t.faq.contactCTA}
          </a>
        </div>
      </section>
    </div>
  );
}
