"use client";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

export default function ShippingPolicy() {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    <div>
      <section
        style={{ backgroundColor: COLORS.primary }}
        className="text-white py-12 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold">{t.policies.shippingPolicy}</h1>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div>
            <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold mb-4">
              {t.policies.shippingInfo}
            </h2>
            <p className="text-gray-900 mb-4">
              {t.policies.shippingDesc}
            </p>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.deliveryAreas}
            </h3>
            <ul className="list-disc list-inside text-gray-900 space-y-2">
              <li>{t.policies.area1}</li>
              <li>{t.policies.area2}</li>
              <li>{t.policies.area3}</li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.shippingCosts}
            </h3>
            <ul className="text-gray-900 space-y-2">
              <li>
                <strong>{t.policies.localOrders}</strong> {t.policies.localOrdersDesc}
              </li>
              <li>
                <strong>{t.policies.ordersUnder}</strong> {t.policies.ordersUnderDesc}
              </li>
              <li>
                <strong>{t.policies.international}</strong> {t.policies.internationalDesc}
              </li>
            </ul>
          </div>

          <div
            style={{ backgroundColor: COLORS.accent }}
            className="rounded-lg p-6"
          >
            <h3 style={{ color: COLORS.primary }} className="text-xl font-bold mb-3">
              {t.policies.specialHandling}
            </h3>
            <p className="text-gray-900">
              {t.policies.specialHandlingDesc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
