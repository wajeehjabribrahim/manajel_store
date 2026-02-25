"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

interface MonthData {
  total: number;
  count: number;
}

interface YearData {
  year: number;
  total: number;
  count: number;
  months: {
    [month: number]: MonthData;
  };
}

interface YearlyStats {
  years: YearData[];
}

export default function OrdersYearlyPage() {
  const { dir, language } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/orders-yearly");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        if (data.years.length > 0) {
          setExpandedYear(data.years[0].year);
        }
      }
    } catch (error) {
      console.error("Error fetching yearly stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = language === "ar"
      ? [
          "يناير",
          "فبراير",
          "مارس",
          "أبريل",
          "مايو",
          "يونيو",
          "يوليو",
          "أغسطس",
          "سبتمبر",
          "أكتوبر",
          "نوفمبر",
          "ديسمبر",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div style={{ direction: dir }} className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: dir }} className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              style={{ color: COLORS.primary }}
              className="text-4xl font-bold mb-2"
            >
              {language === "ar" ? "الطلبات حسب السنة" : "Orders by Year"}
            </h1>
            <p className="text-gray-600">
              {language === "ar"
                ? "عرض تفصيلي للطلبات والإيرادات حسب السنة والشهر"
                : "Detailed view of orders and revenue by year and month"}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
          >
            {language === "ar" ? "رجوع" : "Back"}
          </button>
        </div>

        {/* Years List */}
        <div className="space-y-4">
          {!stats || stats.years.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              {language === "ar"
                ? "لا توجد طلبات مسجلة"
                : "No orders found"}
            </div>
          ) : (
            stats.years.map((year) => (
              <div key={year.year} className="bg-white rounded-lg shadow">
                {/* Year Header */}
                <button
                  onClick={() =>
                    setExpandedYear(
                      expandedYear === year.year ? null : year.year
                    )
                  }
                  className="w-full px-6 py-4 text-right hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className={`transform transition-transform ${
                          expandedYear === year.year ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                      <div className="text-right">
                        <h3 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                          {year.year}
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            {language === "ar" ? "إجمالي الطلبات" : "Total Orders"}
                          </p>
                          <p className="text-2xl font-bold">{year.count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {language === "ar" ? "الإيرادات" : "Revenue"}
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(year.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Months Details */}
                {expandedYear === year.year && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const monthData = year.months[month];
                        const hasData = monthData && monthData.count > 0;

                        return (
                          <div
                            key={month}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              hasData
                                ? "border-blue-200 bg-blue-50"
                                : "border-gray-200 bg-white opacity-50"
                            }`}
                          >
                            <h4 className="font-semibold text-gray-800 mb-2">
                              {getMonthName(month)}
                            </h4>
                            {hasData ? (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600 text-sm">
                                    {language === "ar"
                                      ? "الطلبات:"
                                      : "Orders:"}
                                  </span>
                                  <span className="font-bold" style={{ color: COLORS.primary }}>
                                    {monthData.count}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600 text-sm">
                                    {language === "ar"
                                      ? "الإيرادات:"
                                      : "Revenue:"}
                                  </span>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(monthData.total)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                  <span className="text-gray-600 text-sm">
                                    {language === "ar"
                                      ? "المتوسط:"
                                      : "Average:"}
                                  </span>
                                  <span className="font-bold text-orange-600">
                                    {formatCurrency(monthData.total / monthData.count)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">
                                {language === "ar"
                                  ? "لا توجد طلبات"
                                  : "No orders"}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
