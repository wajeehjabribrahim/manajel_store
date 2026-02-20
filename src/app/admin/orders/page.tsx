"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import Link from "next/link";

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
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
  user?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export default function AdminOrdersPage() {
  const { t, dir } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders/all");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setError("فشل تحميل الطلبات");
      }
    } catch {
      setError("حدث خطأ أثناء تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await loadOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "فشل تحديث الحالة");
      }
    } catch {
      alert("حدث خطأ أثناء تحديث الحالة");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "قيد الانتظار",
      processing: "قيد المعالجة",
      shipped: "قيد الشحن",
      delivered: "تم التوصيل",
      cancelled: "ملغي",
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

  const filteredOrders = selectedStatus
    ? orders.filter((o) => o.status === selectedStatus)
    : orders;

  if (loading) {
    return (
      <div style={{ direction: dir }}>
        <p style={{ color: COLORS.primary }} className="text-lg font-semibold">
          جاري التحميل...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ direction: dir }}>
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div style={{ direction: dir }}>
      <h1 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-6">
        الطلبات الحالية
      </h1>

      {/* Filter by Status */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="font-semibold mb-3">تصفية حسب الحالة:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus(null)}
            className="px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: selectedStatus === null ? COLORS.primary : COLORS.light,
              color: selectedStatus === null ? "white" : COLORS.dark,
            }}
          >
            الكل ({orders.length})
          </button>
          {["pending", "processing", "shipped", "delivered", "cancelled"].map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className="px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: selectedStatus === status ? COLORS.primary : COLORS.light,
                  color: selectedStatus === status ? "white" : COLORS.dark,
                }}
              >
                {getStatusText(status)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">لا توجد طلبات</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div
                className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                style={{ borderBottom: `2px solid ${COLORS.border}` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 style={{ color: COLORS.primary }} className="font-bold text-lg">
                      طلب #{order.id.slice(0, 8)}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">المجموع</p>
                  <p style={{ color: COLORS.primary }} className="font-bold text-2xl">
                    {CURRENCY_SYMBOL}
                    {order.total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Info */}
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: COLORS.primary }}>
                    معلومات العميل
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>الاسم:</strong> {order.shippingName}
                    </p>
                    <p>
                      <strong>الهاتف:</strong> {order.shippingPhone}
                    </p>
                    {order.email && (
                      <p>
                        <strong>البريد:</strong> {order.email}
                      </p>
                    )}
                    <p>
                      <strong>المدينة:</strong> {order.shippingCity}
                    </p>
                    <p>
                      <strong>العنوان:</strong> {order.shippingAddress}
                    </p>
                    {order.shippingNotes && (
                      <p>
                        <strong>ملاحظات:</strong> {order.shippingNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: COLORS.primary }}>
                    المنتجات ({order.items.length})
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="text-sm p-2 rounded"
                        style={{ backgroundColor: COLORS.light }}
                      >
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-gray-600">
                          الحجم: {item.size} | الكمية: {item.quantity} | السعر:{" "}
                          {CURRENCY_SYMBOL}
                          {item.price}
                        </p>
                        <p className="font-semibold">
                          المجموع: {CURRENCY_SYMBOL}
                          {item.total.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex justify-between items-center">
                {/* Status Change Dropdown */}
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-sm">تغيير الحالة:</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updatingOrder === order.id}
                    className="px-3 py-2 rounded-lg border-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: COLORS.primary,
                      color: COLORS.dark,
                    }}
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="processing">قيد المعالجة</option>
                    <option value="shipped">قيد الشحن</option>
                    <option value="delivered">تم التسليم</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                  {updatingOrder === order.id && (
                    <span className="text-sm text-gray-600">جاري التحديث...</span>
                  )}
                </div>

                <Link
                  href={`/orders/${order.id}`}
                  className="px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  عرض التفاصيل
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
