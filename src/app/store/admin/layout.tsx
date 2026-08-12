"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";
import { useSession } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, dir } = useLanguage();
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12" style={{ direction: dir }}>
        <p style={{ color: COLORS.primary }} className="text-lg tajawal-regular">
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
            {t("admin.unauthorized")}
          </h2>
          <p className="text-gray-600 mb-4">{t("admin.adminOnly")}</p>
          <Link
            href="/store"
            className="inline-block px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: COLORS.primary }}
          >
            {t("admin.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 [&_.text-gray-400]:text-gray-600 [&_.text-gray-500]:text-gray-700 [&_.text-gray-600]:text-gray-800"
      style={{ direction: dir }}
    >
      <aside className="w-full lg:w-64 bg-white rounded-lg shadow-md p-4 h-fit">
        <h2 style={{ color: COLORS.primary }} className="text-xl font-bold mb-4">
          {t("admin.title")}
        </h2>
        <nav className="space-y-2">
          <Link
            href="/store/admin/products"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100"
            style={{ color: COLORS.primary }}
          >
            {t("admin.addProduct")}
          </Link>
          <Link
            href="/store/admin/categories"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100"
            style={{ color: COLORS.primary }}
          >
            {t("admin.categories")}
          </Link>
          <Link
            href="/store/admin/orders"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100"
            style={{ color: COLORS.primary }}
          >
            {t("admin.orders")}
          </Link>
        </nav>
      </aside>
      <section className="flex-1">{children}</section>
    </div>
  );
}
