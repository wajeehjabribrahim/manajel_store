"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";
import { useSession } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, dir } = useLanguage();
  const { data: session, status } = useSession();
  const titleText = t("admin.title");
  const addProductText = t("admin.addProduct");
  const ordersText = t("admin.orders");
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12" style={{ direction: dir }}>
        <p style={{ color: COLORS.primary }} className="text-lg font-semibold">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12" style={{ direction: dir }}>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold mb-2">
            غير مصرح
          </h2>
          <p className="text-gray-600 mb-4">هذه الصفحة مخصصة للأدمن فقط.</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: COLORS.primary }}
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6"
      style={{ direction: dir }}
    >
      <aside className="w-full lg:w-64 bg-white rounded-lg shadow-md p-4 h-fit">
        <h2 style={{ color: COLORS.primary }} className="text-xl font-bold mb-4">
          {titleText === "admin.title" ? "لوحة التحكم" : titleText}
        </h2>
        <nav className="space-y-2">
          <Link
            href="/admin/products"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100"
            style={{ color: COLORS.primary }}
          >
            {addProductText === "admin.addProduct" ? "إضافة منتج" : addProductText}
          </Link>
          <Link
            href="/admin/orders"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100"
            style={{ color: COLORS.primary }}
          >
            {ordersText === "admin.orders" ? "الطلبات الحالية" : ordersText}
          </Link>
        </nav>
      </aside>
      <section className="flex-1">{children}</section>
    </div>
  );
}
