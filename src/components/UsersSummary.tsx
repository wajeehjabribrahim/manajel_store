"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

interface UserStats {
  totalUsers: number;
  usersThisMonth: number;
  activeUsers: number;
  usersLast7Days: number;
  adminCount: number;
  regularUsers: number;
  userGrowth: Array<{ date: string; count: number }>;
}

export default function UsersSummary() {
  const { dir, language } = useLanguage();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/users-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
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

  const statItems = [
    {
      label: language === "ar" ? "إجمالي المستخدمين" : "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: language === "ar" ? "مستخدمون نشطون" : "Active Users",
      value: stats.activeUsers,
      icon: "✅",
      color: "from-green-500 to-green-600",
    },
    {
      label: language === "ar" ? "مستخدمون هذا الشهر" : "Users This Month",
      value: stats.usersThisMonth,
      icon: "📅",
      color: "from-purple-500 to-purple-600",
    },
    {
      label: language === "ar" ? "آخر 7 أيام" : "Last 7 Days",
      value: stats.usersLast7Days,
      icon: "📈",
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div style={{ direction: dir }} className="mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2
          style={{ color: COLORS.primary }}
          className="text-2xl font-bold mb-6"
        >
          {language === "ar" ? "ملخص الحسابات المسجلة" : "Registered Accounts Summary"}
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
                  {language === "ar" ? "عدد الحسابات" : "Count"}
                </span>
              </div>
              <div className="text-3xl font-bold mb-2">{item.value}</div>
              <p className="text-white/90 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Secondary Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin vs Regular Users */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-gray-700">
              {language === "ar" ? "توزيع المستخدمين" : "User Distribution"}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {language === "ar" ? "المسؤولون" : "Administrators"}
                </span>
                <span className="font-bold text-lg" style={{ color: COLORS.primary }}>
                  {stats.adminCount}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{
                    width: `${(stats.adminCount / stats.totalUsers) * 100 || 0}%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600">
                  {language === "ar" ? "المستخدمون العاديون" : "Regular Users"}
                </span>
                <span className="font-bold text-lg" style={{ color: COLORS.primary }}>
                  {stats.regularUsers}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600"
                  style={{
                    width: `${(stats.regularUsers / stats.totalUsers) * 100 || 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Growth Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-gray-700">
              {language === "ar" ? "إحصائيات إضافية" : "Additional Statistics"}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {language === "ar" ? "نسبة المستخدمين النشطين" : "Active User Rate"}
                </span>
                <span className="font-bold text-lg text-green-600">
                  {stats.totalUsers > 0
                    ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {language === "ar" ? "متوسط المستخدمين الجدد يومياً" : "Avg. New Users/Day"}
                </span>
                <span className="font-bold text-lg" style={{ color: COLORS.primary }}>
                  {stats.userGrowth.length > 0
                    ? (
                        stats.userGrowth.reduce((sum, day) => sum + day.count, 0) /
                        stats.userGrowth.length
                      ).toFixed(1)
                    : 0}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {language === "ar" ? "نمو هذا الشهر" : "Month Growth"}
                </span>
                <span className="font-bold text-lg text-blue-600">
                  {stats.usersThisMonth}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Growth Chart */}
        {stats.userGrowth && stats.userGrowth.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-700">
              {language === "ar" ? "نمو المستخدمين (آخر 7 أيام)" : "User Growth (Last 7 Days)"}
            </h3>
            <div className="space-y-4">
              {/* Chart */}
              <div className="flex items-end justify-between gap-2 h-40 bg-gray-50 p-4 rounded-lg">
                {stats.userGrowth.map((day, index) => {
                  const maxCount = Math.max(...stats.userGrowth.map((d) => d.count), 1);
                  const height = (day.count / maxCount) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full">
                      <div className="w-full flex justify-end h-full">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-3/4 transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer group relative"
                          style={{ height: `${height || 5}%` }}
                          title={`${day.date}: ${day.count} ${
                            language === "ar" ? "مستخدم" : "user"
                          }s`}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.count}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 text-center whitespace-nowrap">
                        {new Date(day.date).toLocaleDateString(
                          language === "ar" ? "ar-SA-u-nu-latn" : "en-US",
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
                      <th className="px-4 py-2 text-center">{language === "ar" ? "مستخدمون جدد" : "New Users"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.userGrowth.map((day, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">
                          {new Date(day.date).toLocaleDateString(
                            language === "ar" ? "ar-SA-u-nu-latn" : "en-US",
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
