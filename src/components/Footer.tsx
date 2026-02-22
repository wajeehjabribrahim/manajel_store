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
            <h3 className="text-lg font-bold mb-4">{(t as any).footer.brandName}</h3>
            <p className="mb-4 text-xs opacity-80">
              {(t as any).footer.tagline}
            </p>
            <p className="text-xs opacity-80">{(t as any).footer.location}</p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">{(t as any).footer.shopTitle}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="opacity-100">
                  {(t as any).footer.allProducts}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=olive-oil" className="opacity-100">
                  {(t as any).footer.oliveOil}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=zatar" className="opacity-100">
                  {(t as any).footer.zatar}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=freekeh" className="opacity-100">
                  {(t as any).footer.freekeh}
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-semibold mb-4">{(t as any).footer.infoTitle}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="opacity-100">
                  {(t as any).footer.aboutUs}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="opacity-100">
                  {(t as any).footer.contact}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="opacity-100">
                  {(t as any).footer.faq}
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold mb-4">{(t as any).footer.policiesTitle}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping-policy" className="opacity-100">
                  {(t as any).footer.shippingPolicy}
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="opacity-100">
                  {(t as any).footer.returnPolicy}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="opacity-100">
                  {(t as any).footer.privacyPolicy}
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
          <div className="flex flex-col md:flex-row justify-between items-center text-xs opacity-70 gap-4">
            <div className="flex items-center gap-3">
              <span className="opacity-100 font-semibold">{t("footer.followUs")}</span>
              <a href="https://www.facebook.com/share/1HQyJVC8Bz/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="opacity-100 hover:opacity-80">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/mnajel/" target="_blank" rel="noopener noreferrer" className="opacity-100 hover:opacity-80">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                </svg>
              </a>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
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
      </div>
    </footer>
  );
}
