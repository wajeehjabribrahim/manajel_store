"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CATEGORIES } from "@/constants/products";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
  id: string;
  name: string;
  nameAr: string;
}

interface SizeState {
  enabled: boolean;
  weight: string;
  price: string;
}

const getCategoryTranslationKey = (categoryId: string): string => {
  const keyMap: { [key: string]: string } = {
    "olive-oil": "shop.categoryOliveOil",
    "zatar": "shop.categoryZatar",
    "sage": "shop.categorySage",
    "freekeh": "shop.categoryFreekeh",
    "pressed-olives": "shop.categoryPressedOlives",
    "duqqa": "shop.categoryDuqqa",
    "soap": "shop.categorySoap",
  };
  return keyMap[categoryId] || "shop.categoryOliveOil";
};

export default function AdminEditProductPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
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
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          } else {
            const fallbackCategories = CATEGORIES.map(c => ({ id: c.id, name: c.name, nameAr: c.name }));
            setCategories(fallbackCategories);
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        const fallbackCategories = CATEGORIES.map(c => ({ id: c.id, name: c.name, nameAr: c.name }));
        setCategories(fallbackCategories);
      }
    };

    const loadProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          const product = data?.product;
          if (product) {
            setName(product.name || "");
            setNameEn(product.nameEn || "");
            setDescription(product.description || "");
            setDescriptionEn(product.descriptionEn || "");
            setCategory(product.category || CATEGORIES[0]?.id);
            setPrice(String(product.price || ""));
            setExistingImage(product.image || null);
            setExistingImages(product.images || []);
            setFeatured(Boolean(product.featured));
            setInStock(Boolean(product.inStock));

            if (product.sizes && typeof product.sizes === "object") {
              const newSizes = { ...sizes };
              (Object.keys(newSizes) as Array<"small" | "medium" | "large">).forEach((key) => {
                if (product.sizes[key]) {
                  newSizes[key] = {
                    enabled: true,
                    weight: product.sizes[key].weight || "",
                    price: String(product.sizes[key].price || ""),
                  };
                }
              });
              setSizes(newSizes);
            }
          }
        }
      } catch {
        setError("فشل تحميل المنتج");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCategories();
      loadProduct();
    }
  }, [id]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagePreviews([]);
      return;
    }
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

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
      let imageData = existingImage || "";
      let imagesData = [...existingImages];
      
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const uploadRes = await fetch("/api/uploads/product-image", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json().catch(() => ({}));
          setError(uploadError?.error || "فشل رفع الصورة الرئيسية");
          setSaving(false);
          return;
        }

        const uploadJson = await uploadRes.json();
        imageData = typeof uploadJson?.imageData === "string" ? uploadJson.imageData : imageData;
      }

      // Upload new multiple images
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          const uploadRes = await fetch("/api/uploads/product-image", {
            method: "POST",
            body: uploadData,
          });

          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            if (typeof uploadJson?.imageData === "string") {
              imagesData.push(uploadJson.imageData);
            }
          }
        }
      }

      const sizesPayload = buildSizesPayload();
      const payload = {
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        description: description.trim(),
        descriptionEn: descriptionEn.trim() || undefined,
        category,
        price: Number(price) || 0,
        imageData,
        images: imagesData.length > 0 ? JSON.stringify(imagesData) : undefined,
        sizes: Object.keys(sizesPayload).length ? sizesPayload : undefined,
        featured,
        inStock,
      };

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "حدث خطأ أثناء الحفظ");
        setSaving(false);
        return;
      }

      setSuccess("تم تعديل المنتج بنجاح");
      setTimeout(() => {
        router.push("/shop");
      }, 1500);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12" style={{ direction: dir }}>
        <p style={{ color: COLORS.primary }} className="text-lg font-semibold">
          جاري التحميل...
        </p>
      </div>
    );
  }

  return (
    <div style={{ direction: dir }}>
      <h1 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-6">
        تعديل المنتج
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
            <label className="block text-sm font-semibold mb-2">اسم المنتج (عربي)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="مثال: زيت زيتون بكر"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">اسم المنتج (English)</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g: Extra Virgin Olive Oil"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">التصنيف</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameAr || cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">وصف المنتج (عربي)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="اكتب وصفاً مختصراً للمنتج بالعربي"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">وصف المنتج (English)</label>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Write a brief description in English"
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

        {(imagePreview || existingImage) && (
          <div>
            <label className="block text-sm font-semibold mb-2">معاينة الصورة الرئيسية</label>
            <div className="w-40 h-40 rounded-lg overflow-hidden border">
              <img
                src={imagePreview || existingImage || ""}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Multiple Images Upload */}
        <div>
          <label className="block text-sm font-semibold mb-2">صور إضافية (اختياري)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            className="w-full border rounded-lg px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">يمكنك رفع عدة صور لعرضها في معرض المنتج</p>
        </div>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-semibold mb-2">الصور الموجودة ({existingImages.length})</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {existingImages.map((image, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={image}
                    alt={`Existing ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setExistingImages(existingImages.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multiple Images Preview */}
        {imagePreviews.length > 0 && (
          <div>
            <label className="block text-sm font-semibold mb-2">معاينة الصور الإضافية الجديدة ({imagePreviews.length})</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={preview}
                    alt={`New Preview ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFiles(imageFiles.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
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

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary }}
          >
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg font-semibold border-2"
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
