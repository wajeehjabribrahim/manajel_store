"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Product } from "@/constants/products";
import { CURRENCY_SYMBOL } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { DEFAULT_SIZE_KEY, getProductSizeLabel, SizeKey } from "@/lib/productSizes";

interface ProductCardProps {
  product: Product;
  animationDelay?: number;
  isFirstProduct?: boolean;
}

export default function ProductCard({ product, animationDelay = 0, isFirstProduct = false }: ProductCardProps) {
  const { t, language } = useLanguage();
  // Add extra delay for first product to ensure image loads
  const totalDelay = isFirstProduct ? animationDelay + 500 : animationDelay;
  const { elementRef, isVisible } = useScrollAnimation({ delay: totalDelay });
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizeKey>(DEFAULT_SIZE_KEY);
  const [quantity, setQuantity] = useState(1);
  const [quickAddMessage, setQuickAddMessage] = useState<string | null>(null);

  const availableSizes = (Object.keys(product.sizes || {}) as SizeKey[]).filter(
    (size) => typeof product.sizes?.[size]?.price === "number" && (product.sizes?.[size]?.price ?? 0) > 0
  );

  useEffect(() => {
    const fallbackSize = availableSizes[0] || DEFAULT_SIZE_KEY;
    if (!availableSizes.includes(selectedSize)) {
      setSelectedSize(fallbackSize);
    }
  }, [availableSizes, selectedSize]);

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

  const handleQuickAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const fallbackSize = availableSizes[0] || DEFAULT_SIZE_KEY;
    const activeSize = product.sizes?.[selectedSize]?.price ? selectedSize : fallbackSize;
    const chosenSize = product.sizes?.[activeSize];
    const chosenBasePrice = chosenSize?.price ?? product.price;
    const chosenSalePrice = chosenSize?.salePrice;
    const finalPrice =
      typeof chosenSalePrice === "number" && chosenSalePrice > 0 && chosenSalePrice < chosenBasePrice
        ? chosenSalePrice
        : chosenBasePrice;

    const rawImage = typeof product.image === "string" ? product.image : "";
    const safeImage = rawImage && !rawImage.startsWith("data:") && rawImage.length < 2000 ? rawImage : "";

    const cartItem = {
      id: product.id,
      name: product.name,
      image: safeImage,
      size: activeSize,
      quantity,
      price: finalPrice,
    };

    const existingCart = localStorage.getItem("manajel-cart");
    const cart = existingCart ? JSON.parse(existingCart) : [];

    const existingItemIndex = cart.findIndex(
      (item: { id?: string; size?: string }) => item.id === product.id && item.size === activeSize
    );

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push(cartItem);
    }

    try {
      localStorage.setItem("manajel-cart", JSON.stringify(cart));
    } catch (error) {
      const isQuotaError = error instanceof DOMException && error.name === "QuotaExceededError";
      if (isQuotaError) {
        const trimmedCart = cart.map((item: { id: string; name: string; size: string; quantity: number; price: number }) => ({
          ...item,
          image: "",
        }));
        localStorage.setItem("manajel-cart", JSON.stringify(trimmedCart));
      }
    }

    window.dispatchEvent(new Event("manajel-cart-updated"));
    setQuickAddMessage(language === "ar" ? "تمت الإضافة للسلة" : "Added to cart");
    setTimeout(() => setQuickAddMessage(null), 1500);
  };

  return (
    <div
      ref={elementRef}
      className={`scroll-animate h-full ${isVisible ? "visible" : ""}`}
    >
      <Link href={`/products/${product.id}`} className="block h-full">
        <div
          className="product-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg sm:rounded-xl border border-transparent bg-[#121416] shadow-md transition-all duration-300 hover:border-[#C9A66B]/70 hover:shadow-xl"
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

          {/* Price */}
          <div className="flex justify-between items-center mt-auto">
            <div>
              {hasSale ? (
                <p
                    className="inline-block -translate-y-1 text-sm font-semibold line-through decoration-2"
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

        {product.inStock ? (
          <>
            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShowQuickAdd((prev) => !prev);
              }}
              className="hidden md:flex absolute top-2 left-2 z-20 h-9 w-9 items-center justify-center rounded-full border border-[#C9A66B]/60 bg-[#121416]/90 text-[#C9A66B] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:scale-105"
              title={language === "ar" ? "إضافة سريعة" : "Quick add"}
              aria-label={language === "ar" ? "إضافة سريعة" : "Quick add"}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 10-8 0v4M5 11h14l-1 9H6l-1-9z"
                />
              </svg>
            </button>

            {showQuickAdd ? (
              <div
                className="hidden md:block absolute inset-x-2 bottom-2 z-20 rounded-xl border border-[#C9A66B]/45 bg-[#121416]/95 p-2 backdrop-blur"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <div className="mb-2 flex gap-2">
                  <select
                    value={selectedSize}
                    onChange={(event) => setSelectedSize(event.target.value as SizeKey)}
                    className="flex-1 rounded-md border border-white/20 bg-[#121416] px-2 py-1 text-xs text-white"
                  >
                    {(availableSizes.length ? availableSizes : [DEFAULT_SIZE_KEY]).map((size) => (
                      <option key={size} value={size}>
                        {getProductSizeLabel(size, product.sizes as any, t, language)}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 rounded-md border border-white/20 bg-[#121416] px-1">
                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setQuantity((prev) => Math.max(1, prev - 1));
                      }}
                      className="h-6 w-6 text-sm text-white/85"
                      type="button"
                    >
                      -
                    </button>
                    <span className="min-w-[20px] text-center text-xs text-white">{quantity}</span>
                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setQuantity((prev) => Math.min(99, prev + 1));
                      }}
                      className="h-6 w-6 text-sm text-white/85"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleQuickAddToCart}
                  className="w-full rounded-md bg-[#C9A66B] py-1.5 text-xs font-bold text-[#121416]"
                  type="button"
                >
                  {language === "ar" ? "إضافة للسلة" : "Add to cart"}
                </button>
                {quickAddMessage ? (
                  <p className="mt-1 text-center text-[10px] text-[#C9A66B]">{quickAddMessage}</p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Link>
    </div>
  );
}
