"use client";

import Link from "next/link";
import { COLORS, FOOTER_LINKS, CONTACT_INFO } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer
      style={{
        backgroundColor: COLORS.primary,
        color: COLORS.accent,
      }}
      className="text-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t("footer.brandName")}</h3>
            <p className="mb-4 text-xs opacity-80">
              {t("footer.tagline")}
            </p>
            <p className="text-xs opacity-80">{t("footer.location")}</p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.shopTitle")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="opacity-100">
                  {t("footer.allProducts")}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=olive-oil" className="opacity-100">
                  {t("footer.oliveOil")}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=zatar" className="opacity-100">
                  {t("footer.zatar")}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=freekeh" className="opacity-100">
                  {t("footer.freekeh")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.infoTitle")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="opacity-100">
                  {t("footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="opacity-100">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="opacity-100">
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.policiesTitle")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping-policy" className="opacity-100">
                  {t("footer.shippingPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="opacity-100">
                  {t("footer.returnPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="opacity-100">
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{ borderTopColor: COLORS.secondary }}
          className="border-t pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center text-xs opacity-70">
            <p>
              {t("footer.copyright")}
            </p>
            <p>
              {t("footer.contactLabel")}{" "}
              <a href={`mailto:${CONTACT_INFO.email}`} className="opacity-100">
                {CONTACT_INFO.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
