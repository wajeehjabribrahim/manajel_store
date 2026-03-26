"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/constants/store";

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export default function AdminSubscribersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (session && (session.user as { role?: string } | undefined)?.role !== "admin") {
      router.push("/");
    }
  }, [session, router]);

  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/subscribers");
        if (!res.ok) {
          setError("فشل تحميل الإيميلات المشتركة");
          return;
        }

        const data = await res.json();
        setSubscribers(Array.isArray(data?.subscribers) ? data.subscribers : []);
      } catch {
        setError("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    loadSubscribers();
  }, []);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString("ar-SA-u-nu-latn", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeleteSubscriber = async (id: string) => {
    const confirmed = confirm("هل أنت متأكد من حذف هذا الإيميل من القائمة؟");
    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        setError("فشل حذف الإيميل");
        return;
      }

      setSubscribers((prev) => prev.filter((subscriber) => subscriber.id !== id));
    } catch {
      setError("حدث خطأ أثناء حذف الإيميل");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 style={{ color: COLORS.primary }} className="text-3xl font-bold">
              الإيميلات المشتركة معنا
            </h1>
            <p className="text-gray-600 mt-2">إجمالي الاشتراكات: {subscribers.length}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700"
          >
            ← رجوع
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">جاري تحميل البيانات...</div>
        ) : subscribers.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            لا توجد إيميلات مشتركة حالياً
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-100 text-gray-700 text-sm font-semibold p-4">
              <div className="col-span-6">البريد الإلكتروني</div>
              <div className="col-span-4">تاريخ الاشتراك</div>
              <div className="col-span-2 text-center">إجراء</div>
            </div>
            {subscribers.map((subscriber) => (
              <div
                key={subscriber.id}
                className="grid grid-cols-12 p-4 border-t border-gray-100 text-sm"
              >
                <div className="col-span-6">
                  <a href={`mailto:${subscriber.email}`} className="text-blue-600 hover:underline">
                    {subscriber.email}
                  </a>
                </div>
                <div className="col-span-4 text-gray-600">{formatDate(subscriber.createdAt)}</div>
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteSubscriber(subscriber.id)}
                    disabled={deletingId === subscriber.id}
                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingId === subscriber.id ? "..." : "حذف"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
