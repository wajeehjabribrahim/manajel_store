"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/constants/products";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
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

  return (
    <div
      ref={elementRef}
      className={`scroll-animate h-full ${isVisible ? "visible" : ""}`}
    >
      <Link href={`/products/${product.id}`} className="block h-full">
        <div
          className="product-card h-full flex flex-col rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
          style={{ backgroundColor: COLORS.light }}
        >
        {/* Image Container */}
        <div
          className="w-full h-48 bg-gradient-to-br relative overflow-hidden"
          style={{
            backgroundColor: COLORS.accent,
          }}
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
                  style={{ color: COLORS.primary }}
                  className="text-3xl font-bold mb-2"
                >
                  {name.split(" ")[0][0]}
                </div>
                <p
                  style={{ color: COLORS.secondary }}
                  className="text-xs font-semibold"
                >
                {name}
              </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 style={{ color: COLORS.primary }} className="font-semibold mb-1 line-clamp-1">
            {name}
          </h3>
          <p className="text-xs text-gray-900 mb-3 line-clamp-2">
            {description.split(".")[0]}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i}>
                  {i < Math.floor(product.rating) ? "★" : "☆"}
                </span>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center mt-auto">
            <div>
              <p
                style={{ color: COLORS.primary }}
                className="font-bold text-lg"
              >
                {CURRENCY_SYMBOL}{product.price}
              </p>
              <p className="text-xs text-gray-500">{t("product.fromSmallestSize")}</p>
            </div>
            {product.inStock ? (
              <span
                style={{ color: COLORS.primary, backgroundColor: COLORS.accent }}
                className="px-2 py-1 rounded text-xs font-semibold"
              >
                {t("product.inStock")}
              </span>
            ) : (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
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
