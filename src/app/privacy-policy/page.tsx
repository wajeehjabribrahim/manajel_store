"use client";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

export default function PrivacyPolicy() {
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
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[#C9A66B]">Policies</p>
          <h1 className="text-4xl font-bold">{t.policies.privacyPolicy}</h1>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8 rounded-xl border border-white/10 bg-[#171a1d] p-6 md:p-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-[#C9A66B]">
              {t.policies.privacyMatters}
            </h2>
            <p className="text-white/80 mb-4">
              {t.policies.privacyDesc}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.dataCollection}
            </h3>
            <ul className="list-disc list-inside text-white/80 space-y-2">
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
            <h3 className="text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.dataUsage}
            </h3>
            <ul className="list-disc list-inside text-white/80 space-y-2">
              <li>{t.policies.usage1}</li>
              <li>{t.policies.usage2}</li>
              <li>{t.policies.usage3}</li>
              <li>{t.policies.usage4}</li>
              <li>{t.policies.usage6}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.dataProtection}
            </h3>
            <p className="text-white/80 mb-3">
              {t.policies.protectionDesc}
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2">
              <li>{t.policies.protection2}</li>
              <li>{t.policies.protection3}</li>
              <li>{t.policies.protection4}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.userRights}
            </h3>
            <p className="text-white/80 mb-3">{t.policies.rightsDesc}</p>
            <ul className="list-disc list-inside text-white/80 space-y-2">
              <li>{t.policies.right1}</li>
              <li>{t.policies.right2}</li>
              <li>{t.policies.right3}</li>
              <li>{t.policies.right4}</li>
              <li>{t.policies.right5}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.thirdParty}
            </h3>
            <p className="text-white/80">
              {t.policies.thirdPartyDesc}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.cookies}
            </h3>
            <p className="text-white/80">
              {t.policies.cookiesDesc}
            </p>
          </div>

          <div
            className="rounded-lg border border-[#C9A66B]/35 bg-[#121416] p-6"
          >
            <h3 className="text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.contactPrivacy}
            </h3>
            <p className="text-white/80">
              {t.policies.contactPrivacyDesc}
            </p>
          </div>

          <p className="text-white/55 text-sm">
            {t.policies.lastUpdated}
          </p>
        </div>
      </section>
    </div>
  );
}
