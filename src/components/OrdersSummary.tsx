"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

interface OrdersStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  monthTotal: number;
  ordersThisMonth: number;
  averageOrderValue: number;
  ordersByDay: Array<{ date: string; count: number }>;
}

export default function OrdersSummary() {
  const { dir, language } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<OrdersStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/orders-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching orders stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const statItems = [
    {
      label: language === "ar" ? "إجمالي الطلبات" : "Total Orders",
      value: stats.totalOrders,
      icon: "📦",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: language === "ar" ? "الطلبات المعلقة" : "Pending Orders",
      value: stats.pendingOrders,
      icon: "⏳",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      label: language === "ar" ? "قيد الشحن" : "Shipped",
      value: stats.shippedOrders,
      icon: "🚚",
      color: "from-orange-500 to-orange-600",
    },
    {
      label: language === "ar" ? "مكتمل" : "Completed",
      value: stats.deliveredOrders,
      icon: "✅",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div style={{ direction: dir }} className="mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2
          style={{ color: COLORS.primary }}
          className="text-2xl font-bold mb-6"
        >
          {language === "ar" ? "ملخص الطلبات" : "Orders Summary"}
        </h2>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statItems.map((item, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${item.color} text-white rounded-lg p-6 shadow-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{item.icon}</span>
                <span className="text-sm opacity-75">
                  {language === "ar" ? "عدد الطلبات" : "Count"}
                </span>
              </div>
              <div className="text-3xl font-bold mb-2">{item.value}</div>
              <p className="text-white/90 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue and Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold mb-2 text-gray-700">
              {language === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}
            </h3>
            <p className="text-3xl font-bold" style={{ color: COLORS.primary }}>
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {language === "ar" ? "منذ البداية" : "All time"}
            </p>
          </div>

          {/* Month Revenue */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold mb-2 text-gray-700">
              {language === "ar" ? "إيرادات هذا الشهر" : "Month Revenue"}
            </h3>
            <p className="text-3xl font-bold" style={{ color: COLORS.primary }}>
              {formatCurrency(stats.monthTotal)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {language === "ar" ? "هذا الشهر" : "This month"}
            </p>
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
            <h3 className="font-semibold mb-2 text-gray-700">
              {language === "ar" ? "متوسط الطلب" : "Avg Order Value"}
            </h3>
            <p className="text-3xl font-bold" style={{ color: COLORS.primary }}>
              {formatCurrency(stats.averageOrderValue)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {language === "ar" ? "لكل طلب" : "Per order"}
            </p>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-gray-700">
              {language === "ar" ? "توزيع الحالات" : "Status Distribution"}
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: language === "ar" ? "معلق" : "Pending",
                  value: stats.pendingOrders,
                  color: "from-yellow-500 to-yellow-600",
                },
                {
                  label: language === "ar" ? "قيد المعالجة" : "Processing",
                  value: stats.processingOrders,
                  color: "from-purple-500 to-purple-600",
                },
                {
                  label: language === "ar" ? "قيد الشحن" : "Shipped",
                  value: stats.shippedOrders,
                  color: "from-orange-500 to-orange-600",
                },
                {
                  label: language === "ar" ? "تم التوصيل" : "Delivered",
                  value: stats.deliveredOrders,
                  color: "from-green-500 to-green-600",
                },
                {
                  label: language === "ar" ? "ملغى" : "Cancelled",
                  value: stats.cancelledOrders,
                  color: "from-red-500 to-red-600",
                },
              ].map((status, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">{status.label}</span>
                    <span className="font-bold">{status.value}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${status.color}`}
                      style={{
                        width: `${(status.value / stats.totalOrders) * 100 || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-gray-700">
              {language === "ar" ? "إحصائيات سريعة" : "Quick Stats"}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {language === "ar" ? "طلبات هذا الشهر" : "Orders This Month"}
                </span>
                <span className="font-bold text-lg" style={{ color: COLORS.primary }}>
                  {stats.ordersThisMonth}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {language === "ar" ? "نسبة التوصيل" : "Delivery Rate"}
                </span>
                <span className="font-bold text-lg text-green-600">
                  {stats.totalOrders > 0
                    ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {language === "ar" ? "الطلبات المعلقة" : "Pending Orders"}
                </span>
                <span className="font-bold text-lg text-yellow-600">
                  {stats.pendingOrders}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Orders Chart */}
        {stats.ordersByDay && stats.ordersByDay.length > 0 && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-700">
              {language === "ar" ? "الطلبات اليومية (آخر 7 أيام)" : "Daily Orders (Last 7 Days)"}
            </h3>
            <div className="space-y-4">
              {/* Chart */}
              <div className="flex items-end justify-between gap-2 h-40 bg-gray-50 p-4 rounded-lg">
                {stats.ordersByDay.map((day, index) => {
                  const maxCount = Math.max(...stats.ordersByDay.map((d) => d.count), 1);
                  const height = (day.count / maxCount) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full">
                      <div className="w-full flex justify-end h-full">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-3/4 transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer group relative"
                          style={{ height: `${height || 5}%` }}
                          title={`${day.date}: ${day.count} ${
                            language === "ar" ? "طلب" : "order"
                          }s`}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.count}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 text-center whitespace-nowrap">
                        {new Date(day.date).toLocaleDateString(
                          language === "ar" ? "ar-SA" : "en-US",
                          { month: "2-digit", day: "2-digit" }
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-right">{language === "ar" ? "التاريخ" : "Date"}</th>
                      <th className="px-4 py-2 text-center">{language === "ar" ? "عدد الطلبات" : "Orders"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ordersByDay.map((day, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">
                          {new Date(day.date).toLocaleDateString(
                            language === "ar" ? "ar-SA" : "en-US",
                            { weekday: "short", month: "short", day: "numeric" }
                          )}
                        </td>
                        <td className="px-4 py-2 text-center font-semibold" style={{ color: COLORS.primary }}>
                          {day.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
