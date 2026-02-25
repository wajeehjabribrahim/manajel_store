"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  password: string | null;
  role: string;
  createdAt: string;
  _count: {
    orders: number;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function UsersPage() {
  const { dir, language } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search,
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return;

    try {
      setResetLoading(true);
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resetUserId,
          newPassword: newPassword,
        }),
      });

      if (response.ok) {
        alert(
          language === "ar"
            ? "تم تعيين كلمة السر بنجاح!"
            : "Password reset successfully!"
        );
        setResetModalOpen(false);
        setNewPassword("");
        setResetUserId(null);
        fetchUsers();
      } else {
        alert(
          language === "ar"
            ? "حدث خطأ في تعيين كلمة السر"
            : "Error resetting password"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert(language === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setResetLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US");
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ direction: dir }} className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: dir }} className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              style={{ color: COLORS.primary }}
              className="text-4xl font-bold mb-2"
            >
              {language === "ar" ? "حسابات المستخدمين" : "User Accounts"}
            </h1>
            <p className="text-gray-600">
              {language === "ar"
                ? `إجمالي المستخدمين: ${pagination?.total || 0}`
                : `Total Users: ${pagination?.total || 0}`}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
          >
            {language === "ar" ? "رجوع" : "Back"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder={
              language === "ar"
                ? "ابحث عن اسم أو بريد إلكتروني أو رقم هاتف..."
                : "Search by name, email, or phone..."
            }
            value={search}
            onChange={handleSearch}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {language === "ar"
                ? "لا توجد حسابات مسجلة"
                : "No users found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: COLORS.primary + "15" }}>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      {language === "ar" ? "الاسم" : "Name"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      {language === "ar" ? "البريد الإلكتروني" : "Email"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      {language === "ar" ? "الهاتف" : "Phone"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      {language === "ar" ? "المدينة" : "City"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      {language === "ar" ? "كلمة السر" : "Password"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      {language === "ar" ? "الطلبات" : "Orders"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      {language === "ar" ? "النوع" : "Role"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">
                      {language === "ar" ? "تاريخ التسجيل" : "Registered"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-4 text-gray-800">
                        {user.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {user.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.phone || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.city || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {user.password ? (
                            <>
                              <input
                                type="text"
                                value={
                                  showPassword === user.id
                                    ? user.password
                                    : "•".repeat(20)
                                }
                                readOnly
                                className="text-xs font-mono bg-gray-100 rounded px-2 py-1 w-32 truncate"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    user.password || ""
                                  );
                                }}
                                className="px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded text-xs whitespace-nowrap"
                                title={
                                  language === "ar"
                                    ? "نسخ كلمة السر"
                                    : "Copy Password"
                                }
                              >
                                {language === "ar" ? "نسخ" : "Copy"}
                              </button>
                              <button
                                onClick={() =>
                                  setShowPassword(
                                    showPassword === user.id ? null : user.id
                                  )
                                }
                                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs whitespace-nowrap"
                              >
                                {showPassword === user.id
                                  ? language === "ar"
                                    ? "إخفاء"
                                    : "Hide"
                                  : language === "ar"
                                  ? "إظهار"
                                  : "Show"}
                              </button>
                              <button
                                onClick={() => {
                                  setResetUserId(user.id);
                                  setResetModalOpen(true);
                                }}
                                className="px-2 py-1 bg-red-200 hover:bg-red-300 rounded text-xs whitespace-nowrap"
                                title={
                                  language === "ar"
                                    ? "إعادة تعيين كلمة السر"
                                    : "Reset Password"
                                }
                              >
                                {language === "ar" ? "تعيين" : "Reset"}
                              </button>
                            </>
                          ) : (
                            <span className="text-yellow-600 text-sm">
                              {language === "ar" ? "غير معرّف" : "Not Set"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {user._count.orders}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role === "admin"
                            ? language === "ar"
                              ? "مسؤول"
                              : "Admin"
                            : language === "ar"
                            ? "مستخدم"
                            : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-lg transition-colors"
            >
              {language === "ar" ? "السابق" : "Previous"}
            </button>

            <div className="flex gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === currentPage
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.pages, currentPage + 1))
              }
              disabled={currentPage === pagination.pages}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-lg transition-colors"
            >
              {language === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            style={{ direction: dir }}
            className="bg-white rounded-lg shadow-xl p-6 w-96"
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: COLORS.primary }}
            >
              {language === "ar"
                ? "إعادة تعيين كلمة السر"
                : "Reset Password"}
            </h2>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                {language === "ar" ? "كلمة السر الجديدة:" : "New Password:"}
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={
                  language === "ar"
                    ? "أدخل كلمة السر الجديدة"
                    : "Enter new password"
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResetPassword}
                disabled={resetLoading || !newPassword}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
              >
                {resetLoading
                  ? language === "ar"
                    ? "جاري..."
                    : "Processing..."
                  : language === "ar"
                  ? "تعيين"
                  : "Reset"}
              </button>
              <button
                onClick={() => {
                  setResetModalOpen(false);
                  setNewPassword("");
                  setResetUserId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
