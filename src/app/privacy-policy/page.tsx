"use client";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

export default function PrivacyPolicy() {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    <div>
      <section
        style={{ backgroundColor: COLORS.primary }}
        className="text-white py-12 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold">{t.policies.privacyPolicy}</h1>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div>
            <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold mb-4">
              {t.policies.privacyMatters}
            </h2>
            <p className="text-gray-700 mb-4">
              {t.policies.privacyDesc}
            </p>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.dataCollection}
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <strong>{t.policies.contactInfo}</strong> {t.policies.contactInfoDesc}
              </li>
              <li>
                <strong>{t.policies.shippingInfo2}</strong> {t.policies.shippingInfoDesc}
              </li>
              <li>
                <strong>{t.policies.paymentInfo}</strong> {t.policies.paymentInfoDesc}
              </li>
              <li>
                <strong>{t.policies.browsingData}</strong> {t.policies.browsingDataDesc}
              </li>
              <li>
                <strong>{t.policies.communication}</strong> {t.policies.communicationDesc}
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.dataUsage}
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>{t.policies.usage1}</li>
              <li>{t.policies.usage2}</li>
              <li>{t.policies.usage3}</li>
              <li>{t.policies.usage4}</li>
              <li>{t.policies.usage5}</li>
              <li>{t.policies.usage6}</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.dataProtection}
            </h3>
            <p className="text-gray-700 mb-3">
              {t.policies.protectionDesc}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>{t.policies.protection1}</li>
              <li>{t.policies.protection2}</li>
              <li>{t.policies.protection3}</li>
              <li>{t.policies.protection4}</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.userRights}
            </h3>
            <p className="text-gray-700 mb-3">{t.policies.rightsDesc}</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>{t.policies.right1}</li>
              <li>{t.policies.right2}</li>
              <li>{t.policies.right3}</li>
              <li>{t.policies.right4}</li>
              <li>{t.policies.right5}</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.thirdParty}
            </h3>
            <p className="text-gray-700">
              {t.policies.thirdPartyDesc}
            </p>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.cookies}
            </h3>
            <p className="text-gray-700">
              {t.policies.cookiesDesc}
            </p>
          </div>

          <div
            style={{ backgroundColor: COLORS.accent }}
            className="rounded-lg p-6"
          >
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.contactPrivacy}
            </h3>
            <p className="text-gray-700">
              {t.policies.contactPrivacyDesc}
            </p>
          </div>

          <p className="text-gray-500 text-sm">
            {t.policies.lastUpdated}
          </p>
        </div>
      </section>
    </div>
  );
}
