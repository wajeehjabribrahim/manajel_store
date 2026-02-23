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

export default function ProductPage({ params }: PageProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

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
    const price = product.sizes?.[activeSize]?.price ?? product.price;

    const cartItem = {
      id: product.id,
      name: product.name,
      image: product.image,
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
    localStorage.setItem("manajel-cart", JSON.stringify(cart));
    
    // Redirect to cart
    setTimeout(() => {
      router.push("/cart");
    }, 300);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)" }} className="flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: COLORS.primary }} className="text-xl font-semibold">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)" }} className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">المنتج غير موجود</h1>
          <p className="text-gray-600 mb-6">نعتصر، المنتج الذي تبحث عنه غير متوفر</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: COLORS.primary, color: COLORS.accent }}
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

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: COLORS.light }}>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-600">
        <Link href="/shop" className="hover:underline" style={{ color: COLORS.primary }}>
          {t("nav.shop")}
        </Link>
        {" > "}
        <span>{name}</span>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image Gallery */}
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.accent }}>
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
                    style={{ color: COLORS.primary }}
                    className="text-8xl font-bold mb-4"
                  >
                    {name.split(" ")[0][0]}
                  </div>
                  <p
                    style={{ color: COLORS.secondary }}
                    className="text-lg font-semibold"
                  >
                    {name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1
              style={{ color: COLORS.primary }}
              className="text-4xl font-bold mb-2"
            >
              {name}
            </h1>

            {/* Rating */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">★★★★★</span>
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
            <p className="text-gray-700 mb-6">{description}</p>

            {/* Size Selection */}
            <div className="mb-6">
              <h3
                style={{ color: COLORS.primary }}
                className="font-bold text-lg mb-3"
              >
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
                      borderColor: activeSize === size ? COLORS.primary : COLORS.border,
                      backgroundColor: activeSize === size ? COLORS.accent : "white",
                    }}
                  >
                    <div
                      style={{ color: COLORS.primary }}
                      className="font-bold capitalize"
                    >
                      {t(`product.${size}`)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {product.sizes?.[size]?.weight || ""}
                    </div>
                    <div
                      style={{ color: COLORS.secondary }}
                      className="font-bold text-sm"
                    >
                      {CURRENCY_SYMBOL}{product.sizes?.[size]?.price ?? product.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3
                style={{ color: COLORS.primary }}
                className="font-bold text-lg mb-3"
              >
                {t("product.quantity")}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 rounded-lg font-bold"
                  style={{
                    backgroundColor: COLORS.accent,
                    color: COLORS.primary,
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-16 px-3 py-2 text-center border-2 rounded-lg text-gray-900"
                  style={{ borderColor: COLORS.border }}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 rounded-lg font-bold"
                  style={{
                    backgroundColor: COLORS.accent,
                    color: COLORS.primary,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div
              className="p-4 rounded-lg mb-6"
              style={{ backgroundColor: COLORS.accent }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-900">{t("product.pricePerUnit")}</span>
                <span style={{ color: COLORS.primary }} className="font-bold">
                  {CURRENCY_SYMBOL}{currentSize.price}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2" style={{ borderColor: COLORS.border }}>
                <span style={{ color: COLORS.primary }} className="font-bold text-lg">
                  {t("product.total")}
                </span>
                <span style={{ color: COLORS.primary }} className="font-bold text-2xl">
                  {CURRENCY_SYMBOL}{currentSize.price * quantity}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              className="w-full py-3 rounded-lg font-bold text-white text-lg transition-opacity hover:opacity-90 mb-4 disabled:opacity-50"
              style={{ backgroundColor: COLORS.primary }}
              onClick={handleAddToCart}
              disabled={isAdding || !product.inStock}
            >
              {isAdding ? t("product.adding") : t("product.addToCart")}
            </button>

            {/* Continue Shopping */}
            <Link
              href="/shop"
              className="w-full block text-center py-3 rounded-lg font-bold border-2 transition-all"
              style={{
                color: COLORS.primary,
                borderColor: COLORS.primary,
              }}
            >
              {t("product.continueShop")}
            </Link>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg" style={{ backgroundColor: "white" }}>
            <h4
              style={{ color: COLORS.primary }}
              className="font-bold text-lg mb-2"
            >
              {t.product.original}
            </h4>
            <p className="text-gray-900 text-sm">
              {t.product.originalDesc}
            </p>
          </div>
          <div className="p-6 rounded-lg" style={{ backgroundColor: "white" }}>
            <h4
              style={{ color: COLORS.primary }}
              className="font-bold text-lg mb-2"
            >
              {t.product.fastShip}
            </h4>
            <p className="text-gray-900 text-sm">
              {t.product.fastShipDesc}
            </p>
          </div>
          <div className="p-6 rounded-lg" style={{ backgroundColor: "white" }}>
            <h4
              style={{ color: COLORS.primary }}
              className="font-bold text-lg mb-2"
            >
              {t.product.satisfaction}
            </h4>
            <p className="text-gray-900 text-sm">
              {t.product.satisfactionDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
