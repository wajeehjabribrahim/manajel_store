"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { PRODUCTS } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  total: number;
  image?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/orders");
      return;
    }

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/user");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: COLORS.light, direction: dir }}>
      <section style={{ backgroundColor: COLORS.primary }} className="text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">{t("orders.myOrders")}</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        {orders.length === 0 ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold mb-4">
              {t("orders.noOrders")}
            </h2>
            <p className="text-gray-900 mb-8">{t("orders.noOrdersDesc")}</p>
            <Link
              href="/shop"
              className="inline-block px-8 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: COLORS.primary, color: "white" }}
            >
              {t("cart.continueShop")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div
                  className="p-6 border-b flex justify-between items-center"
                  style={{ borderColor: COLORS.border }}
                >
                  <div>
                    <h3 style={{ color: COLORS.primary }} className="font-bold text-lg">
                      {t("orders.order")} #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-gray-900 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="px-4 py-2 rounded-full text-white font-semibold text-sm"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-4">
                    {order.items.map((item) => {
                      const product = PRODUCTS.find(p => p.id === (item as any).productId);
                      const itemImage = item.image || product?.image;
                      
                      return (
                      <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                        {itemImage && (
                          <img
                            src={itemImage}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                            style={{ border: `2px solid ${COLORS.border}` }}
                          />
                        )}
                        <div className="flex-1 flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                          </div>
                          <span className="font-semibold">{CURRENCY_SYMBOL}{item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    );})}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: COLORS.border }}>
                    <div>
                      <span className="text-gray-900 text-sm">{t("cart.totalPrice")}:</span>
                      <span style={{ color: COLORS.primary }} className="font-bold text-xl ml-2">
                        {CURRENCY_SYMBOL}{order.total.toFixed(2)}
                      </span>
                    </div>
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-6 py-2 rounded-lg font-semibold"
                      style={{ backgroundColor: COLORS.primary, color: "white" }}
                    >
                      {t("orders.viewDetails")}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
