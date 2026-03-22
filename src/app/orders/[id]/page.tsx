"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { PRODUCTS } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductSizeWeight } from "@/lib/productSizes";

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  currency: string;
  shippingName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingAddress: string;
  shippingNotes: string | null;
  email: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const { t, dir, language } = useLanguage();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const guestToken = searchParams.get("guestToken") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const query = guestToken
          ? `?guestToken=${encodeURIComponent(guestToken)}`
          : "";
        const res = await fetch(`/api/orders/${id}${query}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else {
          setError(t("orders.notFound"));
        }
      } catch {
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, guestToken, t]);

  if (loading) {
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

  if (error || !order) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#121416" }} className="text-[#F2ECE2]">
        <section style={{ background: "linear-gradient(180deg, #14171a 0%, #101214 100%)", borderBottom: "1px solid rgba(201,166,107,0.25)" }} className="text-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold">{t("orders.title")}</h1>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold mb-4">
              {error || t("orders.notFound")}
            </h2>
            <Link
              href="/shop"
              className="inline-block px-8 py-3 rounded-lg font-semibold mt-4"
              style={{ backgroundColor: "#1f5d4e", color: "#F2ECE2", border: "1px solid rgba(201,166,107,0.45)" }}
            >
              {t("cart.continueShop")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: t("orders.statusPending"),
      processing: t("orders.statusProcessing"),
      shipped: t("orders.statusShipped"),
      delivered: t("orders.statusDelivered"),
      cancelled: t("orders.statusCancelled"),
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: "#FFA500",
      processing: "#2196F3",
      shipped: "#9C27B0",
      delivered: "#4CAF50",
      cancelled: "#F44336",
    };
    return colorMap[status] || "#666";
  };

  const handleCancelOrder = async () => {
    if (!confirm(t("orders.confirmCancel"))) {
      return;
    }

    setCancelling(true);
    try {
      const query = guestToken
        ? `?guestToken=${encodeURIComponent(guestToken)}`
        : "";
      const response = await fetch(`/api/orders/${id}/cancel${query}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || t("orders.cancelError"));
        return;
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      alert(t("orders.cancelSuccess"));
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(t("orders.cancelError"));
    } finally {
      setCancelling(false);
    }
  };

  const sizeLabel = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      small: t("product.small"),
      medium: t("product.medium"),
      large: t("product.large"),
    };
    return sizeMap[size] || size;
  };

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#121416", direction: dir }} className="text-[#F2ECE2]">
      <section style={{ background: "linear-gradient(180deg, #14171a 0%, #101214 100%)", borderBottom: "1px solid rgba(201,166,107,0.25)" }} className="text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[#C9A66B]">Order Tracking</p>
          <h1 className="text-4xl font-bold">{t("orders.orderDetails")}</h1>
          <p className="mt-2 text-sm text-white/80">
            {t("orders.orderId")}: {order.id}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="mb-6 rounded-xl border border-white/10 bg-[#171a1d] p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#F2ECE2]">
                  {t("orders.orderStatus")}
                </h2>
                <span
                  className="px-4 py-2 rounded-full text-white font-semibold text-sm"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-sm text-white/70">
                {t("orders.orderDate")}: {new Date(order.createdAt).toLocaleDateString(language === "ar" ? "ar-SA-u-nu-latn" : "en-US")}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#171a1d] shadow-md">
              <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
                <h3 className="font-bold text-lg text-[#C9A66B]">
                  {t("orders.items")}
                </h3>
              </div>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => {
                  // محاولة الحصول على الصورة من المنتج إذا لم تكن موجودة في الطلب
                  const product = PRODUCTS.find(p => p.id === item.productId);
                  const itemImage = item.image || product?.image;
                  
                  return (
                  <div
                    key={item.id}
                    className={`p-6 flex gap-6 ${
                      index !== order.items.length - 1 ? "border-b" : ""
                    }`}
                    style={{ borderColor: "rgba(255,255,255,0.14)" }}
                  >
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={item.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: "#1b2024" }}
                      >
                        <div className="text-xs font-bold text-[#C9A66B]">
                          📦
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-bold text-[#F2ECE2]">
                      {item.name}
                    </h3>
                    <p className="text-sm text-white/70">
                      {t("cart.weight")}: {getProductSizeWeight(item.size, product?.sizes)}
                    </p>
                    <p className="text-sm text-white/70">
                      {t("product.quantity")}: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-white/70">{t("cart.pricePerUnit")}</p>
                    <p className="font-bold text-[#F2ECE2]">
                      {CURRENCY_SYMBOL}{item.price}
                    </p>
                    <p className="mt-2 text-sm text-white/70">{t("cart.total")}</p>
                    <p className="font-bold text-[#C9A66B]">
                      {CURRENCY_SYMBOL}{item.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              );})
              ) : (
                <div className="p-6 text-center text-white/60">
                  لا توجد عناصر في الطلب
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Shipping Info */}
          <div>
            <div className="mb-6 rounded-xl border border-white/10 bg-[#171a1d] p-6 shadow-md">
              <h3 className="mb-4 text-lg font-bold text-[#C9A66B]">
                {t("orders.shippingInfo")}
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-white/70">{t("cart.fullName")}:</span>
                  <p className="font-semibold text-[#F2ECE2]">{order.shippingName}</p>
                </div>
                <div>
                  <span className="text-white/70">{t("cart.phone")}:</span>
                  <p className="font-semibold text-[#F2ECE2]">{order.shippingPhone}</p>
                </div>
                <div>
                  <span className="text-white/70">{t("cart.city")}:</span>
                  <p className="font-semibold text-[#F2ECE2]">{order.shippingCity}</p>
                </div>
                <div>
                  <span className="text-white/70">{t("cart.address")}:</span>
                  <p className="font-semibold text-[#F2ECE2]">{order.shippingAddress}</p>
                </div>
                {order.shippingNotes && (
                  <div>
                    <span className="text-white/70">{t("cart.notes")}:</span>
                    <p className="font-semibold text-[#F2ECE2]">{order.shippingNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#171a1d] p-6 shadow-md">
              <h3 className="mb-4 text-lg font-bold text-[#C9A66B]">
                {t("cart.orderSummary")}
              </h3>
              <div className="mb-6 space-y-3 border-b pb-6" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">{t("cart.itemCount")}</span>
                  <span className="font-semibold text-[#F2ECE2]">
                    {order.items && order.items.length > 0 ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">{t("cart.goodsPrice")}</span>
                  <span className="font-semibold text-[#F2ECE2]">
                    {CURRENCY_SYMBOL}{order.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#F2ECE2]">
                  {t("cart.totalPrice")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#C9A66B]">
                    {CURRENCY_SYMBOL}{order.total.toFixed(2)}
                  </span>
                  <Link
                    href="/shipping-policy"
                    className="px-2 py-1 rounded-md text-xs font-semibold border"
                    style={{ borderColor: "rgba(201,166,107,0.55)", color: "#F2ECE2", backgroundColor: "#121416" }}
                  >
                    {language === "ar" ? "+ سعر التوصيل" : "+ Delivery Price"}
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/shop"
              className="block text-center px-6 py-3 rounded-lg font-semibold mt-2"
              style={{ backgroundColor: "#1f5d4e", color: "#F2ECE2", border: "1px solid rgba(201,166,107,0.45)" }}
            >
              {t("cart.continueShop")}
            </Link>

            {order.status === "pending" && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full text-center px-6 py-3 rounded-lg font-semibold mt-4 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  borderColor: "#F44336", 
                  color: "#ff7b7b",
                  backgroundColor: "rgba(244,67,54,0.14)"
                }}
              >
                {cancelling ? t("common.loading") : t("orders.cancelOrder")}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
