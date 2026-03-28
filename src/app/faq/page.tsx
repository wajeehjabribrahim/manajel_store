"use client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FAQ() {
  const { t, dir } = useLanguage();

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
    <div className="bg-[#121416] text-[#F2ECE2] tajawal-regular-all">
      <section
        style={{
          background: "linear-gradient(180deg, #14171a 0%, #101214 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="py-12 px-4 text-white"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl gold-texture font-bold mb-2 leading-tight">{t.faq.title}</h1>
          <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
            {t.faq.description}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="border-t border-b border-white/15 bg-transparent">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group border-b border-white/10 last:border-b-0"
            >
              <summary
                className={`relative cursor-pointer list-none py-4 px-4 sm:py-5 sm:px-6 text-base sm:text-[1.15rem] font-bold text-[#C9A66B] flex items-center justify-between ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
              >
                <span className="block flex-1">{faq.question}</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none ml-3 mr-3 text-[#C9A66B] text-sm transition-transform duration-200 group-open:rotate-180 ${dir === 'rtl' ? 'order-first ml-0 mr-3' : ''}`}
                >
                  ▼
                </span>
              </summary>
              <div className={`pb-5 px-4 sm:px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <p className="text-sm sm:text-base text-white/80 leading-7">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Additional Help */}
        <div
          className="mt-12 rounded-xl border border-white/10 bg-[#171a1d] p-5 sm:p-8 text-center"
        >
          <h2 className="mb-4 text-xl sm:text-2xl font-bold text-[#C9A66B]">
            {t.faq.contactSection}
          </h2>
          <p className="mb-6 text-sm sm:text-base text-white/80">
            {t.faq.contactDesc}
          </p>
          <a
            href="/contact"
            className="gold-button inline-block px-7 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold"
          >
            {t.faq.contactCTA}
          </a>
        </div>
      </section>
    </div>
  );
}
