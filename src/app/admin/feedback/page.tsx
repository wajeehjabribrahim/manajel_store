"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface FeedbackItem {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  note: string;
  images: string[];
  status: string;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const userRole = (session?.user as { role?: string } | undefined)?.role;
      if (userRole !== "admin") {
        router.push("/");
        return;
      }

      const loadFeedback = async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/admin/feedback");
          if (!res.ok) {
            setError("فشل تحميل التقييمات");
            return;
          }

          const data = await res.json();
          setFeedback(Array.isArray(data?.feedback) ? data.feedback : []);
        } catch {
          setError("حدث خطأ أثناء تحميل التقييمات");
        } finally {
          setLoading(false);
        }
      };

      loadFeedback();
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1f2937]">فيدباك الطلبات</h1>
            <p className="mt-1 text-sm text-gray-600">جميع التقييمات الواردة بعد تسليم الطلبات</p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            رجوع للوحة التحكم
          </Link>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600 tajawal-regular">جاري التحميل...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : feedback.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">لا توجد تقييمات بعد</div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {feedback.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-sm text-gray-500">رقم الطلب</p>
                    <p className="font-bold text-gray-900">#{item.orderId.slice(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{item.customerName}</p>
                    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString("ar-SA-u-nu-latn")}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-semibold">الإيميل:</span> {item.customerEmail || "—"}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">الهاتف:</span> {item.customerPhone || "—"}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-800">
                    {item.note || "(بدون ملاحظة نصية)"}
                  </p>
                </div>

                {item.images?.length ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {item.images.map((img, idx) => (
                      <img
                        key={`${item.id}-${idx}`}
                        src={img}
                        alt={`feedback-${idx + 1}`}
                        className="h-24 w-full rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(img)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="feedback-full"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-700"
            >
              ✕ إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
