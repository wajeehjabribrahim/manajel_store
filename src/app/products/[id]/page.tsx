"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ImageGallery from "@/components/ImageGallery";
import { PRODUCTS, Product } from "@/constants/products";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

interface PageProps {
  params: {
    id: string;
  };
}

interface ProductManualFeedback {
  id: string;
  author: string;
  note: string;
  images: string[];
  createdAt: string;
}

export default function ProductPage({ params }: PageProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState("");
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null);
  const [manualFeedbacks, setManualFeedbacks] = useState<ProductManualFeedback[]>([]);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${params.id}?lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.product) {
            setProduct(data.product);
          } else {
            setProduct(null);
          }
        } else {
          const fallback = PRODUCTS.find((p) => p.id === params.id) || null;
          setProduct(fallback);
        }
      } catch {
        const fallback = PRODUCTS.find((p) => p.id === params.id) || null;
        setProduct(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [params.id, language]);

  useEffect(() => {
    if (!product) return;
    const availableSizes = (Object.keys(product.sizes || {}) as Array<"small" | "medium" | "large">)
      .filter((key) => product.sizes?.[key]?.price);
    if (availableSizes.length && !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [product, selectedSize]);

  useEffect(() => {
    const loadManualFeedbacks = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}/feedbacks`);
        if (!res.ok) {
          setManualFeedbacks([]);
          return;
        }

        const data = await res.json();
        setManualFeedbacks(Array.isArray(data?.feedbacks) ? data.feedbacks : []);
      } catch {
        setManualFeedbacks([]);
      }
    };

    loadManualFeedbacks();
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAdding(true);
    
    // Add item to cart
    const sizeEntries = (Object.entries(product.sizes || {}) as Array<[
      "small" | "medium" | "large",
      { weight: string; price: number }
    ]>).filter(([, value]) => value?.price);

    const fallbackSize = sizeEntries.length
      ? sizeEntries[0][0]
      : "medium";
    const activeSize = product.sizes?.[selectedSize] ? selectedSize : fallbackSize;
    const basePrice = product.sizes?.[activeSize]?.price ?? product.price;
    const salePrice = product.sizes?.[activeSize]?.salePrice;
    const price = typeof salePrice === "number" && salePrice > 0 && salePrice < basePrice
      ? salePrice
      : basePrice;

    const rawImage = typeof product.image === "string" ? product.image : "";
    const safeImage = rawImage && !rawImage.startsWith("data:") && rawImage.length < 2000
      ? rawImage
      : "";

    const cartItem = {
      id: product.id,
      name: product.name,
      image: safeImage,
      size: activeSize,
      quantity,
      price,
    };
    
    // Get existing cart
    const existingCart = localStorage.getItem("manajel-cart");
    const cart = existingCart ? JSON.parse(existingCart) : [];
    
    // Check if item already exists
    const existingItemIndex = cart.findIndex(
      (item: any) => item.id === product.id && item.size === selectedSize
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push(cartItem);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem("manajel-cart", JSON.stringify(cart));
    } catch (error) {
      const isQuotaError = error instanceof DOMException && error.name === "QuotaExceededError";
      if (isQuotaError) {
        const trimmedCart = cart.map((item: any) => ({
          ...item,
          image: "",
        }));
        try {
          localStorage.setItem("manajel-cart", JSON.stringify(trimmedCart));
        } catch {
          setIsAdding(false);
          alert(t("cart.orderFailed"));
          return;
        }
      } else {
        setIsAdding(false);
        alert(t("cart.orderFailed"));
        return;
      }
    }
    
    // Redirect to cart
    setTimeout(() => {
      router.push("/cart");
    }, 300);
  };

  const handleShareProduct = async () => {
    if (!product || typeof window === "undefined") return;

    const shareUrl = `${window.location.origin}/products/${product.id}`;
    const shareTitle = name;
    const shareText = description.length > 120
      ? `${description.slice(0, 120)}...`
      : description;

    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert(language === "ar" ? "تم نسخ رابط المنتج" : "Product link copied");
        return;
      }

      alert(shareUrl);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        alert(language === "ar" ? "تعذر مشاركة المنتج" : "Unable to share product");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleNotifyStock = async () => {
    if (!product || isNotifying) return;

    setIsNotifying(true);
    setNotifyMessage(null);
    try {
      const res = await fetch(`/api/products/${product.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: notifyWhatsapp }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setNotifyMessage(data?.error || (language === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again"));
        return;
      }

      setNotifyMessage(data?.message || (language === "ar" ? "تم تسجيل طلب التذكير الخاص بك" : "Reminder request saved"));
      setNotifyWhatsapp("");
    } catch {
      setNotifyMessage(language === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again");
    } finally {
      setIsNotifying(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#121416" }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-[#F2ECE2]">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#121416" }} className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-[#F2ECE2]">المنتج غير موجود</h1>
          <p className="mb-6 text-white/70">نعتصر، المنتج الذي تبحث عنه غير متوفر</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: "#1f5d4e", color: "#F2ECE2", border: "1px solid rgba(201,166,107,0.45)" }}
          >
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  const sizeEntries = (Object.entries(product.sizes || {}) as Array<[
    "small" | "medium" | "large",
    { weight: string; price: number }
  ]>).filter(([, value]) => value?.price);

  const fallbackSize = sizeEntries.length
    ? sizeEntries[0][0]
    : "medium";
  const activeSize = product.sizes?.[selectedSize] ? selectedSize : fallbackSize;
  const currentSize = product.sizes?.[activeSize] || { weight: "", price: product.price };

  const nameKey = `products.${product.id}.name`;
  const descKey = `products.${product.id}.description`;

  const translatedName = t(nameKey);
  const translatedDesc = t(descKey);

  const name = translatedName === nameKey ? product.name : translatedName;

  let description = translatedDesc === descKey ? product.description : translatedDesc;
  if (description === product.description) {
    // try direct lookup in translations object
    try {
      const lang = (translations as any)[language || (typeof window !== 'undefined' && localStorage.getItem('manajel-language')) || 'en'];
      const direct = lang && lang.products && lang.products[product.id] && lang.products[product.id].description;
      if (direct) description = direct;
    } catch (e) {
      // ignore
    }
  }

  const ingredients = typeof product.ingredients === "string" ? product.ingredients.trim() : "";

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(language === "ar" ? "ar-PS-u-nu-latn" : "en-US", {
      maximumFractionDigits: 2,
    }).format(value);

  const normalizeToLatinDigits = (value: string) =>
    value
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));

  const parseQuantityInput = (raw: string) => {
    const latin = normalizeToLatinDigits(raw).replace(/[^0-9]/g, "");
    const parsed = parseInt(latin, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#121416" }} className="text-[#F2ECE2]">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4 text-sm text-white/70">
        <Link href="/shop" className="text-[#C9A66B] hover:text-white transition-colors">
          {t("nav.shop")}
        </Link>
        {" > "}
        <span className="text-white/85">{name}</span>
      </div>

      {/* Product Detail */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image Gallery */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#171a1d]">
            {product.image || (product.images && product.images.length > 0) ? (
              <ImageGallery
                images={
                  product.image
                    ? [product.image, ...(product.images || [])]
                    : (product.images || [])
                }
                alt={name}
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="mb-4 text-8xl font-bold text-[#C9A66B]"
                  >
                    {name.split(" ")[0][0]}
                  </div>
                  <p className="text-lg font-semibold text-white/80">
                    {name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="mb-2 text-2xl md:text-3xl font-bold text-[#F2ECE2]">
              {name}
            </h1>

            {/* Rating */}
            <div className="mb-4 flex items-center gap-2">
              {product && (() => {
                let hash = 0;
                for (let i = 0; i < product.id.length; i++) hash = (hash * 31 + product.id.charCodeAt(i)) >>> 0;
                const rating = 4.5 + ((hash % 5) / 10);
                return (
                  <>
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map((star) => {
                        if (rating >= star) return <span key={star}>★</span>;
                        if (rating >= star - 0.5) return <span key={star} className="relative inline-block"><span className="absolute inset-0 overflow-hidden w-1/2">★</span>☆</span>;
                        return <span key={star} className="text-gray-300">★</span>;
                      })}
                    </div>
                    <span className="text-sm text-white/65">{rating.toFixed(1)}</span>
                  </>
                );
              })()}
            </div>

            {/* Stock Status */}
            <div className="mb-4">
              {product.inStock ? (
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: "#4ade80",
                    color: "white",
                  }}
                >
                  {t("product.inStock")}
                </span>
              ) : (
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: "#ef4444",
                    color: "white",
                  }}
                >
                  {t("product.outOfStock")}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mb-6 text-sm md:text-base text-white/80">{description}</p>

            {ingredients ? (
              <div className="mb-6 rounded-xl border border-white/10 bg-[#171a1d] p-4">
                <h3 className="mb-2 text-lg font-bold text-[#C9A66B]">
                  {language === "ar" ? "المكونات" : "Ingredients"}
                </h3>
                <p className="text-sm leading-7 text-white/85 whitespace-pre-wrap">{ingredients}</p>
              </div>
            ) : null}

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-bold text-[#C9A66B]">
                {t("product.selectSize")}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(sizeEntries.length ? sizeEntries.map(([size]) => size) : (["medium"] as const)).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      activeSize === size
                        ? "border-solid"
                        : "border-dashed"
                    }`}
                    style={{
                      borderColor: activeSize === size ? "#C9A66B" : "rgba(255,255,255,0.18)",
                      backgroundColor: activeSize === size ? "rgba(201,166,107,0.16)" : "#171a1d",
                    }}
                  >
                    <div className="font-bold capitalize text-[#F2ECE2]">
                      {t(`product.${size}`)}
                    </div>
                    <div className="text-xs text-white/65">
                      {product.sizes?.[size]?.weight || ""}
                    </div>
                    <div className="font-bold text-sm">
                      {product.sizes?.[size]?.salePrice ? (
                        <>
                          <div
                            className="text-xs line-through font-semibold"
                            style={{ color: "#ef4444", WebkitTextFillColor: "#ef4444" }}
                          >
                              {CURRENCY_SYMBOL}{formatNumber(product.sizes?.[size]?.price ?? product.price)}
                          </div>
                          <div style={{ color: COLORS.secondary }} className="font-bold text-sm text-[#C9A66B]">
                              {CURRENCY_SYMBOL}{formatNumber(product.sizes?.[size]?.salePrice ?? product.price)}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: COLORS.secondary }} className="font-bold text-sm text-[#C9A66B]">
                            {CURRENCY_SYMBOL}{formatNumber(product.sizes?.[size]?.price ?? product.price)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-bold text-[#C9A66B]">
                {t("product.quantity")}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 rounded-lg font-bold"
                  style={{
                    backgroundColor: "#1b2024",
                    color: "#F2ECE2",
                    border: "1px solid rgba(201,166,107,0.3)",
                  }}
                >
                  −
                </button>
                <input
                  type="text"
                  pattern="[0-9]*"
                  lang="en-US"
                  dir="ltr"
                  inputMode="numeric"
                  value={String(quantity)}
                  onChange={(e) =>
                    setQuantity(parseQuantityInput(e.target.value))
                  }
                  onBlur={(e) => setQuantity(parseQuantityInput(e.target.value))}
                  className="w-16 rounded-lg border px-3 py-2 text-center text-[#F2ECE2]"
                  style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#171a1d" }}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 rounded-lg font-bold"
                  style={{
                    backgroundColor: "#1b2024",
                    color: "#F2ECE2",
                    border: "1px solid rgba(201,166,107,0.3)",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div
              className="mb-6 rounded-xl border border-white/10 bg-[#171a1d] p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/75">{t("product.pricePerUnit")}</span>
                {currentSize.salePrice ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="line-through text-sm font-semibold"
                      style={{ color: "#ef4444", WebkitTextFillColor: "#ef4444" }}
                    >
                      {CURRENCY_SYMBOL}{formatNumber(currentSize.price)}
                    </span>
                    <span className="font-bold text-[#C9A66B]">{CURRENCY_SYMBOL}{formatNumber(currentSize.salePrice)}</span>
                  </span>
                ) : (
                  <span className="font-bold text-[#C9A66B]">
                    {CURRENCY_SYMBOL}{formatNumber(currentSize.price)}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
                <span className="text-lg font-bold text-[#F2ECE2]">
                  {t("product.total")}
                </span>
                <span className="text-2xl font-bold text-[#C9A66B]">
                  {CURRENCY_SYMBOL}{formatNumber((currentSize.salePrice ?? currentSize.price) * quantity)}
                </span>
              </div>
            </div>

            {/* Add to Cart / Notify */}
            {product.inStock ? (
              <button
                className="gold-button w-full py-3 rounded-lg font-bold text-lg transition-opacity hover:opacity-90 mb-4 disabled:opacity-50"
                onClick={handleAddToCart}
                disabled={isAdding}
              >
                {isAdding ? t("product.adding") : t("product.addToCart")}
              </button>
            ) : (
              <div className="mb-4 rounded-lg border p-4" style={{ borderColor: "rgba(201,166,107,0.35)", backgroundColor: "#171a1d" }}>
                <p className="mb-3 text-sm text-white/80">
                  {language === "ar" ? "أدخل رقم واتسابك وسنخبرك فور توفر المنتج" : "Enter your WhatsApp number and we will notify you once this product is back"}
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.value)}
                    placeholder={language === "ar" ? "مثال: +9725XXXXXXXX" : "Example: +9725XXXXXXXX"}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm text-[#F2ECE2]"
                    style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                  />
                  <button
                    type="button"
                    onClick={handleNotifyStock}
                    disabled={isNotifying}
                    className="gold-button rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    {isNotifying
                      ? language === "ar"
                        ? "جاري..."
                        : "Saving..."
                      : language === "ar"
                      ? "ذكرني عند التوفر"
                      : "Notify me"}
                  </button>
                </div>
                {notifyMessage ? (
                  <p className="mt-2 text-xs text-[#C9A66B]">{notifyMessage}</p>
                ) : null}
              </div>
            )}

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleShareProduct}
                disabled={isSharing}
                className="flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all border-2 disabled:opacity-50"
                style={{
                  color: "#F2ECE2",
                  borderColor: "rgba(201,166,107,0.55)",
                  backgroundColor: "#171a1d",
                }}
              >
                {isSharing
                  ? language === "ar"
                    ? "جاري..."
                    : "Sharing..."
                  : language === "ar"
                  ? "🔗 مشاركة"
                  : "🔗 Share"}
              </button>
              <Link
                href="/shipping-policy"
                className="flex-1 py-2 px-3 rounded-lg font-semibold text-sm text-center border-2 transition-all"
                style={{
                  color: "#F2ECE2",
                  borderColor: "rgba(201,166,107,0.55)",
                  backgroundColor: "#171a1d",
                }}
              >
                {language === "ar" ? "🚚 أسعار التوصيل" : "🚚 Delivery Prices"}
              </Link>
            </div>

            {/* Continue Shopping */}
            <Link
              href="/shop"
              className="w-full block text-center py-3 rounded-lg font-bold border-2 transition-all"
              style={{
                color: "#F2ECE2",
                borderColor: "rgba(201,166,107,0.55)",
              }}
            >
              {t("product.continueShop")}
            </Link>
          </div>
        </div>

        {manualFeedbacks.length > 0 ? (
          <div className="mt-12">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#C9A66B]">
              {language === "ar" ? "تجارب وآراء العملاء" : "Customer Moments"}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {manualFeedbacks.slice(0, 6).map((feedback) => (
                <div key={feedback.id} className="rounded-xl border border-white/10 bg-[#171a1d] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/10 text-white/80">
                      👤
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                      user
                    </span>
                  </div>

                  {feedback.note ? (
                    <p className="text-sm leading-7 text-white/85 whitespace-pre-wrap">{feedback.note}</p>
                  ) : null}

                  {feedback.images?.length ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {feedback.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={`${feedback.id}-${idx}`}
                          src={img}
                          alt={`feedback-${idx + 1}`}
                          className="h-16 w-full rounded-md border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                  ) : null}

                  <p className="mt-3 text-[11px] text-white/50">
                    {new Date(feedback.createdAt).toLocaleDateString(language === "ar" ? "ar-SA-u-nu-latn" : "en-US")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Product Details Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl border border-white/10 bg-[#171a1d] p-6">
            <h4 className="mb-2 text-lg font-bold text-[#C9A66B]">
              {t.product.original}
            </h4>
            <p className="text-sm text-white/80">
              {t.product.originalDesc}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#171a1d] p-6">
            <h4 className="mb-2 text-lg font-bold text-[#C9A66B]">
              {t.product.fastShip}
            </h4>
            <p className="text-sm text-white/80">
              {t.product.fastShipDesc}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#171a1d] p-6">
            <h4 className="mb-2 text-lg font-bold text-[#C9A66B]">
              {t.product.satisfaction}
            </h4>
            <p className="text-sm text-white/80">
              {t.product.satisfactionDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
