"use client";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

export default function ReturnPolicy() {
  const { language } = useLanguage();
  const t = translations[language];
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
          <p className="mb-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#C9A66B]">Policies</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{t.policies.returnPolicy}</h1>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8 rounded-xl border border-white/10 bg-[#171a1d] p-5 sm:p-6 md:p-8 text-sm sm:text-base">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#C9A66B]">
              {t.policies.ourReturnPolicy}
            </h2>
            <p className="text-white/80 text-sm sm:text-base mb-4">
              {t.policies.returnDesc}
            </p>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.defectiveProducts}
            </h3>
            <p className="text-white/80 text-sm sm:text-base mb-3">
              {t.policies.defectiveDesc}
            </p>
            <ul className="list-disc list-inside text-white/80 text-sm sm:text-base space-y-2">
              <li>{t.policies.defective1}</li>
              <li>{t.policies.defective2}</li>
              <li>{t.policies.defective3}</li>
              <li>{t.policies.defective4}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.returnProcess}
            </h3>
            <ol className="list-decimal list-inside text-white/80 text-sm sm:text-base space-y-2">
              <li>{t.policies.returnStep1}</li>
              <li>{t.policies.returnStep2}</li>
              <li>{t.policies.returnStep3}</li>
              <li>{t.policies.returnStep4}</li>
              <li>{t.policies.returnStep5}</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.nonReturnable}
            </h3>
            <p className="text-white/80 text-sm sm:text-base">
              {t.policies.nonReturnableDesc}
            </p>
          </div>

          <div
            className="rounded-lg border border-[#C9A66B]/35 bg-[#121416] p-6"
          >
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.satisfactionGuaranteed}
            </h3>
            <p className="text-white/80 text-sm sm:text-base">
              {t.policies.satisfactionDesc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
