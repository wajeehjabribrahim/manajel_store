"use client";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

export default function ReturnPolicy() {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    <div>
      <section
        style={{ backgroundColor: COLORS.primary }}
        className="text-white py-12 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold">{t.policies.returnPolicy}</h1>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div>
            <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold mb-4">
              {t.policies.ourReturnPolicy}
            </h2>
            <p className="text-gray-900 mb-4">
              {t.policies.returnDesc}
            </p>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.returnWindow}
            </h3>
            <ul className="text-gray-900 space-y-2">
              <li>
                <strong>{t.policies.returnPeriod}</strong> {t.policies.returnPeriodDesc}
              </li>
              <li>{t.policies.returnCondition1}</li>
              <li>{t.policies.returnCondition2}</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.defectiveProducts}
            </h3>
            <p className="text-gray-900 mb-3">
              {t.policies.defectiveDesc}
            </p>
            <ul className="list-disc list-inside text-gray-900 space-y-2">
              <li>{t.policies.defective1}</li>
              <li>{t.policies.defective2}</li>
              <li>{t.policies.defective3}</li>
              <li>{t.policies.defective4}</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.returnProcess}
            </h3>
            <ol className="list-decimal list-inside text-gray-900 space-y-2">
              <li>{t.policies.returnStep1}</li>
              <li>{t.policies.returnStep2}</li>
              <li>{t.policies.returnStep3}</li>
              <li>{t.policies.returnStep4}</li>
              <li>{t.policies.returnStep5}</li>
            </ol>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.nonReturnable}
            </h3>
            <p className="text-gray-900">
              {t.policies.nonReturnableDesc}
            </p>
          </div>

          <div
            style={{ backgroundColor: COLORS.accent }}
            className="rounded-lg p-6"
          >
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.satisfactionGuaranteed}
            </h3>
            <p className="text-gray-900">
              {t.policies.satisfactionDesc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
