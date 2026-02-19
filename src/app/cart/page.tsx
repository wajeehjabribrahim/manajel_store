"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { COLORS } from "@/constants/store";
import { PRODUCTS } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

interface CartItem {
  id: string;
  name: string;
  size: "small" | "medium" | "large";
  quantity: number;
  price: number;
}

export default function Cart() {
  const { t } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState<"idle" | "under_review">("idle");

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("manajel-cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    const savedStatus = localStorage.getItem("manajel-order-status") as
      | "idle"
      | "under_review"
      | null;
    if (savedStatus) {
      setOrderStatus(savedStatus);
    }
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("manajel-cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("manajel-order-status", orderStatus);
    }
  }, [orderStatus, isLoading]);

  useEffect(() => {
    if (!isLoading && orderStatus === "under_review") {
      setOrderStatus("idle");
    }
  }, [cartItems, isLoading, orderStatus]);

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

  const handleConfirmOrder = () => {
    setOrderStatus("under_review");
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
        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2
              style={{ color: COLORS.primary }}
              className="text-2xl font-bold mb-4"
            >
              {t("cart.empty")}
            </h2>
            <p className="text-gray-600 mb-8">
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
                {cartItems.map((item, index) => (
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
                    {/* Product Initial */}
                    <div
                      className="w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: COLORS.accent }}
                    >
                      <div
                        style={{ color: COLORS.primary }}
                        className="text-4xl font-bold"
                      >
                        {item.name.split(" ")[0][0]}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3
                        style={{ color: COLORS.primary }}
                        className="font-bold text-lg mb-2"
                      >
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
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
                        <p className="text-gray-600 text-sm">{t("cart.pricePerUnit")}</p>
                        <p
                          style={{ color: COLORS.primary }}
                          className="font-bold text-lg"
                        >
                          ${item.price}
                        </p>
                        <p className="text-gray-600 text-sm mt-2">{t("cart.total")}</p>
                        <p
                          style={{ color: COLORS.secondary }}
                          className="font-bold text-lg"
                        >
                          ${item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                  ← متابعة التسوق
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
                    <span className="text-gray-600">{t("cart.itemCount")}</span>
                    <span className="font-semibold">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("cart.goodsPrice")}</span>
                    <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
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
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleConfirmOrder}
                  className="w-full py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {t("cart.buyNow")}
                </button>

                {orderStatus === "under_review" && (
                  <p
                    className="text-sm text-center mt-3 font-semibold"
                    style={{ color: COLORS.primary }}
                  >
                    {t("cart.orderStatus")}: {t("cart.underReview")}
                  </p>
                )}

                <p className="text-xs text-gray-500 text-center mt-4">
                  {t("cart.willRedirect")}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
