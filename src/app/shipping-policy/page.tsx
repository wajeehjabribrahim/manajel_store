"use client";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

export default function ShippingPolicy() {
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl gold-texture font-bold leading-tight">{t.policies.shippingPolicy}</h1>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8 rounded-xl border border-white/10 bg-[#171a1d] p-5 sm:p-6 md:p-8 text-sm sm:text-base">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#C9A66B]">
              {t.policies.shippingInfo}
            </h2>
            <p className="text-white/80 text-sm sm:text-base mb-4">
              {t.policies.shippingDesc}
            </p>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.deliveryAreas}
            </h3>
            <ul className="list-disc list-inside text-white/80 text-sm sm:text-base space-y-2">
              <li>{t.policies.area1}</li>
              <li>{t.policies.area2}</li>
              <li>{t.policies.area3}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.shippingCosts}
            </h3>
            <ul className="text-white/80 text-sm sm:text-base space-y-2">
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

          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.deliveryTime}
            </h3>
            <p className="text-white/80 text-sm sm:text-base">{t.policies.deliveryTimeDesc}</p>
          </div>

          <div
            className="rounded-lg border border-[#C9A66B]/35 bg-[#121416] p-6"
          >
            <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#C9A66B]">
              {t.policies.specialHandling}
            </h3>
            <p className="text-white/80 text-sm sm:text-base">
              {t.policies.specialHandlingDesc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
