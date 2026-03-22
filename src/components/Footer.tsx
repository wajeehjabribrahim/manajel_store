"use client";

import Link from "next/link";
import { COLORS, CONTACT_INFO } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/[\s_]+/g, "-");

const hasAnyMatch = (category: Category, candidates: string[]) => {
  const values = [category.id, category.name, category.nameAr || ""]
    .filter(Boolean)
    .map((v) => normalize(v));
  return candidates.some((candidate) => values.includes(normalize(candidate)));
};

export default function Footer() {
  const { t } = useLanguage();
  const [categoryParams, setCategoryParams] = useState({
    oliveOil: "olive-oil",
    zatar: "zatar",
    freekeh: "freekeh",
  });
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubscribeMessage("");

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setSubscribeMessage((t as any).footer.subscribeError);
        return;
      }

      setSubscribeMessage((t as any).footer.subscribeSuccess);
      setEmail("");
    } catch {
      setSubscribeMessage((t as any).footer.subscribeError);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as Category[];
        if (!Array.isArray(data) || data.length === 0) {
          return;
        }

        const oliveOilCategory = data.find((cat) =>
          hasAnyMatch(cat, ["olive-oil", "olive oil", "زيت الزيتون"]) 
        );
        const baladiCategory = data.find((cat) =>
          hasAnyMatch(cat, [
            "منتجات بلدية",
            "منتجات-بلدية",
            "baladi",
            "balady",
            "traditional products",
          ])
        );
        const zatarCategory = data.find((cat) =>
          hasAnyMatch(cat, ["zatar", "zaatar", "زعتر", "زعتر بلدي"]) 
        );
        const freekehCategory = data.find((cat) =>
          hasAnyMatch(cat, ["freekeh", "فريكة", "الفريكة"]) 
        );

        setCategoryParams((prev) => ({
          oliveOil: oliveOilCategory?.id || prev.oliveOil,
          zatar: baladiCategory?.id || zatarCategory?.id || prev.zatar,
          freekeh: baladiCategory?.id || prev.freekeh,
        }));
      } catch {
        // keep fallback links
      }
    };

    loadCategories();
  }, []);

  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #131619 0%, #101214 100%)",
        color: "#F2ECE2",
        borderTop: "1px solid rgba(201,166,107,0.28)",
      }}
      className="text-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-black mb-4 tracking-wide">{(t as any).footer.brandName}</h3>
            <p className="mb-4 text-xs text-white/70 leading-6">
              {(t as any).footer.tagline}
            </p>
            <p className="text-xs text-white/70">{(t as any).footer.location}</p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4 text-[#C9A66B]">{(t as any).footer.shopTitle}</h4>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  {(t as any).footer.allProducts}
                </Link>
              </li>
              <li>
                <Link href={`/shop?category=${encodeURIComponent(categoryParams.oliveOil)}`} className="hover:text-white transition-colors">
                  {(t as any).footer.oliveOil}
                </Link>
              </li>
              <li>
                <Link href={`/shop?category=${encodeURIComponent(categoryParams.zatar)}`} className="hover:text-white transition-colors">
                  {(t as any).footer.zatar}
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-semibold mb-4 text-[#C9A66B]">{(t as any).footer.infoTitle}</h4>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {(t as any).footer.aboutUs}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  {(t as any).footer.contact}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  {(t as any).footer.faq}
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold mb-4 text-[#C9A66B]">{(t as any).footer.policiesTitle}</h4>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors">
                  {(t as any).footer.shippingPolicy}
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-white transition-colors">
                  {(t as any).footer.returnPolicy}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  {(t as any).footer.privacyPolicy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
          <p className="mb-3 text-sm text-white/80">{(t as any).footer.subscribeText}</p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={(t as any).footer.subscribePlaceholder}
              className="h-11 w-full rounded-xl border border-white/20 bg-[#0f1214] px-4 text-sm text-[#F2ECE2] placeholder:text-white/45 focus:border-[#C9A66B]/70 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-[#C9A66B]/60 px-6 text-sm font-semibold text-[#F2ECE2] transition-colors hover:bg-[#C9A66B]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "..." : (t as any).footer.subscribeButton}
            </button>
          </form>
          {subscribeMessage ? (
            <p className="mt-3 text-xs text-[#C9A66B]">{subscribeMessage}</p>
          ) : null}
        </div>

        {/* Divider */}
        <div
          style={{ borderTopColor: "rgba(201,166,107,0.28)" }}
          className="border-t pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-white/70 gap-4">
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
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="opacity-100 hover:opacity-80" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.95 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z"/>
                </svg>
              </a>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <p>
                {t("footer.copyright")}
              </p>
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
