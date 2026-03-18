"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { Product } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { getProductSizeLabel } from "@/lib/productSizes";

interface CartItem {
  id: string;
  name: string;
  image?: string | null;
  size: "small" | "medium" | "large";
  quantity: number;
  price: number;
}

export default function Cart() {
  const { t, dir, language } = useLanguage();
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const guestFormRef = useRef<HTMLDivElement>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [guestError, setGuestError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("manajel-cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Load product data for images/names
  useEffect(() => {
    let mounted = true;
    
    try {
      const cached = localStorage.getItem(`manajel-products-cache-${language}`);
      if (cached) {
        const parsed = JSON.parse(cached) as Product[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = parsed.reduce<Record<string, Product>>((acc, item) => {
            acc[item.id] = item;
            return acc;
          }, {});
          setProductMap(map);
        }
      }
    } catch {
      // ignore cache errors
    }

    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.products) && mounted) {
            const map = (data.products as Product[]).reduce<Record<string, Product>>((acc, item) => {
              acc[item.id] = item;
              return acc;
            }, {});
            setProductMap(map);
            setProductsLoaded(true);
          }
        }
      } catch {
        // keep cached
      } finally {
        if (mounted) {
          setProductsLoaded(true);
        }
      }
    };

    loadProducts();
    
    return () => {
      mounted = false;
    };
  }, [language]);

  // Update isLoading based on products loaded
  useEffect(() => {
    if (productsLoaded) {
      setIsLoading(false);
    }
  }, [productsLoaded]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("manajel-cart", JSON.stringify(cartItems));
      } catch (error) {
        const isQuotaError = error instanceof DOMException && error.name === "QuotaExceededError";
        if (isQuotaError) {
          const trimmedCart = cartItems.map((item) => ({
            ...item,
            image: "",
          }));
          try {
            localStorage.setItem("manajel-cart", JSON.stringify(trimmedCart));
          } catch {
            // ignore if still failing
          }
        }
      }
    }
  }, [cartItems, isLoading]);

  const removeItem = (id: string, size: string) => {
    setCartItems(cartItems.filter((item) => !(item.id === id && item.size === size)));
  };

  const updateQuantity = (id: string, size: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id, size);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + getResolvedPrice(item) * item.quantity,
      0
    );
  };

  const getResolvedPrice = (item: CartItem) => {
    const product = productMap[item.id];
    if (!product) {
      return item.price;
    }

    const sizePrice = product.sizes?.[item.size]?.price;
    if (typeof sizePrice === "number" && sizePrice > 0) {
      return sizePrice;
    }

    return typeof product.price === "number" && product.price > 0
      ? product.price
      : item.price;
  };

  const sizeLabel = (size: string) => {
    return getProductSizeLabel(size, undefined, t, language);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: COLORS.light }}>
        {/* Header Skeleton */}
        <section
          style={{ backgroundColor: COLORS.primary }}
          className="text-white py-12 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="h-10 w-32 bg-white/20 rounded animate-pulse"></div>
          </div>
        </section>

        {/* Main Content Skeleton */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="relative h-full animate-pulse"
                  >
                    <div
                      className={`p-6 flex gap-6 ${
                        i !== 3 ? "border-b" : ""
                      }`}
                      style={{ borderColor: COLORS.border }}
                    >
                      {/* Image Skeleton */}
                      <div className="w-24 h-24 rounded-lg bg-gray-200 flex-shrink-0"></div>

                      {/* Info Skeleton */}
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          <div className="h-8 w-12 bg-gray-200 rounded"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>

                      {/* Price Skeleton */}
                      <div className="text-right flex flex-col justify-between">
                        <div className="h-4 w-16 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                          <div className="h-6 bg-gray-200 rounded w-24 ml-auto"></div>
                          <div className="h-4 bg-gray-200 rounded w-20 ml-auto mt-2"></div>
                          <div className="h-6 bg-gray-200 rounded w-24 ml-auto"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Button Skeleton */}
              <div className="mt-6">
                <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Order Summary Skeleton */}
            <div>
              <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                
                <div className="space-y-3 mb-6 pb-6 border-b" style={{ borderColor: COLORS.border }}>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-28"></div>
                </div>

                <div className="h-12 bg-gray-200 rounded-lg"></div>
                
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mt-4"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const submitOrder = async (guestData?: {
    name: string;
    phone: string;
    city: string;
    address: string;
    notes?: string;
  }) => {
    setOrderError("");
    setOrderLoading(true);

    const removeUnavailableItems = (latestProducts: Product[]) => {
      const latestMap = latestProducts.reduce<Record<string, Product>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      setProductMap(latestMap);

      const unavailableItems = cartItems.filter((item) => latestMap[item.id]?.inStock === false);
      if (!unavailableItems.length) {
        return false;
      }

      const availableItems = cartItems.filter((item) => latestMap[item.id]?.inStock !== false);
      setCartItems(availableItems);
      setOrderError(
        language === "ar"
          ? "تم حذف المنتجات غير المتوفرة من السلة. يرجى مراجعة السلة ثم إعادة التأكيد."
          : "Out-of-stock items were removed from your cart. Please review your cart and confirm again."
      );
      return true;
    };

    // Refresh stock status before creating order, then remove unavailable items from cart
    try {
      const latestProductsRes = await fetch(`/api/products?lang=${language}&_ts=${Date.now()}`, { cache: "no-store" });
      if (latestProductsRes.ok) {
        const latestData = await latestProductsRes.json();
        if (Array.isArray(latestData?.products)) {
          if (removeUnavailableItems(latestData.products as Product[])) {
            setOrderLoading(false);
            return;
          }
        }
      }
    } catch {
      // If stock refresh fails, continue with server-side validation
    }

    const payload = {
      items: cartItems.map((item) => {
        const product = productMap[item.id];
        const resolvedPrice = getResolvedPrice(item);
        const resolvedName = product?.name || item.name;
        const resolvedImage = product?.image || item.image || null;

        return {
          ...item,
          name: resolvedName,
          price: resolvedPrice,
          image: resolvedImage,
        };
      }),
      name: guestData?.name,
      phone: guestData?.phone,
      city: guestData?.city,
      address: guestData?.address,
      notes: guestData?.notes,
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const newOrderId = data?.orderId;
      const guestToken = typeof data?.guestToken === "string" ? data.guestToken : "";
      if (newOrderId) {
        if (!isAuthenticated && guestToken) {
          try {
            const key = "manajel-guest-orders";
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : [];
            const list = (Array.isArray(parsed) ? parsed : []) as Array<{
              id?: string;
              guestToken?: string;
              createdAt?: string;
            }>;
            const nextList = [
              { id: newOrderId, guestToken, createdAt: new Date().toISOString() },
              ...list.filter((item) => item?.id !== newOrderId),
            ].slice(0, 20);
            localStorage.setItem(key, JSON.stringify(nextList));
          } catch {
            // ignore localStorage errors
          }
        }

        setOrderId(newOrderId);
        setCartItems([]);
        localStorage.removeItem("manajel-cart");
        router.push(
          !isAuthenticated && guestToken
            ? `/orders/${newOrderId}?guestToken=${encodeURIComponent(guestToken)}`
            : `/orders/${newOrderId}`
        );
      } else {
        setOrderPlaced(true);
      }
      setOrderLoading(false);
      return;
    }

    const data = await res.json().catch(() => ({}));

    // In case stock changed between checks, try one more forced refresh and prune unavailable items
    try {
      const latestProductsRes = await fetch(`/api/products?lang=${language}&_ts=${Date.now()}`, { cache: "no-store" });
      if (latestProductsRes.ok) {
        const latestData = await latestProductsRes.json();
        if (Array.isArray(latestData?.products) && removeUnavailableItems(latestData.products as Product[])) {
          setOrderLoading(false);
          return;
        }
      }
    } catch {
      // ignore and show backend error
    }

    setOrderError(data?.error ? String(data.error) : t("cart.orderFailed"));
    setOrderLoading(false);
  };

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      setShowGuestForm(true);
      // انتظر قليلاً ثم نزل الصفحة للنموذج
      setTimeout(() => {
        guestFormRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }
    submitOrder();
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError("");

    if (!guestName || !guestPhone || !guestCity || !guestAddress) {
      setGuestError(t("cart.deliveryRequired"));
      return;
    }

    submitOrder({
      name: guestName,
      phone: guestPhone,
      city: guestCity,
      address: guestAddress,
      notes: guestNotes,
    });
  };

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: COLORS.light }}>
      {/* Header */}
      <section
        style={{ backgroundColor: COLORS.primary }}
        className="text-white py-12 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">{t("cart.title")}</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {orderPlaced ? (
          // Order Confirmed
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2
              style={{ color: COLORS.primary }}
              className="text-2xl font-bold mb-4"
            >
              {t("cart.orderConfirmed")}
            </h2>
            <p className="text-gray-900 mb-8">
              {t("cart.orderConfirmedDesc")}
            </p>
            <Link
              href="/shop"
              className="inline-block px-8 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: COLORS.primary, color: "white" }}
            >
              {t("cart.continueShop")}
            </Link>
          </div>
        ) : cartItems.length === 0 ? (
          // Empty Cart
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2
              style={{ color: COLORS.primary }}
              className="text-2xl font-bold mb-4"
            >
              {t("cart.empty")}
            </h2>
            <p className="text-gray-900 mb-8">
              {t("cart.emptyDesc")}
            </p>
            <Link
              href="/shop"
              className="inline-block px-8 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: COLORS.primary, color: "white" }}
            >
              {t("cart.continueShop")}
            </Link>
          </div>
        ) : (
          // Cart with Items
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                {cartItems.map((item, index) => {
                  const product = productMap[item.id];
                  const productName = product?.name || item.name;
                  const productImage = product?.image || item.image || "";
                  const productPrice = getResolvedPrice(item);
                  const productSizeLabel = getProductSizeLabel(item.size, product?.sizes, t, language);
                  return (
                  <div
                    key={`${item.id}-${item.size}`}
                    className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 ${
                      index !== cartItems.length - 1
                        ? "border-b"
                        : ""
                    }`}
                    style={{
                      borderColor: COLORS.border,
                    }}
                  >
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productName}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder.png";
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-center"
                          style={{ backgroundColor: COLORS.accent }}
                        >
                          <div
                            style={{ color: COLORS.primary }}
                            className="text-2xl font-bold overflow-hidden"
                          >
                            {item.name.split(" ")[0]?.[0] || "📦"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        style={{ color: COLORS.primary }}
                        className="font-bold text-lg mb-2"
                      >
                        {productName}
                      </h3>
                      <p className="text-gray-900 text-sm mb-4">
                        {t("cart.size")}: <span className="font-semibold">{productSizeLabel || sizeLabel(item.size)}</span>
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.size,
                              item.quantity - 1
                            )
                          }
                          className="px-3 py-1 rounded border"
                          style={{
                            borderColor: COLORS.primary,
                            color: COLORS.primary,
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.id,
                              item.size,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-12 px-2 py-1 text-center border rounded text-gray-900"
                          style={{ borderColor: COLORS.border }}
                        />
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.size,
                              item.quantity + 1
                            )
                          }
                          className="px-3 py-1 rounded border"
                          style={{
                            borderColor: COLORS.primary,
                            color: COLORS.primary,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price & Remove */}
                    <div className="w-full sm:w-auto text-start sm:text-right flex flex-row sm:flex-col justify-between gap-4 sm:gap-0">
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold sm:mb-4"
                      >
                        {t("cart.remove")}
                      </button>
                      <div>
                        <p className="text-gray-900 text-sm">{t("cart.pricePerUnit")}</p>
                        <p
                          style={{ color: COLORS.primary }}
                          className="font-bold text-lg"
                        >
                          {CURRENCY_SYMBOL}{productPrice}
                        </p>
                        <p className="text-gray-900 text-sm mt-2">{t("cart.total")}</p>
                        <p
                          style={{ color: COLORS.secondary }}
                          className="font-bold text-lg"
                        >
                          {CURRENCY_SYMBOL}{productPrice * item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                );})}
              </div>

              {/* Continue Shopping */}
              <div className="mt-6">
                <Link
                  href="/shop"
                  className="inline-block px-6 py-2 rounded-lg font-semibold border-2"
                  style={{
                    color: COLORS.primary,
                    borderColor: COLORS.primary,
                  }}
                >
                  ← {t("cart.continueShop")}
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg p-6 shadow-md sticky top-20">
                <h3
                  style={{ color: COLORS.primary }}
                  className="font-bold text-lg mb-4"
                >
                  {t("cart.orderSummary")}
                </h3>

                <div className="space-y-3 mb-6 pb-6 border-b" style={{ borderColor: COLORS.border }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900">{t("cart.itemCount")}</span>
                    <span className="font-semibold text-gray-900">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900">{t("cart.goodsPrice")}</span>
                    <span className="font-semibold text-gray-900">{CURRENCY_SYMBOL}{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span style={{ color: COLORS.primary }} className="font-bold text-lg">
                    {t("cart.totalPrice")}
                  </span>
                  <span
                    style={{ color: COLORS.primary }}
                    className="font-bold text-2xl"
                  >
                    {CURRENCY_SYMBOL}{calculateTotal().toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={orderLoading}
                  className="w-full py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: COLORS.primary, opacity: orderLoading ? 0.7 : 1 }}
                >
                  {orderLoading ? t("cart.orderSaving") : t("cart.buyNow")}
                </button>

                <p className="text-xs text-gray-900 text-center mt-4">
                  {t("cart.willRedirect")}
                </p>

                {!isAuthenticated && showGuestForm && !orderPlaced && (
                  <div
                    ref={guestFormRef}
                    className="mt-8 p-6 rounded-lg border-2"
                    style={{ borderColor: COLORS.primary, backgroundColor: "#f0f8ff" }}
                  >
                    {/* رسالة تنبيه */}
                    <div
                      className="p-4 rounded-lg mb-6 text-sm font-semibold"
                      style={{ backgroundColor: COLORS.primary, color: "white" }}
                    >
                      {t("cart.deliveryInfo")} - {t("cart.deliveryRequired")}
                    </div>

                    <form
                      onSubmit={handleGuestSubmit}
                      className="space-y-3"
                      style={{ direction: dir }}
                    >
                    <h4
                      className="font-semibold"
                      style={{ color: COLORS.primary }}
                    >
                      {t("cart.deliveryInfo")}
                    </h4>
                    <p className="text-xs text-gray-900">
                      {t("cart.loginToSkip")}
                    </p>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">
                        {t("cart.fullName")}
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500"
                        style={{ borderColor: COLORS.border }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">
                        {t("cart.phone")}
                      </label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder={t.contact.phonePlaceholder}
                         className="w-full border rounded-lg px-3 py-2 text-right text-gray-900 placeholder:text-gray-500"
                        style={{ borderColor: COLORS.border }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">
                        {t("cart.city")}
                      </label>
                      <input
                        type="text"
                        value={guestCity}
                        onChange={(e) => setGuestCity(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500"
                        style={{ borderColor: COLORS.border }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">
                        {t("cart.address")}
                      </label>
                      <input
                        type="text"
                        value={guestAddress}
                        onChange={(e) => setGuestAddress(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500"
                        style={{ borderColor: COLORS.border }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">
                        {t("cart.notes")}
                      </label>
                      <textarea
                        value={guestNotes}
                        onChange={(e) => setGuestNotes(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-500"
                        style={{ borderColor: COLORS.border }}
                        rows={3}
                      />
                    </div>
                    {guestError && (
                      <div className="text-sm text-red-600">{guestError}</div>
                    )}
                    {orderError && (
                      <div className="text-sm text-red-600">{orderError}</div>
                    )}
                    <button
                      type="submit"
                      disabled={orderLoading}
                      className="w-full py-2 rounded-lg font-semibold text-white"
                      style={{ backgroundColor: COLORS.secondary, opacity: orderLoading ? 0.7 : 1 }}
                    >
                      {orderLoading ? t("cart.orderSaving") : t("cart.placeOrder")}
                    </button>
                    </form>
                  </div>
                )}

                {orderError && !orderPlaced && (
                  <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {orderError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
