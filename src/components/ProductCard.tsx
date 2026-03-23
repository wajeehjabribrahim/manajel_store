"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/constants/products";
import { CURRENCY_SYMBOL } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ProductCardProps {
  product: Product;
  animationDelay?: number;
  isFirstProduct?: boolean;
}

export default function ProductCard({ product, animationDelay = 0, isFirstProduct = false }: ProductCardProps) {
  const { t } = useLanguage();
  // Add extra delay for first product to ensure image loads
  const totalDelay = isFirstProduct ? animationDelay + 500 : animationDelay;
  const { elementRef, isVisible } = useScrollAnimation({ delay: totalDelay });

  const nameKey = `products.${product.id}.name`;
  const descKey = `products.${product.id}.description`;

  const translatedName = t(nameKey);
  const translatedDesc = t(descKey);

  const name = translatedName === nameKey ? product.name : translatedName;

  // fallback: if t() returned the path (no translation), try direct lookup in translations
  let description = translatedDesc === descKey ? product.description : translatedDesc;
  if (description === product.description) {
    const lang = (translations as any)[(useLanguage() as any).language];
    try {
      const direct = (lang && lang.products && lang.products[product.id] && lang.products[product.id].description) || undefined;
      if (direct) description = direct;
    } catch (e) {
      // ignore
    }
  }

  const sizeValues = Object.values(product.sizes || {}).filter((s) => typeof s?.price === "number" && s.price > 0);
  const primarySize = sizeValues[0];
  const basePrice = primarySize?.price ?? product.price;
  const salePrice = primarySize?.salePrice;
  const hasSale = typeof salePrice === "number" && salePrice > 0 && salePrice < basePrice;
  const displayPrice = hasSale ? salePrice : basePrice;
  const ratingValue =
    typeof product.rating === "number" && Number.isFinite(product.rating) && product.rating > 0
      ? product.rating
      : 4.5;

  return (
    <div
      ref={elementRef}
      className={`scroll-animate h-full ${isVisible ? "visible" : ""}`}
    >
      <Link href={`/products/${product.id}`} className="block h-full">
        <div
          className="product-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg sm:rounded-xl border border-white/15 bg-[#171a1d] shadow-md transition-all duration-300 hover:border-[#C9A66B]/70 hover:shadow-xl"
        >
        {/* Image Container */}
        <div
          className="w-full h-36 sm:h-48 bg-gradient-to-br relative overflow-hidden"
          style={{ backgroundColor: "#242a2f" }}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={name}
              fill
              className="object-cover product-image"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={70}
              priority={isFirstProduct}
              loading={isFirstProduct ? "eager" : "lazy"}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div
                  className="text-3xl font-bold mb-2 text-[#C9A66B]"
                >
                  {name.split(" ")[0][0]}
                </div>
                <p className="text-xs font-semibold text-white/75">
                {name}
              </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <h3 className="gold-texture-static mb-1 line-clamp-1 text-sm sm:text-base font-semibold text-[#C9A66B]">
            {name}
          </h3>
          <p className="mb-3 line-clamp-3 sm:line-clamp-2 text-[10px] sm:text-xs leading-4 sm:leading-5 text-white/72">
            {description.split(".")[0]}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= Math.round(ratingValue) ? "text-yellow-400" : "text-white/30"}>
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center mt-auto">
            <div>
              {hasSale ? (
                <p
                  className="inline-block -translate-y-0.5 text-sm font-semibold line-through decoration-2"
                  style={{ color: "#ef4444", WebkitTextFillColor: "#ef4444" }}
                >
                  {CURRENCY_SYMBOL}{basePrice}
                </p>
              ) : null}
              <p className="text-base sm:text-lg font-bold text-[#C9A66B]">
                {CURRENCY_SYMBOL}{displayPrice}
              </p>
              <p className="text-xs text-white/55">{t("product.fromSmallestSize")}</p>
            </div>
            {product.inStock ? (
              <span className="rounded border border-[#C9A66B]/55 bg-[#C9A66B]/15 px-2 py-1 text-xs font-semibold text-[#F2ECE2]">
                {t("product.inStock")}
              </span>
            ) : (
              <span className="rounded border border-red-400/45 bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-200">
                {t("product.outOfStock")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
    </div>
  );
}
