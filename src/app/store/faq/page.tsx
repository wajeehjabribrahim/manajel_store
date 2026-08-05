"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO } from "@/constants/store";
import { serializeJsonLd } from "@/lib/jsonLd";

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

export default function FAQ() {
  const { t, dir, language } = useLanguage();

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

  const whatsappHref = `https://wa.me/${normalizePhone(CONTACT_INFO.phone)}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="bg-[#FBF8F2] text-[#121416] tajawal-regular-all">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />

      <section
        style={{
          background: "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="py-12 px-4 text-[#121416]"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl gold-texture font-bold mb-2 leading-tight">{t.faq.title}</h1>
          <p className="text-sm sm:text-base md:text-lg text-black/80 leading-relaxed">
            {t.faq.description}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              open={i === 0}
              className="faq-item group rounded-xl border border-black/10 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-colors duration-200 open:border-[#C9A66B]/60"
            >
              <summary
                className={`relative cursor-pointer list-none py-4 px-4 sm:py-5 sm:px-6 text-base sm:text-[1.1rem] font-bold text-[#121416] flex items-center justify-between gap-3 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
              >
                <span className="block flex-1 transition-colors duration-200 group-open:text-[#8a5f16]">{faq.question}</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C9A66B]/50 text-[#96691A] text-sm transition-transform duration-300 group-open:rotate-180"
                >
                  ▼
                </span>
              </summary>
              <div className={`faq-answer pb-5 px-4 sm:px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <p className="border-t border-black/10 pt-4 text-sm sm:text-base text-black/75 leading-7">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Additional Help */}
        <div
          className="mt-12 rounded-xl border border-black/10 bg-[#FFFFFF] p-5 sm:p-8 text-center"
        >
          <h2 className="mb-4 text-xl sm:text-2xl font-bold text-[#C9A66B]">
            {t.faq.contactSection}
          </h2>
          <p className="mb-6 text-sm sm:text-base text-black/80">
            {t.faq.contactDesc}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/store/contact"
              className="gold-button inline-block px-7 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold"
            >
              {t.faq.contactCTA}
            </a>
            
          </div>
        </div>
      </section>
    </div>
  );
}
