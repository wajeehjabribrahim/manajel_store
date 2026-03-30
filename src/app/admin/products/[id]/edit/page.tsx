"use client";



// AdminFeedbackItem component for feedback edit/delete
interface AdminFeedbackItemProps {
  item: ManualFeedbackItem;
  productId: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, author: string, note: string, noteEn: string, images: string[], rating: number) => void;
}

const AdminFeedbackItem: React.FC<AdminFeedbackItemProps> = ({ item, productId, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editAuthor, setEditAuthor] = React.useState(item.author || "");
  const [editNote, setEditNote] = React.useState(item.note);
  const [editNoteEn, setEditNoteEn] = React.useState(item.noteEn || "");
  const [editImages, setEditImages] = React.useState<string[]>(item.images || []);
  const [editRating, setEditRating] = React.useState(item.rating ?? 5);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!isEditing) return;
    setEditAuthor(item.author || "");
    setEditNote(item.note);
    setEditNoteEn(item.noteEn || "");
    setEditImages(item.images || []);
    setEditRating(item.rating ?? 5);
  }, [isEditing, item.author, item.note, item.noteEn, item.images, item.rating]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleEditImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      setError("يرجى اختيار صور فقط");
      return;
    }

    const tooLarge = files.find((file) => file.size > 2 * 1024 * 1024);
    if (tooLarge) {
      setError("حجم الصورة يجب أن يكون أقل من 2MB");
      return;
    }

    if (editImages.length + files.length > 3) {
      setError("الحد الأقصى 3 صور للفيدباك");
      return;
    }

    try {
      const encoded = await Promise.all(files.map(readFileAsDataUrl));
      setEditImages((prev) => [...prev, ...encoded].slice(0, 3));
      setError("");
    } catch {
      setError("فشل قراءة الصور");
    } finally {
      event.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيدباك؟")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/feedbacks/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("فشل حذف الفيدباك");
        setSaving(false);
        return;
      }
      onDelete(item.id);
    } catch {
      setError("حدث خطأ أثناء حذف الفيدباك");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editNote.trim() && !editNoteEn.trim()) {
      setError("لا يمكن أن يكون النص العربي والإنجليزي فارغين معًا");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/feedbacks/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: editAuthor.trim(), note: editNote, noteEn: editNoteEn, images: editImages, rating: editRating }),
      });
      if (!res.ok) {
        setError("فشل تعديل الفيدباك");
        setSaving(false);
        return;
      }
      onEdit(item.id, editAuthor.trim() || "Admin", editNote, editNoteEn, editImages, editRating);
      setIsEditing(false);
    } catch {
      setError("حدث خطأ أثناء تعديل الفيدباك");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-white flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25v-.75z" />
          </svg>
        </span>
        <span className="font-semibold">{item.author || "Admin"}</span>
        <span className="text-xs text-gray-500 ml-2">{new Date(item.createdAt).toLocaleDateString("ar-EG")}</span>
      </div>
      <div className="flex items-center gap-1 text-amber-500 text-sm">
        {Array.from({ length: 5 }).map((_, idx) => (
          <span key={idx}>{idx < (item.rating ?? 5) ? "★" : "☆"}</span>
        ))}
      </div>
      {item.images && item.images.length > 0 && (
        <div className="flex gap-2 mt-2">
          {item.images.map((img, idx) => (
            <img key={idx} src={img} alt="feedback" className="w-16 h-16 object-cover rounded-lg border" />
          ))}
        </div>
      )}
      {isEditing ? (
        <>
          <input
            type="text"
            className="w-full border rounded-lg px-2 py-1"
            value={editAuthor}
            onChange={e => setEditAuthor(e.target.value)}
            placeholder="اسم صاحب الفيدباك"
          />
          <textarea
            className="w-full border rounded-lg px-2 py-1"
            value={editNote}
            onChange={e => setEditNote(e.target.value)}
            rows={2}
            placeholder="نص الفيدباك بالعربي"
          />
          <textarea
            className="w-full border rounded-lg px-2 py-1"
            value={editNoteEn}
            onChange={e => setEditNoteEn(e.target.value)}
            rows={2}
            placeholder="Feedback text in English (optional)"
          />
          <div>
            <label className="block text-sm font-semibold mb-1">التقييم بالنجوم</label>
            <select
              value={editRating}
              onChange={(e) => setEditRating(Number(e.target.value))}
              className="w-full border rounded-lg px-2 py-1"
            >
              <option value={5}>5 نجوم</option>
              <option value={4}>4 نجوم</option>
              <option value={3}>3 نجوم</option>
              <option value={2}>2 نجوم</option>
              <option value={1}>1 نجمة</option>
            </select>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleEditImages}
              className="w-full border rounded-lg px-2 py-1"
            />
            <p className="text-xs text-gray-500 mt-1">حد أقصى 3 صور</p>
          </div>

          {editImages.length > 0 ? (
            <div className="flex gap-2 mt-2 flex-wrap">
              {editImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img} alt="feedback preview" className="w-16 h-16 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2 mt-2">
            <button type="button" className="px-3 py-1 rounded bg-green-600 text-white" disabled={saving} onClick={handleEdit}>
              حفظ
            </button>
            <button type="button" className="px-3 py-1 rounded bg-gray-300" disabled={saving} onClick={() => setIsEditing(false)}>
              إلغاء
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="whitespace-pre-line text-gray-800">{item.note}</div>
          {item.noteEn ? (
            <div className="whitespace-pre-line text-gray-600 text-sm border-t pt-2 mt-2">{item.noteEn}</div>
          ) : null}
        </>
      )}
      <div className="flex gap-2 mt-2">
        <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white" disabled={saving} onClick={() => setIsEditing(true)}>
          تعديل
        </button>
        <button type="button" className="px-3 py-1 rounded bg-red-600 text-white" disabled={saving} onClick={handleDelete}>
          حذف
        </button>
      </div>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};
import React, { useEffect, useState, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { CATEGORIES } from "@/constants/products";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { SIZE_KEYS, SizeKey, getFallbackSizeLabel } from "@/lib/productSizes";

interface AdminFeedbackItemProps {
  item: ManualFeedbackItem;
  productId: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, author: string, note: string, noteEn: string, images: string[], rating: number) => void;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
}

interface SizeState {
  enabled: boolean;
  label: string;
  labelEn: string;
  weight: string;
  price: string;
  salePrice: string;
}

interface ManualFeedbackItem {
  id: string;
  author: string;
  note: string;
  noteEn?: string;
  images: string[];
  rating?: number;
  createdAt: string;
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
  const initialSizes = (): Record<SizeKey, SizeState> => ({
    small: { enabled: false, label: "", labelEn: "", weight: "", price: "", salePrice: "" },
    medium: { enabled: true, label: "", labelEn: "", weight: "", price: "", salePrice: "" },
    large: { enabled: false, label: "", labelEn: "", weight: "", price: "", salePrice: "" },
  });
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [ingredientsEn, setIngredientsEn] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [extraImageUrls, setExtraImageUrls] = useState<string[]>([]);
  const [extraImageUrlInput, setExtraImageUrlInput] = useState("");
  const [featured, setFeatured] = useState(false);
  const [inStock, setInStock] = useState(true);
  const [sizes, setSizes] = useState<Record<SizeKey, SizeState>>(initialSizes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [manualFeedback, setManualFeedback] = useState("");
  const [manualFeedbackEn, setManualFeedbackEn] = useState("");
  const [manualFeedbackAuthor, setManualFeedbackAuthor] = useState("");
  const [manualFeedbackRating, setManualFeedbackRating] = useState(5);
  const [manualFeedbackDate, setManualFeedbackDate] = useState<string>("");
  const [manualFeedbackImageFiles, setManualFeedbackImageFiles] = useState<File[]>([]);
  const [manualFeedbackImagePreviews, setManualFeedbackImagePreviews] = useState<string[]>([]);
  const [manualFeedbackSaving, setManualFeedbackSaving] = useState(false);
  const [manualFeedbackError, setManualFeedbackError] = useState("");
  const [manualFeedbackSuccess, setManualFeedbackSuccess] = useState("");
  const [manualFeedbackItems, setManualFeedbackItems] = useState<ManualFeedbackItem[]>([]);

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
            setIngredients(product.ingredients || "");
            setIngredientsEn(product.ingredientsEn || "");
            setCategory(product.category || CATEGORIES[0]?.id);
            setPrice(String(product.price || ""));
            setExistingImage(product.image || null);
            setImageUrl(
              typeof product.image === "string" && /^https?:\/\//i.test(product.image)
                ? product.image
                : ""
            );
            setExistingImages(product.images || []);
            setFeatured(Boolean(product.featured));
            setInStock(Boolean(product.inStock));

            if (product.sizes && typeof product.sizes === "object") {
              const newSizes = initialSizes();
              SIZE_KEYS.forEach((key) => {
                if (product.sizes[key]) {
                  newSizes[key] = {
                    enabled: true,
                    label: product.sizes[key].label || "",
                    labelEn: product.sizes[key].labelEn || "",
                    weight: product.sizes[key].weight || "",
                    price: String(product.sizes[key].price || ""),
                    salePrice: String(product.sizes[key].salePrice || ""),
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

    const loadManualFeedback = async () => {
      try {
        const res = await fetch(`/api/products/${id}/feedbacks`);
        if (!res.ok) return;
        const data = await res.json();
        setManualFeedbackItems(Array.isArray(data?.feedbacks) ? data.feedbacks : []);
      } catch {
        // ignore feedback loading error
      }
    };

    if (id) {
      loadCategories();
      loadProduct();
      loadManualFeedback();
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

  useEffect(() => {
    if (manualFeedbackImageFiles.length === 0) {
      setManualFeedbackImagePreviews([]);
      return;
    }
    const urls = manualFeedbackImageFiles.map((file) => URL.createObjectURL(file));
    setManualFeedbackImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [manualFeedbackImageFiles]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleManualFeedbackImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 3) {
      setManualFeedbackError("الحد الأقصى 3 صور للفيدباك");
      return;
    }
    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      setManualFeedbackError("يرجى اختيار صور فقط");
      return;
    }
    const tooLarge = files.find((file) => file.size > 2 * 1024 * 1024);
    if (tooLarge) {
      setManualFeedbackError("حجم الصورة يجب أن يكون أقل من 2MB");
      return;
    }
    setManualFeedbackError("");
    setManualFeedbackImageFiles(files);
  };

  const handleManualFeedbackSubmit = async () => {
    if (!id || manualFeedbackSaving) return;

    if (!manualFeedback.trim() && !manualFeedbackEn.trim() && manualFeedbackImageFiles.length === 0) {
      setManualFeedbackError("أدخل نص الفيدباك (عربي أو إنجليزي) أو أضف صورة واحدة على الأقل");
      return;
    }
    if (!manualFeedbackDate) {
      setManualFeedbackError("يرجى اختيار تاريخ للفيدباك");
      return;
    }

    setManualFeedbackSaving(true);
    setManualFeedbackError("");
    setManualFeedbackSuccess("");

    try {
      const encodedImages = manualFeedbackImageFiles.length
        ? await Promise.all(manualFeedbackImageFiles.map(readFileAsDataUrl))
        : [];

      const res = await fetch(`/api/products/${id}/feedbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: manualFeedbackAuthor.trim(),
          note: manualFeedback,
          noteEn: manualFeedbackEn,
          images: encodedImages,
          rating: manualFeedbackRating,
          createdAt: new Date(manualFeedbackDate).toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setManualFeedbackError(data?.error || "فشل حفظ الفيدباك");
        return;
      }

      if (data?.feedback) {
        setManualFeedbackItems((prev) => [data.feedback, ...prev]);
      }
      setManualFeedbackAuthor("");
      setManualFeedbackRating(5);
      setManualFeedback("");
      setManualFeedbackEn("");
      setManualFeedbackDate("");
      setManualFeedbackImageFiles([]);
      setManualFeedbackSuccess("تم إضافة الفيدباك بنجاح");
    } catch {
      setManualFeedbackError("حدث خطأ أثناء إضافة الفيدباك");
    } finally {
      setManualFeedbackSaving(false);
    }
  };

  const buildSizesPayload = () => {
    const payload: Record<string, { label?: string; labelEn?: string; weight: string; price: number; salePrice?: number }> = {};
    SIZE_KEYS.forEach((key) => {
      const size = sizes[key];
      const numericPrice = Number(size.price);
      if (size.enabled && Number.isFinite(numericPrice) && numericPrice > 0) {
        const entry: { label?: string; labelEn?: string; weight: string; price: number; salePrice?: number } = {
          weight: size.weight.trim(),
          price: numericPrice,
        };
        const customLabel = size.label.trim();
        if (customLabel) {
          entry.label = customLabel;
        }
        const customLabelEn = size.labelEn.trim();
        if (customLabelEn) {
          entry.labelEn = customLabelEn;
        }
        const numericSalePrice = Number(size.salePrice);
        if (size.salePrice && Number.isFinite(numericSalePrice) && numericSalePrice > 0 && numericSalePrice < numericPrice) {
          entry.salePrice = numericSalePrice;
        }
        payload[key] = entry;
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
      let image = imageUrl.trim();
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
        image = "";
      } else if (image) {
        imageData = "";
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

      // Append any externally provided image URLs
      const extraUrls = extraImageUrls.map(u => u.trim()).filter(Boolean);
      if (extraUrls.length > 0) {
        imagesData = [...imagesData, ...extraUrls];
      }

      const sizesPayload = buildSizesPayload();
      const payload = {
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        description: description.trim(),
        descriptionEn: descriptionEn.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        ingredientsEn: ingredientsEn.trim() || undefined,
        category,
        price: Number(price) || 0,
        image,
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

  const updateSize = (key: SizeKey, patch: Partial<SizeState>) => {
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
    <div style={{ direction: dir }} className="text-gray-900">
      <h1 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-6">
        تعديل المنتج
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6 text-gray-900">
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

        <div>
          <label className="block text-sm font-semibold mb-2">المكونات (اختياري)</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="مثال: زيت زيتون بكر 100%"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Ingredients (Optional)</label>
          <textarea
            value={ingredientsEn}
            onChange={(e) => setIngredientsEn(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g: 100% Extra Virgin Olive Oil"
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

        <div>
          <label className="block text-sm font-semibold mb-2">رابط الصورة الرئيسية (اختياري)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="https://example.com/product-image.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">إذا اخترت ملف صورة، ستكون له الأولوية على الرابط.</p>
        </div>

        {(imagePreview || imageUrl || existingImage) && (
          <div>
            <label className="block text-sm font-semibold mb-2">معاينة الصورة الرئيسية</label>
            <div className="w-40 h-40 rounded-lg overflow-hidden border">
              <img
                src={imagePreview || imageUrl || existingImage || ""}
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
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 5) {
                setError("الحد الأقصى 5 صور إضافية");
                return;
              }
              setImageFiles(files);
            }}
            className="w-full border rounded-lg px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">الحد الأقصى 5 صور ({imageFiles.length}/5)</p>
          <div className="mt-3">
            <label className="block text-sm font-semibold mb-2">أو أضف روابط صور إضافية (اختياري)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={extraImageUrlInput}
                onChange={(e) => setExtraImageUrlInput(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="https://example.com/image.webp"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => {
                  const v = (extraImageUrlInput || "").trim();
                  if (!v) return;
                  setExtraImageUrls((prev) => [...prev, v]);
                  setExtraImageUrlInput("");
                }}
                className="px-3 py-2 rounded-lg bg-gray-200"
              >أضف</button>
            </div>

            {extraImageUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {extraImageUrls.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img src={url} alt={`URL ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => setExtraImageUrls(extraImageUrls.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                      if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
                        setExistingImages(existingImages.filter((_, i) => i !== idx));
                      }
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
            {SIZE_KEYS.map((key) => (
              <div key={key} className="border rounded-lg p-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={sizes[key].enabled}
                    onChange={(e) => updateSize(key, { enabled: e.target.checked })}
                  />
                  <span className="font-semibold">
                    {getFallbackSizeLabel(key, t)}
                  </span>
                </label>
                <input
                  type="text"
                  value={sizes[key].label}
                  onChange={(e) => updateSize(key, { label: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                  placeholder={`اسم الحجم بالعربي (${getFallbackSizeLabel(key, t)})`}
                  disabled={!sizes[key].enabled}
                />
                <input
                  type="text"
                  value={sizes[key].labelEn}
                  onChange={(e) => updateSize(key, { labelEn: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                  placeholder={`Size name in English (${key})`}
                  disabled={!sizes[key].enabled}
                />
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
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                  placeholder="السعر"
                  min="0"
                  step="0.01"
                  disabled={!sizes[key].enabled}
                />
                <input
                  type="number"
                  value={sizes[key].salePrice}
                  onChange={(e) => updateSize(key, { salePrice: e.target.value })}
                  className="w-full border border-red-300 rounded-lg px-3 py-2"
                  placeholder="سعر العرض (اختياري)"
                  min="0"
                  step="0.01"
                  disabled={!sizes[key].enabled}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 style={{ color: COLORS.primary }} className="font-bold text-lg mb-3">
            فيدباك يدوي (يظهر أسفل المنتج)
          </h3>

          {manualFeedbackError ? (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{manualFeedbackError}</div>
          ) : null}
          {manualFeedbackSuccess ? (
            <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{manualFeedbackSuccess}</div>
          ) : null}


          <input
            type="text"
            value={manualFeedbackAuthor}
            onChange={(e) => setManualFeedbackAuthor(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3"
            placeholder="اسم صاحب الفيدباك (اختياري)"
          />
          <textarea
            value={manualFeedback}
            onChange={(e) => setManualFeedback(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 mb-3"
            placeholder="اكتب تقييم/فيديو باك لطيف للمنتج..."
          />
          <textarea
            value={manualFeedbackEn}
            onChange={(e) => setManualFeedbackEn(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 mb-3"
            placeholder="Write feedback translation in English (optional)..."
          />
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">التقييم بالنجوم</label>
            <select
              value={manualFeedbackRating}
              onChange={(e) => setManualFeedbackRating(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value={5}>5 نجوم</option>
              <option value={4}>4 نجوم</option>
              <option value={3}>3 نجوم</option>
              <option value={2}>2 نجوم</option>
              <option value={1}>1 نجمة</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">تاريخ الفيدباك</label>
            <input
              type="date"
              value={manualFeedbackDate}
              onChange={e => setManualFeedbackDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleManualFeedbackImages}
            className="w-full border rounded-lg px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-500">حد أقصى 3 صور (كل صورة أقل من 2MB)</p>

          {manualFeedbackImagePreviews.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              {manualFeedbackImagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img src={preview} alt={`manual feedback ${idx + 1}`} className="h-24 w-full rounded-lg border object-cover" />
                  <button
                    type="button"
                    onClick={() => setManualFeedbackImageFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4">
            <button
              type="button"
              onClick={handleManualFeedbackSubmit}
              disabled={manualFeedbackSaving}
              className="px-5 py-2 rounded-lg text-white font-semibold disabled:opacity-50"
              style={{ backgroundColor: COLORS.primary }}
            >
              {manualFeedbackSaving ? "جاري الإضافة..." : "إضافة فيدباك"}
            </button>
          </div>





          {manualFeedbackItems.length > 0 ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700">الفيدباك المضافة ({manualFeedbackItems.length})</p>
              {manualFeedbackItems.slice(0, 5).map((item) => (
                <AdminFeedbackItem
                  key={item.id}
                  item={item}
                  productId={id as string}
                  onDelete={id => setManualFeedbackItems(prev => prev.filter(fb => fb.id !== id))}
                  onEdit={(id, author, note, noteEn, images, rating) => setManualFeedbackItems(prev => prev.map(fb => fb.id === id ? { ...fb, author, note, noteEn, images, rating } : fb))}
                />
              ))}
            </div>
          ) : null}

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
