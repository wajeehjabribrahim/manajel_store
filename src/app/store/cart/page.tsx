"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { Product } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { getProductSizeLabel, getProductSizeWeight } from "@/lib/productSizes";

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
  const [authenticatedNotes, setAuthenticatedNotes] = useState("");
  const [guestError, setGuestError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [animatedCartTotal, setAnimatedCartTotal] = useState(0);
  const animatedCartTotalRef = useRef(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("manajel-cart");
    if (!savedCart) {
      setIsLoading(false);
      return;
    }

    try {
      setCartItems(JSON.parse(savedCart));
    } catch {
      // ignore parse errors and treat as empty cart
      setIsLoading(false);
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

    // If the cart is empty, skip fetching products (we don't need them)
    if (cartItems.length === 0) {
      setProductsLoaded(true);
      return () => {
        mounted = false;
      };
    }

    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?lang=${language}&_ts=${Date.now()}`, {
          cache: "no-store",
        });
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
  }, [language, cartItems.length]);

  // Update isLoading based on products loaded
  useEffect(() => {
    if (productsLoaded || cartItems.length === 0) {
      setIsLoading(false);
    }
  }, [productsLoaded, cartItems.length]);

  // Auto-remove out-of-stock items whenever fresh product data is available
  useEffect(() => {
    if (!productsLoaded) return;

    setCartItems((prev) => {
      if (!prev.length) return prev;

      const next = prev.filter((item) => {
        const product = productMap[item.id];
        return product?.inStock !== false;
      });

      return next.length === prev.length ? prev : next;
    });
  }, [productsLoaded, productMap]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("manajel-cart", JSON.stringify(cartItems));
        window.dispatchEvent(new Event("manajel-cart-updated"));
      } catch (error) {
        const isQuotaError = error instanceof DOMException && error.name === "QuotaExceededError";
        if (isQuotaError) {
          const trimmedCart = cartItems.map((item) => ({
            ...item,
            image: "",
          }));
          try {
            localStorage.setItem("manajel-cart", JSON.stringify(trimmedCart));
            window.dispatchEvent(new Event("manajel-cart-updated"));
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
    const safeQuantity = Math.max(1, newQuantity);
    setCartItems(
      cartItems.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity: safeQuantity }
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

  useEffect(() => {
    // If the cart is empty, reset the animated total and skip animation
    if (cartItems.length === 0) {
      animatedCartTotalRef.current = 0;
      setAnimatedCartTotal(0);
      return;
    }

    const targetTotal = calculateTotal();
    const startTotal = animatedCartTotalRef.current;

    if (Math.abs(targetTotal - startTotal) < 0.01) {
      animatedCartTotalRef.current = targetTotal;
      setAnimatedCartTotal(targetTotal);
      return;
    }

    const duration = 260;
    const startTime = performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startTotal + (targetTotal - startTotal) * eased;

      animatedCartTotalRef.current = value;
      setAnimatedCartTotal(value);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        animatedCartTotalRef.current = targetTotal;
        setAnimatedCartTotal(targetTotal);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [cartItems, productMap]);

  const normalizeToWesternDigits = (value: string) =>
    value
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

  if (isLoading) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#FBF8F2" }} className="text-[#121416]">
        {/* Header Skeleton */}
        <section
          style={{ background: "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)", borderBottom: "1px solid rgba(201,166,107,0.25)" }}
          className="text-[#121416] py-12 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="h-10 w-32 bg-black/20 rounded animate-pulse"></div>
          </div>
        </section>

        {/* Main Content Skeleton */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items Skeleton */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-black/10 bg-[#FFFFFF] shadow-md">
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
                      <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-black/10"></div>

                      {/* Info Skeleton */}
                      <div className="flex-1 space-y-3">
                        <div className="h-6 w-3/4 rounded bg-black/10"></div>
                        <div className="h-4 w-1/4 rounded bg-black/10"></div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-black/10"></div>
                          <div className="h-8 w-12 rounded bg-black/10"></div>
                          <div className="h-8 w-8 rounded bg-black/10"></div>
                        </div>
                      </div>

                      {/* Price Skeleton */}
                      <div className="text-right flex flex-col justify-between">
                        <div className="mb-4 h-4 w-16 rounded bg-black/10"></div>
                        <div className="space-y-2">
                          <div className="ml-auto h-4 w-20 rounded bg-black/10"></div>
                          <div className="ml-auto h-6 w-24 rounded bg-black/10"></div>
                          <div className="ml-auto mt-2 h-4 w-20 rounded bg-black/10"></div>
                          <div className="ml-auto h-6 w-24 rounded bg-black/10"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Button Skeleton */}
              <div className="mt-6">
                <div className="h-10 w-48 rounded-lg bg-black/10 animate-pulse"></div>
              </div>
            </div>

            {/* Order Summary Skeleton */}
            <div>
              <div className="rounded-xl border border-black/10 bg-[#FFFFFF] p-6 shadow-md animate-pulse">
                <div className="mb-4 h-6 w-1/2 rounded bg-black/10"></div>
                
                <div className="space-y-3 mb-6 pb-6 border-b" style={{ borderColor: COLORS.border }}>
                  <div className="flex justify-between">
                    <div className="h-4 w-20 rounded bg-black/10"></div>
                    <div className="h-4 w-8 rounded bg-black/10"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-24 rounded bg-black/10"></div>
                    <div className="h-4 w-16 rounded bg-black/10"></div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div className="h-6 w-24 rounded bg-black/10"></div>
                  <div className="h-8 w-28 rounded bg-black/10"></div>
                </div>

                <div className="h-12 rounded-lg bg-black/10"></div>
                
                <div className="mx-auto mt-4 h-3 w-3/4 rounded bg-black/10"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const submitOrder = async (guestData?: {
    name?: string;
    phone?: string;
    city?: string;
    address?: string;
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
        window.dispatchEvent(new Event("manajel-cart-updated"));
        router.push(
          !isAuthenticated && guestToken
            ? `/store/orders/${newOrderId}?guestToken=${encodeURIComponent(guestToken)}`
            : `/store/orders/${newOrderId}`
        );
      } else {
        setOrderPlaced(true);
      }
      setOrderLoading(false);
      return;
    }

    const data = await res.json().catch(() => ({}));

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
    submitOrder({
      notes: authenticatedNotes,
    });
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
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#FBF8F2" }} className="text-[#121416] tajawal-regular-all">
      {/* Header */}
      <section
        style={{
          background: "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="text-[#121416] py-12 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl text-[#C9A66B] font-bold">{t("cart.title")}</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {orderPlaced ? (
          // Order Confirmed
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2
              className="mb-4 text-2xl font-bold text-[#121416]"
            >
              {t("cart.orderConfirmed")}
            </h2>
            <p className="mb-8 text-black/75">
              {t("cart.orderConfirmedDesc")}
            </p>
            <Link
              href="/store/shop"
              className="gold-button inline-block px-8 py-3 rounded-lg font-semibold"
            >
              {t("cart.continueShop")}
            </Link>
          </div>
        ) : cartItems.length === 0 ? (
          // Empty Cart
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2
              className="mb-4 text-2xl font-bold text-[#121416]"
            >
              {t("cart.empty")}
            </h2>
            <p className="mb-8 text-black/75">
              {t("cart.emptyDesc")}
            </p>
            <Link
              href="/store/shop"
              className="gold-button inline-block px-8 py-3 rounded-lg font-semibold"
            >
              {t("cart.continueShop")}
            </Link>
          </div>
        ) : (
          // Cart with Items
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-black/10 bg-[#FFFFFF] shadow-md">
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
                      borderColor: "rgba(0,0,0,0.14)",
                    }}
                  >
                    {/* Product Image & Price Section (side by side on mobile) */}
                    <div className="flex gap-4 sm:gap-6 flex-1">
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
                          style={{ backgroundColor: "#F3EEE3" }}
                        >
                          <div className="overflow-hidden text-2xl font-bold text-[#C9A66B]">
                            {item.name.split(" ")[0]?.[0] || "•"}
                          </div>
                        </div>
                      )}
                    </div>

                      {/* Price & Remove (next to image on mobile) */}
                      <div className="w-auto text-right flex flex-col gap-0 sm:hidden">
                        <button
                          onClick={() => removeItem(item.id, item.size)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold mb-2"
                        >
                          {t("cart.remove")}
                        </button>
                        <div>
                          <p className="text-xs text-black/70">{t("cart.pricePerUnit")}</p>
                          <p className="text-sm font-bold text-[#121416]">
                            {CURRENCY_SYMBOL}{productPrice}
                          </p>
                          <p className="mt-1 text-xs text-black/70">{t("cart.total")}</p>
                          <p className="text-sm font-bold text-[#C9A66B]">
                            {CURRENCY_SYMBOL}{productPrice * item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="gold-texture-static mb-2 text-lg font-bold text-[#C9A66B]"
                      >
                        {productName}
                      </h3>
                      <p className="mb-4 text-sm text-black/70">
                        {t("cart.weight")}: <span className="font-semibold">{getProductSizeWeight(item.size, product?.sizes)}</span>
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
                            borderColor: "rgba(201,166,107,0.55)",
                            color: "#121416",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, item.size, Math.max(1, Number(normalizeToWesternDigits(e.target.value).replace(/\D/g, "")) || 1))
                          }
                          pattern="[0-9]*"
                          lang="en"
                          dir="ltr"
                          inputMode="numeric"
                          className="w-12 rounded border px-2 py-1 text-center text-[#121416]"
                          style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF", fontFamily: "Arial, sans-serif" }}
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
                            borderColor: "rgba(201,166,107,0.55)",
                            color: "#121416",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price & Remove (desktop only) */}
                    <div className="w-full sm:w-auto text-start sm:text-right hidden sm:flex flex-row sm:flex-col justify-between gap-4 sm:gap-0">
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold sm:mb-4"
                      >
                        {t("cart.remove")}
                      </button>
                      <div>
                        <p className="text-sm text-black/70">{t("cart.pricePerUnit")}</p>
                        <p className="text-lg font-bold text-[#121416]">
                          {CURRENCY_SYMBOL}{productPrice}
                        </p>
                        <p className="mt-2 text-sm text-black/70">{t("cart.total")}</p>
                        <p className="text-lg font-bold text-[#C9A66B]">
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
                  href="/store/shop"
                  className="inline-block px-6 py-2 rounded-lg font-semibold border-2"
                  style={{
                    color: "#121416",
                    borderColor: "rgba(201,166,107,0.55)",
                  }}
                >
                  ← {t("cart.continueShop")}
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="sticky top-20 rounded-xl border border-black/10 bg-[#FFFFFF] p-6 shadow-md">
                <h3
                  className="mb-4 text-lg font-bold text-[#C9A66B]"
                >
                  {t("cart.orderSummary")}
                </h3>

                <div className="mb-6 space-y-3 border-b pb-6" style={{ borderColor: "rgba(0,0,0,0.14)" }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-black/70">{t("cart.itemCount")}</span>
                    <span className="font-semibold text-[#121416]">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black/70">{t("cart.goodsPrice")}</span>
                    <span className="font-semibold text-[#121416]">{CURRENCY_SYMBOL}{animatedCartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold text-[#121416]">
                    {t("cart.totalPrice")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#C9A66B]">
                      {CURRENCY_SYMBOL}{animatedCartTotal.toFixed(2)}
                    </span>
                    <Link
                      href="/store/shipping-policy"
                      className="px-2 py-1 rounded-md text-xs font-semibold border"
                      style={{ borderColor: "rgba(201,166,107,0.55)", color: "#121416", backgroundColor: "#FFFFFF" }}
                    >
                      {language === "ar" ? "+ سعر التوصيل" : "+ Delivery Price"}
                    </Link>
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-semibold text-black/80">
                      {t("cart.notes")} <span className="text-xs text-black/55">({t("common.optional") || "اختيارية"})</span>
                    </label>
                    <textarea
                      value={authenticatedNotes}
                      onChange={(e) => setAuthenticatedNotes(e.target.value)}
                      placeholder={t("cart.notesPlaceholder") || "أضف أي ملاحظات على الطلب..."}
                      className="w-full resize-none rounded-lg border px-3 py-2 text-[#121416] placeholder:text-black/40"
                      style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                      rows={3}
                    />
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={orderLoading}
                  className="gold-button w-full py-3 rounded-lg font-bold transition-opacity hover:opacity-90"
                  style={{ opacity: orderLoading ? 0.7 : 1 }}
                >
                  {orderLoading ? t("cart.orderSaving") : t("cart.buyNow")}
                </button>

                <p className="mt-4 text-center text-xs text-black/60">
                  {t("cart.willRedirect")}
                </p>

                {!isAuthenticated && showGuestForm && !orderPlaced && (
                  <div
                    ref={guestFormRef}
                    className="mt-8 p-6 rounded-lg border-2"
                    style={{ borderColor: "rgba(201,166,107,0.45)", backgroundColor: "#FFFFFF" }}
                  >
                    {/* رسالة تنبيه */}
                    <div
                      className="p-4 rounded-lg mb-6 text-sm font-semibold"
                      style={{ backgroundColor: "#1f5d4e", color: "#FFFFFF" }}
                    >
                      {t("cart.deliveryInfo")} - {t("cart.deliveryRequired")}
                    </div>

                    <form
                      onSubmit={handleGuestSubmit}
                      className="space-y-3"
                      style={{ direction: dir }}
                    >
                    <h4 className="font-semibold text-[#C9A66B]">
                      {t("cart.deliveryInfo")}
                    </h4>
                    <p className="text-xs text-black/70">
                      {t("cart.loginToSkip")}
                    </p>
                    <div>
                      <label className="mb-1 block text-sm text-black/80">
                        {t("cart.fullName")}
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-[#121416] placeholder:text-black/40"
                        style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-black/80">
                        {t("cart.phone")}
                      </label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder={t.contact.phonePlaceholder}
                         className="w-full rounded-lg border px-3 py-2 text-right text-[#121416] placeholder:text-black/40"
                        style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-black/80">
                        {t("cart.city")}
                      </label>
                      <input
                        type="text"
                        value={guestCity}
                        onChange={(e) => setGuestCity(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-[#121416] placeholder:text-black/40"
                        style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-black/80">
                        {t("cart.address")}
                      </label>
                      <input
                        type="text"
                        value={guestAddress}
                        onChange={(e) => setGuestAddress(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-[#121416] placeholder:text-black/40"
                        style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-black/80">
                        {t("cart.notes")}
                      </label>
                      <textarea
                        value={guestNotes}
                        onChange={(e) => setGuestNotes(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-[#121416] placeholder:text-black/40"
                        style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
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
                      className="gold-button w-full py-2 rounded-lg font-semibold"
                      style={{ opacity: orderLoading ? 0.7 : 1 }}
                    >
                      {orderLoading ? t("cart.orderSaving") : t("cart.placeOrder")}
                    </button>
                    </form>
                  </div>
                )}

                {orderError && !orderPlaced && (
                  <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
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
