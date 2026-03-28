"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Product } from "@/constants/products";
import { CURRENCY_SYMBOL } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { DEFAULT_SIZE_KEY, SizeKey } from "@/lib/productSizes";

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
  const [isMounted, setIsMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizeKey>(DEFAULT_SIZE_KEY);
  const [quantity, setQuantity] = useState(1);
  const [quickAddMessage, setQuickAddMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
  const fallbackSize = availableSizes[0] || DEFAULT_SIZE_KEY;
  const activeQuickSize = product.sizes?.[selectedSize]?.price ? selectedSize : fallbackSize;
  const activeQuickData = product.sizes?.[activeQuickSize];
  const activeQuickBasePrice = activeQuickData?.price ?? product.price;
  const activeQuickSalePrice = activeQuickData?.salePrice;
  const activeQuickFinalPrice =
    typeof activeQuickSalePrice === "number" &&
    activeQuickSalePrice > 0 &&
    activeQuickSalePrice < activeQuickBasePrice
      ? activeQuickSalePrice
      : activeQuickBasePrice;
  const quickAddTotal = activeQuickFinalPrice * quantity;
  const formatAmount = (amount: number) =>
    Number.isInteger(amount) ? String(amount) : amount.toFixed(2);

  useEffect(() => {
    if (!showQuickAdd) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showQuickAdd]);

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
    setTimeout(() => {
      setShowQuickAdd(false);
      setQuantity(1);
      setQuickAddMessage(null);
    }, 900);
  };

  return (
    <div
      ref={elementRef}
      className={`scroll-animate h-full ${isVisible ? "visible" : ""}`}
    >
      <Link href={`/products/${product.id}`} className="block h-full">
        <div
          className="product-card group relative flex h-full cursor-pointer flex-col overflow-hidden border border-transparent bg-[#121416] shadow-md transition-all duration-150 hover:duration-300 hover:border-[#C9A66B]/70 hover:shadow-xl"
          style={{ borderRadius: 0 }}
        >
        {/* Image Container */}
        <div
          className="w-full aspect-[8/10] bg-gradient-to-br relative overflow-hidden"
          style={{ backgroundColor: "#242a2f", borderRadius: 0 }}
        >
          {!product.inStock && (
            <span className="absolute top-2 left-2 z-10 rounded border border-red-400/45 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md select-none" style={{background:'#ef4444'}}>
              {t("product.outOfStock")}
            </span>
          )}
          {product.inStock && (
            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShowQuickAdd((prev) => !prev);
              }}
              type="button"
              className="absolute bottom-2 left-2 z-10 h-7 w-7 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border border-[#C9A66B]/80 bg-[#C9A66B] text-white transition-all duration-200 active:scale-95 hover:scale-105 hover:bg-[#b17a23] shadow-md"
              title={language === "ar" ? "إضافة سريعة" : "Quick add"}
              aria-label={language === "ar" ? "إضافة سريعة" : "Quick add"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0h2m-2 0H9m4 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>
          )}
          {product.image ? (
            <Image
              src={product.image}
              alt={name}
              fill
              className="object-cover product-image"
              style={{ borderRadius: 0 }}
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
        <div className="p-2.5 sm:p-4 flex flex-col flex-1">
          <h3 className="gold-texture-static mb-1 line-clamp-1 text-xs sm:text-base font-semibold text-[#C9A66B]">
            {name}
          </h3>
          <p className="mb-0.5 sm:mb-1 line-clamp-2 text-[9px] sm:text-xs leading-4 sm:leading-5 text-white/72 tajawal-regular">
            {description.split(".")[0]}
          </p>

          {/* Price */}
          <div className="flex justify-between items-center abo">
            <div>
              <div className="flex items-center gap-3">
                {hasSale ? (
                  <p
                      className="text-xs sm:text-sm font-semibold line-through decoration-2"
                    style={{ color: "#ef4444", WebkitTextFillColor: "#ef4444" }}
                  >
                    {CURRENCY_SYMBOL}{basePrice}
                  </p>
                ) : null}
                <p className="text-sm sm:text-lg font-bold text-[#C9A66B]">
                  {CURRENCY_SYMBOL}{displayPrice}
                </p>
              </div>
            </div>
            {/* Cart icon moved to image overlay */}
          </div>
        </div>

        {product.inStock && showQuickAdd && isMounted
          ? createPortal(
              <div
                className="fixed inset-0 z-[121] bg-[#0f1215]/96 backdrop-blur-sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowQuickAdd(false);
                }}
              >
                <div className="h-full w-full overflow-y-auto p-4 sm:p-6">
                  <div
                    className="mx-auto flex min-h-full w-full max-w-2xl items-center justify-center"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <div className="w-full rounded-2xl border border-[#C9A66B]/45 bg-[#121416]/95 p-4 sm:p-6 shadow-2xl">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-base font-bold text-[#C9A66B]">
                          {language === "ar" ? "إضافة سريعة" : "Quick Add"}
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setShowQuickAdd(false);
                          }}
                          className="h-8 w-8 rounded-full border border-white/20 text-sm text-white/75 hover:bg-white/10"
                          aria-label={language === "ar" ? "إغلاق" : "Close"}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                        <select
                          value={selectedSize}
                          onChange={(event) => setSelectedSize(event.target.value as SizeKey)}
                          className="w-full rounded-md border border-white/20 bg-[#121416] px-3 py-2 text-sm text-white"
                        >
                          {(availableSizes.length ? availableSizes : [DEFAULT_SIZE_KEY]).map((size) => (
                            <option key={size} value={size}>
                              {product.sizes?.[size]?.weight || (language === "ar" ? "وزن غير محدد" : "Weight not set")}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-[#121416] px-3 py-2">
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setQuantity((prev) => Math.max(1, prev - 1));
                            }}
                            className="h-10 w-10 sm:h-12 sm:w-12 text-lg sm:text-xl text-white/85 flex items-center justify-center rounded border border-white/20 bg-[#1b2024] hover:bg-white/6 active:scale-95"
                            type="button"
                            aria-label="decrease quantity"
                          >
                            -
                          </button>
                          <span className="min-w-[40px] text-center text-lg sm:text-xl text-white">{quantity}</span>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setQuantity((prev) => Math.min(99, prev + 1));
                            }}
                            className="h-10 w-10 sm:h-12 sm:w-12 text-lg sm:text-xl text-white/85 flex items-center justify-center rounded border border-white/20 bg-[#1b2024] hover:bg-white/6 active:scale-95"
                            type="button"
                            aria-label="increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="mb-4 rounded-lg border border-[#C9A66B]/35 bg-[#1a1f23] px-4 py-3 text-sm text-white/85">
                        <div className="flex items-center justify-between">
                          <span>{language === "ar" ? "سعر الوحدة" : "Unit price"}</span>
                          <span className="font-semibold text-[#C9A66B]">{CURRENCY_SYMBOL}{formatAmount(activeQuickFinalPrice)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span>{language === "ar" ? "المجموع" : "Total"}</span>
                          <span className="text-lg font-extrabold text-[#C9A66B]">{CURRENCY_SYMBOL}{formatAmount(quickAddTotal)}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-white/60">
                          {CURRENCY_SYMBOL}{formatAmount(activeQuickFinalPrice)} × {quantity}
                        </p>
                      </div>

                      <button
                        onClick={handleQuickAddToCart}
                        className="gold-button w-full rounded-md py-2.5 text-sm font-bold"
                        type="button"
                      >
                        {language === "ar"
                          ? `إضافة للسلة • ${CURRENCY_SYMBOL}${formatAmount(quickAddTotal)}`
                          : `Add to cart • ${CURRENCY_SYMBOL}${formatAmount(quickAddTotal)}`}
                      </button>

                      {quickAddMessage ? (
                        <p className="mt-2 text-center text-xs text-[#C9A66B]">{quickAddMessage}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
    </Link>
    </div>
  );
}
