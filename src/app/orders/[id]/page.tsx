"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { PRODUCTS } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";

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
  const { t, dir } = useLanguage();
  const { id } = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
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
  }, [id, t]);

  if (loading) {
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

  if (error || !order) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: COLORS.light }}>
        <section style={{ backgroundColor: COLORS.primary }} className="text-white py-12 px-4">
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
              style={{ backgroundColor: COLORS.primary, color: "white" }}
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
      const response = await fetch(`/api/orders/${id}/cancel`, {
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
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: COLORS.light, direction: dir }}>
      <section style={{ backgroundColor: COLORS.primary }} className="text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">{t("orders.orderDetails")}</h1>
          <p className="mt-2 text-sm opacity-90">
            {t("orders.orderId")}: {order.id}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: COLORS.primary }} className="text-xl font-bold">
                  {t("orders.orderStatus")}
                </h2>
                <span
                  className="px-4 py-2 rounded-full text-white font-semibold text-sm"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-gray-900 text-sm">
                {t("orders.orderDate")}: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b" style={{ borderColor: COLORS.border }}>
                <h3 style={{ color: COLORS.primary }} className="font-bold text-lg">
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
                    style={{ borderColor: COLORS.border }}
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
                        style={{ backgroundColor: COLORS.accent }}
                      >
                        <div style={{ color: COLORS.primary }} className="text-xs font-bold">
                          📦
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 style={{ color: COLORS.primary }} className="font-bold text-lg mb-1">
                      {item.name}
                    </h3>
                    <p className="text-gray-900 text-sm">
                      {t("cart.size")}: {sizeLabel(item.size)}
                    </p>
                    <p className="text-gray-900 text-sm">
                      {t("product.quantity")}: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-900 text-sm">{t("cart.pricePerUnit")}</p>
                    <p style={{ color: COLORS.primary }} className="font-bold">
                      {CURRENCY_SYMBOL}{item.price}
                    </p>
                    <p className="text-gray-900 text-sm mt-2">{t("cart.total")}</p>
                    <p style={{ color: COLORS.secondary }} className="font-bold">
                      {CURRENCY_SYMBOL}{item.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              );})
              ) : (
                <div className="p-6 text-center text-gray-500">
                  لا توجد عناصر في الطلب
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Shipping Info */}
          <div>
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <h3 style={{ color: COLORS.primary }} className="font-bold text-lg mb-4">
                {t("orders.shippingInfo")}
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-900">{t("cart.fullName")}:</span>
                  <p className="font-semibold">{order.shippingName}</p>
                </div>
                <div>
                  <span className="text-gray-900">{t("cart.phone")}:</span>
                  <p className="font-semibold">{order.shippingPhone}</p>
                </div>
                <div>
                  <span className="text-gray-900">{t("cart.city")}:</span>
                  <p className="font-semibold">{order.shippingCity}</p>
                </div>
                <div>
                  <span className="text-gray-900">{t("cart.address")}:</span>
                  <p className="font-semibold">{order.shippingAddress}</p>
                </div>
                {order.shippingNotes && (
                  <div>
                    <span className="text-gray-900">{t("cart.notes")}:</span>
                    <p className="font-semibold">{order.shippingNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 style={{ color: COLORS.primary }} className="font-bold text-lg mb-4">
                {t("cart.orderSummary")}
              </h3>
              <div className="space-y-3 mb-6 pb-6 border-b" style={{ borderColor: COLORS.border }}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">{t("cart.itemCount")}</span>
                  <span className="font-semibold">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">{t("cart.goodsPrice")}</span>
                  <span className="font-semibold">
                    {CURRENCY_SYMBOL}{order.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: COLORS.primary }} className="font-bold text-lg">
                  {t("cart.totalPrice")}
                </span>
                <span style={{ color: COLORS.primary }} className="font-bold text-2xl">
                  {CURRENCY_SYMBOL}{order.total.toFixed(2)}
                </span>
              </div>
            </div>

            <Link
              href="/shop"
              className="block text-center px-6 py-3 rounded-lg font-semibold mt-6"
              style={{ backgroundColor: COLORS.primary, color: "white" }}
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
                  color: "#F44336",
                  backgroundColor: "white"
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
