"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/constants/store";

interface Notification {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  whatsapp: string;
  notified: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "notified">("all");

  useEffect(() => {
    if (session && (session.user as any)?.role !== "admin") {
      router.push("/");
    }
  }, [session, router]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleNotified = async (id: string, current: boolean) => {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notified: !current }),
    });
    load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("حذف هذا الطلب؟")) return;
    await fetch("/api/admin/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const filtered = notifications.filter((n) => {
    if (filter === "pending") return !n.notified;
    if (filter === "notified") return n.notified;
    return true;
  });

  const pendingCount = notifications.filter((n) => !n.notified).length;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>
              🔔 طلبات الإشعار عند التوفر
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              العملاء الذين طلبوا إشعارهم عند توفر منتج
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 rounded-lg border-2 font-semibold text-sm hover:bg-gray-100"
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
          >
            ← لوحة التحكم
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
            <div className="text-3xl font-bold" style={{ color: COLORS.primary }}>{notifications.length}</div>
            <div className="text-sm text-gray-500 mt-1">إجمالي الطلبات</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
            <div className="text-3xl font-bold text-orange-500">{pendingCount}</div>
            <div className="text-sm text-gray-500 mt-1">بانتظار الإشعار</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
            <div className="text-3xl font-bold text-green-500">{notifications.length - pendingCount}</div>
            <div className="text-sm text-gray-500 mt-1">تم إشعارهم</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "all", label: "الكل" },
            { key: "pending", label: "⏳ بانتظار الإشعار" },
            { key: "notified", label: "✅ تم الإشعار" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: filter === f.key ? COLORS.primary : "white",
                color: filter === f.key ? "white" : COLORS.primary,
                border: `2px solid ${COLORS.primary}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border">
            لا توجد طلبات
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: COLORS.accent }}>
                  <th className="text-right px-4 py-3 font-bold" style={{ color: COLORS.primary }}>المنتج</th>
                  <th className="text-right px-4 py-3 font-bold" style={{ color: COLORS.primary }}>رقم الواتساب</th>
                  <th className="text-right px-4 py-3 font-bold" style={{ color: COLORS.primary }}>التاريخ</th>
                  <th className="text-right px-4 py-3 font-bold" style={{ color: COLORS.primary }}>الحالة</th>
                  <th className="text-right px-4 py-3 font-bold" style={{ color: COLORS.primary }}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n, i) => (
                  <tr key={n.id} className={`border-b last:border-0 hover:bg-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{n.productName || "—"}</div>
                      <a
                        href={`/products/${n.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline mt-0.5 inline-block"
                        style={{ color: COLORS.primary }}
                      >
                        🔗 عرض المنتج
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/${n.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-green-600 hover:underline"
                        dir="ltr"
                      >
                        {n.whatsapp}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(n.createdAt).toLocaleDateString("ar-SA-u-nu-latn", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {n.notified ? (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✅ تم الإشعار</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600">⏳ بانتظار</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleNotified(n.id, n.notified)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: n.notified ? "#f59e0b" : "#22c55e" }}
                        >
                          {n.notified ? "↩ إلغاء" : "✔ تم"}
                        </button>
                        <button
                          onClick={() => deleteItem(n.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
