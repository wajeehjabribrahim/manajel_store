"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/constants/products";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";

interface SizeState {
  enabled: boolean;
  weight: string;
  price: string;
}

export default function AdminAddProductPage() {
  const { t, dir } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]?.id || "olive-oil");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [featured, setFeatured] = useState(false);
  const [inStock, setInStock] = useState(true);
  const [sizes, setSizes] = useState<Record<"small" | "medium" | "large", SizeState>>({
    small: { enabled: false, weight: "", price: "" },
    medium: { enabled: true, weight: "", price: "" },
    large: { enabled: false, weight: "", price: "" },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const buildSizesPayload = () => {
    const payload: Record<string, { weight: string; price: number }> = {};
    (Object.keys(sizes) as Array<"small" | "medium" | "large">).forEach((key) => {
      const size = sizes[key];
      const numericPrice = Number(size.price);
      if (size.enabled && Number.isFinite(numericPrice) && numericPrice > 0) {
        payload[key] = {
          weight: size.weight.trim(),
          price: numericPrice,
        };
      }
    });
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !description.trim() || !category) {
      setError("الرجاء تعبئة الاسم والوصف والتصنيف");
      return;
    }

    setSaving(true);
    try {
      let imageData = "";
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const uploadRes = await fetch("/api/uploads/product-image", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json().catch(() => ({}));
          setError(uploadError?.error || "فشل رفع الصورة");
          setSaving(false);
          return;
        }

        const uploadJson = await uploadRes.json();
        imageData = typeof uploadJson?.imageData === "string" ? uploadJson.imageData : "";
      }

      const sizesPayload = buildSizesPayload();
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: Number(price) || 0,
        imageData,
        sizes: Object.keys(sizesPayload).length ? sizesPayload : undefined,
        featured,
        inStock,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "حدث خطأ أثناء الحفظ");
        setSaving(false);
        return;
      }

      setSuccess("تم حفظ المنتج بنجاح");
      setName("");
      setDescription("");
      setPrice("");
      setImageFile(null);
      setImagePreview(null);
      setFeatured(false);
      setInStock(true);
      setSizes({
        small: { enabled: false, weight: "", price: "" },
        medium: { enabled: true, weight: "", price: "" },
        large: { enabled: false, weight: "", price: "" },
      });
    } catch {
      setError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const updateSize = (key: "small" | "medium" | "large", patch: Partial<SizeState>) => {
    setSizes((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  return (
    <div style={{ direction: dir }}>
      <h1 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-6">
        {t("admin.addProduct") === "admin.addProduct" ? "إضافة منتج" : t("admin.addProduct")}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">اسم المنتج</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="مثال: زيت زيتون بكر"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">التصنيف</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">وصف المنتج</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="اكتب وصفاً مختصراً للمنتج"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">السعر الأساسي</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">يُستخدم عند عدم وجود أحجام</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">صورة المنتج</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {imagePreview && (
          <div className="w-40 h-40 rounded-lg overflow-hidden border">
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
          </div>
        )}

        <div>
          <h3 style={{ color: COLORS.primary }} className="font-bold text-lg mb-3">
            الأحجام (اختياري)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(sizes) as Array<"small" | "medium" | "large">).map((key) => (
              <div key={key} className="border rounded-lg p-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={sizes[key].enabled}
                    onChange={(e) => updateSize(key, { enabled: e.target.checked })}
                  />
                  <span className="font-semibold">
                    {t(`product.${key}`) === `product.${key}`
                      ? key
                      : t(`product.${key}`)}
                  </span>
                </label>
                <input
                  type="text"
                  value={sizes[key].weight}
                  onChange={(e) => updateSize(key, { weight: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                  placeholder="الوزن (مثال 250g)"
                  disabled={!sizes[key].enabled}
                />
                <input
                  type="number"
                  value={sizes[key].price}
                  onChange={(e) => updateSize(key, { price: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="السعر"
                  min="0"
                  step="0.01"
                  disabled={!sizes[key].enabled}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <span>منتج مميز</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            <span>متوفر حالياً</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          style={{ backgroundColor: COLORS.primary }}
        >
          {saving ? "جاري الحفظ..." : "حفظ المنتج"}
        </button>
      </form>
    </div>
  );
}
