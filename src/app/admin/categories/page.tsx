"use client";

import { useState, useEffect } from "react";
import { COLORS } from "@/constants/store";

interface Category {
  id: string;
  name: string;
  nameAr: string;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", nameAr: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("فشل تحميل التصنيفات");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.nameAr.trim()) {
      setError("يرجى إدخال الاسم بالإنجليزية والعربية");
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("تم إضافة التصنيف بنجاح");
        setFormData({ name: "", nameAr: "" });
        setShowAddForm(false);
        fetchCategories();
      } else {
        const data = await response.json();
        setError(data.error || "فشل إضافة التصنيف");
      }
    } catch (error) {
      setError("حدث خطأ أثناء إضافة التصنيف");
    }
  };

  const handleUpdate = async (id: string) => {
    setError("");
    setSuccess("");

    const category = categories.find((c) => c.id === id);
    if (!category) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: category.name,
          nameAr: category.nameAr,
        }),
      });

      if (response.ok) {
        setSuccess("تم تحديث التصنيف بنجاح");
        setEditingId(null);
        fetchCategories();
      } else {
        const data = await response.json();
        setError(data.error || "فشل تحديث التصنيف");
      }
    } catch (error) {
      setError("حدث خطأ أثناء تحديث التصنيف");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("تم حذف التصنيف بنجاح");
        fetchCategories();
      } else {
        const data = await response.json();
        setError(data.error || "فشل حذف التصنيف");
      }
    } catch (error) {
      setError("حدث خطأ أثناء حذف التصنيف");
    }
  };

  const updateCategory = (id: string, field: "name" | "nameAr", value: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat))
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center" style={{ color: COLORS.primary }}>
          جاري التحميل...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" style={{ direction: "rtl" }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>
          إدارة التصنيفات
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: COLORS.primary }}
        >
          {showAddForm ? "إلغاء" : "+ إضافة تصنيف جديد"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {showAddForm && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border-2" style={{ borderColor: COLORS.border }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.primary }}>
            إضافة تصنيف جديد
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">الاسم بالإنجليزية:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: COLORS.border }}
                placeholder="e.g., Olive Oil"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">الاسم بالعربية:</label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: COLORS.border }}
                placeholder="مثال: زيت الزيتون"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: COLORS.primary }}
            >
              إضافة التصنيف
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead style={{ backgroundColor: COLORS.light }}>
            <tr>
              <th className="px-6 py-4 text-right font-bold" style={{ color: COLORS.primary }}>
                الاسم بالإنجليزية
              </th>
              <th className="px-6 py-4 text-right font-bold" style={{ color: COLORS.primary }}>
                الاسم بالعربية
              </th>
              <th className="px-6 py-4 text-right font-bold" style={{ color: COLORS.primary }}>
                تاريخ الإنشاء
              </th>
              <th className="px-6 py-4 text-center font-bold" style={{ color: COLORS.primary }}>
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  لا توجد تصنيفات. قم بإضافة تصنيف جديد!
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-b" style={{ borderColor: COLORS.border }}>
                  <td className="px-6 py-4">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) =>
                          updateCategory(category.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-1 border rounded"
                        style={{ borderColor: COLORS.border }}
                      />
                    ) : (
                      <span>{category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={category.nameAr}
                        onChange={(e) =>
                          updateCategory(category.id, "nameAr", e.target.value)
                        }
                        className="w-full px-3 py-1 border rounded"
                        style={{ borderColor: COLORS.border }}
                      />
                    ) : (
                      <span>{category.nameAr}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(category.createdAt).toLocaleDateString("ar")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {editingId === category.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(category.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              fetchCategories();
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingId(category.id)}
                            className="px-4 py-2 text-white rounded hover:opacity-90"
                            style={{ backgroundColor: COLORS.primary }}
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            حذف
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
