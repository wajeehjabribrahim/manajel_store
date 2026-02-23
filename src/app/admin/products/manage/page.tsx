"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  displayOrder: number;
}

interface SortableRowProps {
  product: Product;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ product, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-50 cursor-move"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div
          {...attributes}
          {...listeners}
          className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              لا صورة
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{product.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{product.category}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{CURRENCY_SYMBOL}{product.price.toFixed(2)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(product.id)}
            className="px-3 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-sm font-medium transition-colors"
          >
            تعديل
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
          >
            حذف
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ManageProductsPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError("فشل تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // تحديث الترتيب محلياً أولاً
    const newProducts = arrayMove(products, oldIndex, newIndex);
    setProducts(newProducts);

    // حفظ الترتيب الجديد في قاعدة البيانات
    setSaving(true);
    setError("");

    try {
      // تحديث displayOrder لكل منتج
      const updates = newProducts.map((product, index) => ({
        id: product.id,
        displayOrder: index,
      }));

      const res = await fetch("/api/products/reorder-batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updates }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "فشل حفظ الترتيب");
        // إعادة تحميل المنتجات في حالة الفشل
        await fetchProducts();
      }
    } catch (err) {
      setError("حدث خطأ أثناء حفظ الترتيب");
      await fetchProducts();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (productId: string) => {
    router.push(`/admin/products/${productId}/edit`);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setError("فشل حذف المنتج");
        return;
      }

      await fetchProducts();
    } catch (err) {
      setError("حدث خطأ أثناء حذف المنتج");
    }
  };

  return (
    <div style={{ direction: dir }} className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: COLORS.primary }} className="text-3xl font-bold">
          إدارة ترتيب المنتجات
        </h1>
        <button
          onClick={() => router.push("/admin/products")}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          رجوع
        </button>
      </div>

      {saving && (
        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg mb-4">
          جاري حفظ الترتيب...
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl">جاري التحميل...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          لا توجد منتجات لعرضها
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الصورة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم المنتج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التصنيف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      السعر
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <SortableContext
                    items={products.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {products.map((product) => (
                      <SortableRow
                        key={product.id}
                        product={product}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>اسحب المنتجات من الصورة لتغيير ترتيبها</p>
      </div>
    </div>
  );
}
