"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { PRODUCTS } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";

interface CartItem {
  id: string;
  name: string;
  image?: string | null;
  size: "small" | "medium" | "large";
  quantity: number;
  price: number;
}

export default function Cart() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("manajel-cart", JSON.stringify(cartItems));
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
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const sizeLabel = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      small: t("product.small"),
      medium: t("product.medium"),
      large: t("product.large"),
    };
    return sizeMap[size] || size;
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)" }} className="flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: COLORS.primary }} className="text-xl font-semibold">
            {t("cart.loading")}
          </p>
        </div>
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

    const payload = {
      items: cartItems,
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
      if (newOrderId) {
        setOrderId(newOrderId);
        setCartItems([]);
        localStorage.removeItem("manajel-cart");
        router.push(`/orders/${newOrderId}`);
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
                  const product = PRODUCTS.find(p => p.id === item.id);
                  const productName = product ? t(`products.${product.id}.name`) : item.name;
                  return (
                  <div
                    key={`${item.id}-${item.size}`}
                    className={`p-6 flex gap-6 ${
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
                      {(product?.image || item.image) ? (
                        <img
                          src={product?.image || item.image || ""}
                          alt={productName}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS.accent }}
                        >
                          <div
                            style={{ color: COLORS.primary }}
                            className="text-4xl font-bold"
                          >
                            {item.name.split(" ")[0][0]}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3
                        style={{ color: COLORS.primary }}
                        className="font-bold text-lg mb-2"
                      >
                        {productName}
                      </h3>
                      <p className="text-gray-900 text-sm mb-4">
                        {t("cart.size")}: <span className="font-semibold">{sizeLabel(item.size)}</span>
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
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
                          className="w-12 px-2 py-1 text-center border rounded"
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
                    <div className="text-right flex flex-col justify-between">
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold mb-4"
                      >
                        {t("cart.remove")}
                      </button>
                      <div>
                        <p className="text-gray-900 text-sm">{t("cart.pricePerUnit")}</p>
                        <p
                          style={{ color: COLORS.primary }}
                          className="font-bold text-lg"
                        >
                          {CURRENCY_SYMBOL}{item.price}
                        </p>
                        <p className="text-gray-900 text-sm mt-2">{t("cart.total")}</p>
                        <p
                          style={{ color: COLORS.secondary }}
                          className="font-bold text-lg"
                        >
                          {CURRENCY_SYMBOL}{item.price * item.quantity}
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
                    <span className="font-semibold">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900">{t("cart.goodsPrice")}</span>
                    <span className="font-semibold">{CURRENCY_SYMBOL}{calculateTotal().toFixed(2)}</span>
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
                  <form
                    onSubmit={handleGuestSubmit}
                    className="mt-6 space-y-3"
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
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
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
                        placeholder="ادخل الرقم مع مقدمة واتساب مثل +972"
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
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
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
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
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
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
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
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
