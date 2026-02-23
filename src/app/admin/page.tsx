"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

export default function AdminDashboard() {
  const { dir } = useLanguage();
  const router = useRouter();

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
