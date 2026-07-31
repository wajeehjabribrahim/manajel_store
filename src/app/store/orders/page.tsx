"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import Link from "next/link";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { PRODUCTS } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { compressImageToDataUrl } from "@/lib/compressImage";

interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  total: number;
  image?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  guestToken?: string;
}

interface GuestOrderRef {
  id: string;
  guestToken: string;
  createdAt?: string;
}

interface OrderFeedback {
  note: string;
  images: string[];
  createdAt: string;
}

export default function OrdersPage() {
  const { t, dir, language } = useLanguage();
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFeedbackOrderId, setOpenFeedbackOrderId] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackImages, setFeedbackImages] = useState<string[]>([]);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackByOrder, setFeedbackByOrder] = useState<Record<string, OrderFeedback>>({});

  useEffect(() => {
    // Always fetch guest orders immediately (no need to wait for session)
    fetchGuestOrders();

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/user");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestOrders = async () => {
    try {
      const key = "manajel-guest-orders";
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      const refs = (Array.isArray(parsed) ? parsed : []) as GuestOrderRef[];

      const normalizedRefs = refs.filter(
        (ref) =>
          typeof ref?.id === "string" &&
          ref.id.length > 0 &&
          typeof ref?.guestToken === "string" &&
          ref.guestToken.length > 0
      );

      if (normalizedRefs.length === 0) {
        setOrders([]);
        return;
      }

      // Batch fetch guest orders in a single request
      const ids = normalizedRefs.map((r) => r.id).join(",");
      const tokens = normalizedRefs.map((r) => r.guestToken).join(",");

      const res = await fetch(`/api/orders/guest?ids=${encodeURIComponent(ids)}&tokens=${encodeURIComponent(tokens)}`);
      let validOrders: Order[] = [];
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (Array.isArray(data?.orders)) {
          validOrders = (data.orders as Order[]).map((o) => ({ ...o, guestToken: (normalizedRefs.find(r => r.id === o.id)?.guestToken) || undefined }));
        }
      }

      validOrders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(validOrders);

      const validIds = new Set(validOrders.map((order) => order.id));
      const cleanedRefs = normalizedRefs.filter((ref) => validIds.has(ref.id));
      localStorage.setItem(key, JSON.stringify(cleanedRefs));
    } catch (error) {
      console.error("Failed to fetch guest orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: t("orders.statusPending"),
      processing: t("orders.statusProcessing"),
      shipped: t("orders.statusShipped"),
      delivered: t("orders.statusDelivered"),
      cancelled: t("orders.statusCancelled"),
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: "#FFA500",
      processing: "#2196F3",
      shipped: "#9C27B0",
      delivered: "#4CAF50",
      cancelled: "#F44336",
    };
    return colorMap[status] || "#666";
  };

  const handleFeedbackImagesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, 3);
    const tooLarge = imageFiles.find((file) => file.size > 2 * 1024 * 1024);
    if (tooLarge) {
      setFeedbackError(language === "ar" ? "حجم الصورة يجب أن يكون أقل من 2MB" : "Each image must be under 2MB");
      return;
    }

    try {
      // Compressed before encoding: raw base64 of a 2 MB photo exceeded the
      // API's size cap and the customer saw an unexplained failure.
      const encoded = await Promise.all(imageFiles.map(compressImageToDataUrl));
      setFeedbackImages(encoded);
      setFeedbackError("");
    } catch {
      setFeedbackError(language === "ar" ? "تعذر قراءة الصور" : "Unable to read images");
    }
  };

  const openFeedbackForm = async (order: Order) => {
    if (openFeedbackOrderId === order.id) {
      setOpenFeedbackOrderId(null);
      return;
    }

    setOpenFeedbackOrderId(order.id);
    setFeedbackError("");
    setFeedbackNote("");
    setFeedbackImages([]);

    if (feedbackByOrder[order.id]) {
      return;
    }

    try {
      const query = order.guestToken
        ? `?guestToken=${encodeURIComponent(order.guestToken)}`
        : "";
      const res = await fetch(`/api/orders/${order.id}/feedback${query}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.feedback) {
        setFeedbackByOrder((prev) => ({ ...prev, [order.id]: data.feedback as OrderFeedback }));
      }
    } catch {
      // ignore
    }
  };

  const submitFeedback = async (order: Order) => {
    if (feedbackSubmitting) return;

    if (!feedbackNote.trim() && feedbackImages.length === 0) {
      setFeedbackError(language === "ar" ? "أدخل ملاحظة أو أضف صورة" : "Add a note or at least one image");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError("");
    try {
      const query = order.guestToken
        ? `?guestToken=${encodeURIComponent(order.guestToken)}`
        : "";
      const res = await fetch(`/api/orders/${order.id}/feedback${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: feedbackNote, images: feedbackImages }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedbackError(data?.error || (language === "ar" ? "فشل إرسال التقييم" : "Failed to submit feedback"));
        return;
      }

      const createdAt = typeof data?.feedback?.createdAt === "string"
        ? data.feedback.createdAt
        : new Date().toISOString();

      setFeedbackByOrder((prev) => ({
        ...prev,
        [order.id]: {
          note: feedbackNote.trim(),
          images: feedbackImages,
          createdAt,
        },
      }));
      setOpenFeedbackOrderId(null);
      setFeedbackNote("");
      setFeedbackImages([]);
    } catch {
      setFeedbackError(language === "ar" ? "حدث خطأ أثناء الإرسال" : "An error occurred while submitting");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#FBF8F2" }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-[#121416]">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#FBF8F2", direction: dir }} className="text-[#121416] tajawal-regular-all">
      <section
        style={{
          background: "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="px-4 py-12 text-[#121416]"
      >
        <div className="max-w-7xl mx-auto">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[#C9A66B]">Order Tracking</p>
          <h1 className="text-4xl font-bold">{t("orders.myOrders")}</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        {orders.length === 0 ? (
          <div className="text-center">
            <div className="mb-4 flex justify-center"><svg className="h-16 w-16 text-[#C9A66B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path strokeLinecap="round" strokeLinejoin="round" d="m3.3 7 8.7 5 8.7-5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" /></svg></div>
            <h2 className="mb-4 text-2xl font-bold text-[#121416]">
              {t("orders.noOrders")}
            </h2>
            <p className="mb-8 text-black/75">{t("orders.noOrdersDesc")}</p>
            <Link
              href="/store/shop"
              className="gold-button inline-block px-8 py-3 rounded-lg font-semibold"
            >
              {t("cart.continueShop")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="overflow-hidden rounded-xl border border-black/10 bg-[#FFFFFF] shadow-md">
                <div
                  className="p-6 border-b flex justify-between items-center"
                  style={{ borderColor: "rgba(0,0,0,0.14)" }}
                >
                  <div>
                    <h3 className="font-bold text-lg text-[#121416]">
                      {t("orders.order")} #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-black/65">
                      {new Date(order.createdAt).toLocaleDateString(language === "ar" ? "ar-SA-u-nu-latn" : "en-US")}
                    </p>
                  </div>
                  <span
                    className="px-4 py-2 rounded-full text-white font-semibold text-sm"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-4">
                    {order.items.map((item) => {
                      const product = PRODUCTS.find((p) => p.id === item.productId);
                      const itemImage = item.image || product?.image;
                      
                      return (
                      <div key={item.id} className="flex gap-4 rounded-lg border border-black/10 bg-[#FFFFFF] p-3">
                        {itemImage && (
                          <img
                            src={itemImage}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                            style={{ border: "1px solid rgba(0,0,0,0.15)" }}
                          />
                        )}
                        <div className="flex-1 flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-[#121416]">{item.name}</p>
                            <p className="text-sm text-black/70">الكمية: {item.quantity}</p>
                          </div>
                          <span className="font-semibold text-[#C9A66B]">{CURRENCY_SYMBOL}{item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    );})}
                  </div>

                  <div className="flex justify-between items-center border-t pt-4" style={{ borderColor: "rgba(0,0,0,0.14)" }}>
                    <div>
                      <span className="text-sm text-black/70">{t("cart.totalPrice")}:</span>
                      <span className="ml-2 text-xl font-bold text-[#C9A66B]">
                        {CURRENCY_SYMBOL}{order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={
                          order.guestToken
                            ? `/store/orders/${order.id}?guestToken=${encodeURIComponent(order.guestToken)}`
                            : `/store/orders/${order.id}`
                        }
                        className="gold-button rounded-lg px-6 py-2 font-semibold"
                      >
                        {t("orders.viewDetails")}
                      </Link>

                      {order.status === "delivered" ? (
                        <button
                          type="button"
                          onClick={() => openFeedbackForm(order)}
                          className="rounded-lg border px-4 py-2 text-sm font-semibold"
                          style={{ backgroundColor: "#FFFFFF", color: "#121416", borderColor: "rgba(201,166,107,0.55)" }}
                        >
                          <span className="inline-flex items-center gap-1.5"><svg className="inline-block h-4 w-4 align-[-2px] text-[#C9A66B]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>{language === "ar" ? "تقييم" : "Review"}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {order.status === "delivered" && feedbackByOrder[order.id] ? (
                    <div className="mt-4 rounded-xl border border-black/10 bg-[#FFFFFF] p-4">
                      <p className="mb-2 text-sm font-semibold text-[#C9A66B]">
                        {language === "ar" ? "تم إرسال تقييمك" : "Your feedback is submitted"}
                      </p>
                      {feedbackByOrder[order.id].note ? (
                        <p className="text-sm text-black/80 whitespace-pre-wrap">{feedbackByOrder[order.id].note}</p>
                      ) : null}
                      {feedbackByOrder[order.id].images?.length ? (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {feedbackByOrder[order.id].images.map((img, idx) => (
                            <img key={`${idx}-${img.slice(0, 16)}`} src={img} alt={`feedback-${idx + 1}`} className="h-20 w-full rounded-md object-cover border border-black/10" />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {order.status === "delivered" && openFeedbackOrderId === order.id && !feedbackByOrder[order.id] ? (
                    <div className="mt-4 rounded-xl border border-black/10 bg-[#FFFFFF] p-4">
                      <h4 className="mb-3 text-sm font-bold text-[#C9A66B]">
                        {language === "ar" ? "شاركنا ملاحظاتك بعد الاستلام" : "Share your feedback after delivery"}
                      </h4>

                      <textarea
                        value={feedbackNote}
                        onChange={(e) => setFeedbackNote(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border px-3 py-2 text-sm text-[#121416]"
                        style={{ borderColor: "rgba(0,0,0,0.2)", backgroundColor: "#FFFFFF" }}
                        placeholder={language === "ar" ? "اكتب تقييمك أو ملاحظاتك..." : "Write your review or notes..."}
                      />

                      <div className="mt-3">
                        <label className="mb-2 block text-xs text-black/70">
                          {language === "ar" ? "أضف صور بعد الاستلام (حد أقصى 3 صور)" : "Add post-delivery photos (up to 3 images)"}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFeedbackImagesChange}
                          className="block w-full text-xs text-black/70 file:mr-3 file:rounded-md file:border file:border-black/20 file:bg-[#FFFFFF] file:px-3 file:py-2 file:text-xs file:text-[#121416]"
                        />
                      </div>

                      {feedbackImages.length ? (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {feedbackImages.map((img, index) => (
                            <div key={`${index}-${img.slice(0, 16)}`} className="relative">
                              <img src={img} alt={`preview-${index + 1}`} className="h-20 w-full rounded-md object-cover border border-black/10" />
                              <button
                                type="button"
                                onClick={() => setFeedbackImages((prev) => prev.filter((_, i) => i !== index))}
                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-[10px] text-[#121416]"
                                aria-label="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {feedbackError ? (
                        <p className="mt-3 text-xs text-red-400">{feedbackError}</p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => submitFeedback(order)}
                        disabled={feedbackSubmitting}
                        className="gold-button mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        {feedbackSubmitting
                          ? language === "ar"
                            ? <span className="tajawal-regular">جاري الإرسال...</span>
                            : "Submitting..."
                          : language === "ar"
                          ? "إرسال التقييم"
                          : "Submit Feedback"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
