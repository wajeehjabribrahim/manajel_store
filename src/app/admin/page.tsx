"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

export default function AdminDashboard() {
  const { dir, language } = useLanguage();
  const router = useRouter();
  const { status, data: session } = useSession();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "admin") {
        router.push("/");
        return;
      }
      setAuthorized(true);
    }
  }, [status, session, router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: COLORS.primary }} className="text-lg tajawal-regular">
          جاري التحقق من الصلاحيات...
        </p>
      </div>
    );
  }

  const dashboardItems = [
    {
      title: "إضافة منتج",
      description: "أضف منتجات جديدة إلى المتجر",
      icon: "➕",
      href: "/admin/products",
      color: "from-green-500 to-green-600",
    },
    {
      title: "إدارة الطلبات",
      description: "عرض وإدارة الطلبات الحالية",
      icon: "📦",
      href: "/admin/orders",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "إدارة التصنيفات",
      description: "إضافة وتعديل تصنيفات المنتجات",
      icon: "🏷️",
      href: "/admin/categories",
      color: "from-teal-500 to-teal-600",
    },
    {
      title: "ترتيب المنتجات",
      description: "إدارة ترتيب عرض المنتجات",
      icon: "🔄",
      href: "/admin/products/manage",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "الرسائل المستقبلة",
      description: "اطلع على رسائل العملاء",
      icon: "💬",
      href: "/admin/messages",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "حسابات المستخدمين",
      description: "عرض وإدارة جميع حسابات المستخدمين المسجلة",
      icon: "👥",
      href: "/admin/users",
      color: "from-pink-500 to-pink-600",
    },
    {
      title: "الطلبات حسب السنة",
      description: "عرض الطلبات والإيرادات حسب السنة والشهر",
      icon: "📊",
      href: "/admin/orders-yearly",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      title: "الإيميلات المشتركة معنا",
      description: "عرض جميع الإيميلات المسجلة في الاشتراك",
      icon: "📧",
      href: "/admin/subscribers",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "طلبات الإشعار عند التوفر",
      description: "عرض أرقام العملاء الذين طلبوا إشعارهم عند توفر منتج",
      icon: "🔔",
      href: "/admin/notifications",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      title: "فيدباك الطلبات",
      description: "عرض تقييمات وملاحظات العملاء بعد تسليم الطلب",
      icon: "⭐",
      href: "/admin/feedback",
      color: "from-rose-500 to-rose-600",
    },
  ];

  return (
    <div style={{ direction: dir }} className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1
            style={{ color: COLORS.primary }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            لوحة التحكم
          </h1>
          <p className="text-gray-600 text-lg">
            إدارة المتجر والمنتجات والطلبات
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Users Summary Card */}
          <button
            onClick={() => router.push("/admin/users-summary")}
            className="w-full text-right"
          >
            <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full">
              <span className="text-5xl">👥</span>
              <div className="text-right flex-1">
                <h3 className="text-2xl font-bold mb-1">
                  {language === "ar"
                    ? "ملخص الحسابات"
                    : "Users Summary"}
                </h3>
                <p className="text-white/90">
                  {language === "ar"
                    ? "عرض إحصائيات المستخدمين المسجلين"
                    : "View user statistics"}
                </p>
              </div>
            </div>
          </button>

          {/* Orders Summary Card */}
          <button
            onClick={() => router.push("/admin/orders-summary")}
            className="w-full text-right"
          >
            <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full">
              <span className="text-5xl">📦</span>
              <div className="text-right flex-1">
                <h3 className="text-2xl font-bold mb-1">
                  {language === "ar"
                    ? "ملخص الطلبات"
                    : "Orders Summary"}
                </h3>
                <p className="text-white/90">
                  {language === "ar"
                    ? "عرض إحصائيات الطلبات والإيرادات"
                    : "View orders and revenue"}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Management Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.href)}
              className={`bg-gradient-to-br ${item.color} text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer text-right`}
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
              <p className="text-white/90">{item.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
          >
            رجوع للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
