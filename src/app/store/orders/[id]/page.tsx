"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { COLORS, CURRENCY_SYMBOL } from "@/constants/store";
import { PRODUCTS } from "@/constants/products";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductSizeWeight } from "@/lib/productSizes";
import { showToast } from "@/components/Toast";
import { compressImageToDataUrl } from "@/lib/compressImage";

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  currency: string;
  shippingName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingAddress: string;
  shippingNotes: string | null;
  email: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface OrderFeedback {
  note: string;
  images: string[];
  createdAt: string;
}

export default function OrderDetailsPage() {
  const { t, dir, language } = useLanguage();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const guestToken = searchParams.get("guestToken") || "";
  const shouldOpenFeedback = searchParams.get("feedback") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackImages, setFeedbackImages] = useState<string[]>([]);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [existingFeedback, setExistingFeedback] = useState<OrderFeedback | null>(null);
  const [localizedProductNames, setLocalizedProductNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const query = guestToken
          ? `?guestToken=${encodeURIComponent(guestToken)}`
          : "";
        const res = await fetch(`/api/orders/${id}${query}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);

          try {
            const feedbackRes = await fetch(`/api/orders/${id}/feedback${query}`);
            if (feedbackRes.ok) {
              const feedbackData = await feedbackRes.json();
              if (feedbackData?.feedback) {
                setExistingFeedback(feedbackData.feedback);
                setShowFeedbackForm(false);
              } else if (data?.order?.status === "delivered" && shouldOpenFeedback) {
                setShowFeedbackForm(true);
              }
            }
          } catch {
            // ignore feedback fetch errors
          }
        } else {
          setError(t("orders.notFound"));
        }
      } catch {
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, guestToken, shouldOpenFeedback, t]);

  useEffect(() => {
    const loadLocalizedProductNames = async () => {
      try {
        const res = await fetch(`/api/products?lang=${language}`);
        if (!res.ok) {
          setLocalizedProductNames({});
          return;
        }

        const data = await res.json();
        const products = Array.isArray(data?.products) ? data.products : [];
        const namesMap = products.reduce((acc: Record<string, string>, product: { id?: string; name?: string }) => {
          if (product?.id && product?.name) {
            acc[product.id] = product.name;
          }
          return acc;
        }, {});

        setLocalizedProductNames(namesMap);
      } catch {
        setLocalizedProductNames({});
      }
    };

    loadLocalizedProductNames();
  }, [language]);

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

  if (error || !order) {
    return (
      <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#FBF8F2" }} className="text-[#121416]">
        <section style={{ background: "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)", borderBottom: "1px solid rgba(201,166,107,0.25)" }} className="text-[#121416] py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold">{t("orders.title")}</h1>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold mb-4">
              {error || t("orders.notFound")}
            </h2>
            <Link
              href="/store/shop"
              className="gold-button inline-block px-8 py-3 rounded-lg font-semibold mt-4"
            >
              {t("cart.continueShop")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

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

  const handleCancelOrder = async () => {
    if (!confirm(t("orders.confirmCancel"))) {
      return;
    }

    setCancelling(true);
    try {
      const query = guestToken
        ? `?guestToken=${encodeURIComponent(guestToken)}`
        : "";
      const response = await fetch(`/api/orders/${id}/cancel${query}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || t("orders.cancelError"), "error");
        return;
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      showToast(t("orders.cancelSuccess"));
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast(t("orders.cancelError"), "error");
    } finally {
      setCancelling(false);
    }
  };

  const sizeLabel = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      small: t("product.small"),
      medium: t("product.medium"),
      large: t("product.large"),
    };
    return sizeMap[size] || size;
  };

  const handleFeedbackImagesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      setFeedbackError(language === "ar" ? "يرجى اختيار صور صالحة" : "Please choose valid image files");
      return;
    }

    const limitedFiles = imageFiles.slice(0, 3);
    const tooLarge = limitedFiles.find((file) => file.size > 2 * 1024 * 1024);
    if (tooLarge) {
      setFeedbackError(language === "ar" ? "حجم الصورة يجب أن يكون أقل من 2MB" : "Each image must be under 2MB");
      return;
    }

    try {
      // Compressed before encoding: raw base64 of a 2 MB photo exceeded the
      // API's size cap and the customer saw an unexplained failure.
      const encodedImages = await Promise.all(limitedFiles.map(compressImageToDataUrl));
      setFeedbackImages(encodedImages);
      setFeedbackError("");
    } catch {
      setFeedbackError(language === "ar" ? "تعذر قراءة الصور، حاول مرة أخرى" : "Unable to read images, try again");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!order || feedbackSubmitting) return;

    if (!feedbackNote.trim() && feedbackImages.length === 0) {
      setFeedbackError(language === "ar" ? "أدخل ملاحظة أو أضف صورة واحدة على الأقل" : "Please add a note or at least one image");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError("");
    setFeedbackSuccess("");

    try {
      const query = guestToken
        ? `?guestToken=${encodeURIComponent(guestToken)}`
        : "";

      const res = await fetch(`/api/orders/${order.id}/feedback${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: feedbackNote,
          images: feedbackImages,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedbackError(data?.error || (language === "ar" ? "فشل إرسال التقييم" : "Failed to submit feedback"));
        return;
      }

      const createdAt = typeof data?.feedback?.createdAt === "string"
        ? data.feedback.createdAt
        : new Date().toISOString();

      setExistingFeedback({
        note: feedbackNote.trim(),
        images: feedbackImages,
        createdAt,
      });
      setFeedbackSuccess(language === "ar" ? "شكراً! تم إرسال تقييمك بنجاح" : "Thanks! Your feedback has been submitted");
      setShowFeedbackForm(false);
      setFeedbackNote("");
      setFeedbackImages([]);
    } catch {
      setFeedbackError(language === "ar" ? "حدث خطأ أثناء الإرسال" : "An error occurred while submitting");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", backgroundColor: "#FBF8F2", direction: dir }} className="text-[#121416]">
      <section style={{ background: "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)", borderBottom: "1px solid rgba(201,166,107,0.25)" }} className="text-[#121416] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[#C9A66B]">Order Tracking</p>
          <h1 className="text-4xl font-bold">{t("orders.orderDetails")}</h1>
          <p className="mt-2 text-sm text-black/80">
            {t("orders.orderId")}: {order.id}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="mb-6 rounded-xl border border-black/10 bg-[#FFFFFF] p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#121416]">
                  {t("orders.orderStatus")}
                </h2>
                <span
                  className="px-4 py-2 rounded-full text-white font-semibold text-sm"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-sm text-black/70">
                {t("orders.orderDate")}: {new Date(order.createdAt).toLocaleDateString(language === "ar" ? "ar-SA-u-nu-latn" : "en-US")}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-black/10 bg-[#FFFFFF] shadow-md">
              <div className="p-6 border-b" style={{ borderColor: "rgba(0,0,0,0.14)" }}>
                <h3 className="font-bold text-lg text-[#C9A66B]">
                  {t("orders.items")}
                </h3>
              </div>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => {
                  // محاولة الحصول على الصورة من المنتج إذا لم تكن موجودة في الطلب
                  const product = PRODUCTS.find(p => p.id === item.productId);
                  const itemImage = item.image || product?.image;
                  const displayItemName = localizedProductNames[item.productId] || item.name;
                  
                  return (
                  <div
                    key={item.id}
                    className={`p-6 flex gap-6 ${
                      index !== order.items.length - 1 ? "border-b" : ""
                    }`}
                    style={{ borderColor: "rgba(0,0,0,0.14)" }}
                  >
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={displayItemName}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: "#F3EEE3" }}
                      >
                        <svg className="h-6 w-6 text-[#C9A66B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path strokeLinecap="round" strokeLinejoin="round" d="m3.3 7 8.7 5 8.7-5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" /></svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-bold text-[#121416]">
                      {displayItemName}
                    </h3>
                    <p className="text-sm text-black/70">
                      {t("cart.weight")}: {getProductSizeWeight(item.size, product?.sizes)}
                    </p>
                    <p className="text-sm text-black/70">
                      {t("product.quantity")}: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-black/70">{t("cart.pricePerUnit")}</p>
                    <p className="font-bold text-[#121416]">
                      {CURRENCY_SYMBOL}{item.price}
                    </p>
                    <p className="mt-2 text-sm text-black/70">{t("cart.total")}</p>
                    <p className="font-bold text-[#C9A66B]">
                      {CURRENCY_SYMBOL}{item.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              );})
              ) : (
                <div className="p-6 text-center text-black/60">
                  لا توجد عناصر في الطلب
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Shipping Info */}
          <div>
            <div className="mb-6 rounded-xl border border-black/10 bg-[#FFFFFF] p-6 shadow-md">
              <h3 className="mb-4 text-lg font-bold text-[#C9A66B]">
                {t("orders.shippingInfo")}
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-black/70">{t("cart.fullName")}:</span>
                  <p className="font-semibold text-[#121416]">{order.shippingName}</p>
                </div>
                <div>
                  <span className="text-black/70">{t("cart.phone")}:</span>
                  <p className="font-semibold text-[#121416]">{order.shippingPhone}</p>
                </div>
                <div>
                  <span className="text-black/70">{t("cart.city")}:</span>
                  <p className="font-semibold text-[#121416]">{order.shippingCity}</p>
                </div>
                <div>
                  <span className="text-black/70">{t("cart.address")}:</span>
                  <p className="font-semibold text-[#121416]">{order.shippingAddress}</p>
                </div>
                {order.shippingNotes && (
                  <div>
                    <span className="text-black/70">{t("cart.notes")}:</span>
                    <p className="font-semibold text-[#121416]">{order.shippingNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-[#FFFFFF] p-6 shadow-md">
              <h3 className="mb-4 text-lg font-bold text-[#C9A66B]">
                {t("cart.orderSummary")}
              </h3>
              <div className="mb-6 space-y-3 border-b pb-6" style={{ borderColor: "rgba(0,0,0,0.14)" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-black/70">{t("cart.itemCount")}</span>
                  <span className="font-semibold text-[#121416]">
                    {order.items && order.items.length > 0 ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/70">{t("cart.goodsPrice")}</span>
                  <span className="font-semibold text-[#121416]">
                    {CURRENCY_SYMBOL}{order.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#121416]">
                  {t("cart.totalPrice")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#C9A66B]">
                    {CURRENCY_SYMBOL}{order.total.toFixed(2)}
                  </span>
                  <Link
                    href="/store/shipping-policy"
                    className="px-2 py-1 rounded-md text-xs font-semibold border"
                    style={{ borderColor: "rgba(201,166,107,0.55)", color: "#121416", backgroundColor: "#FFFFFF" }}
                  >
                    {language === "ar" ? "+ سعر التوصيل" : "+ Delivery Price"}
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/store/shop"
              className="gold-button block text-center px-6 py-3 rounded-lg font-semibold mt-2"
            >
              {t("cart.continueShop")}
            </Link>

            {order.status === "pending" && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full text-center px-6 py-3 rounded-lg font-semibold mt-4 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  borderColor: "#F44336", 
                  color: "#ff7b7b",
                  backgroundColor: "rgba(244,67,54,0.14)"
                }}
              >
                {cancelling ? t("common.loading") : t("orders.cancelOrder")}
              </button>
            )}

            {order.status === "delivered" && !existingFeedback && (
              <button
                onClick={() => {
                  setShowFeedbackForm((prev) => !prev);
                  setFeedbackError("");
                  setFeedbackSuccess("");
                }}
                className="w-full text-center px-6 py-3 rounded-lg font-semibold mt-4 border"
                style={{
                  borderColor: "rgba(201,166,107,0.55)",
                  color: "#121416",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <span className="inline-flex items-center gap-1.5"><svg className="inline-block h-4 w-4 align-[-2px] text-[#C9A66B]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>{language === "ar" ? "تقييم وفيدباك" : "Review & Feedback"}</span>
              </button>
            )}

            {feedbackSuccess ? (
              <p className="mt-3 text-sm text-[#C9A66B]">{feedbackSuccess}</p>
            ) : null}

            {existingFeedback ? (
              <div className="mt-4 rounded-xl border border-black/10 bg-[#FFFFFF] p-4">
                <p className="mb-2 text-sm font-semibold text-[#C9A66B]">
                  {language === "ar" ? "تم إرسال تقييمك" : "Your feedback is submitted"}
                </p>
                {existingFeedback.note ? (
                  <p className="text-sm text-black/80 whitespace-pre-wrap">{existingFeedback.note}</p>
                ) : null}
                {existingFeedback.images?.length ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {existingFeedback.images.map((img, idx) => (
                      <img key={`${idx}-${img.slice(0, 16)}`} src={img} alt={`feedback-${idx + 1}`} className="h-20 w-full rounded-md object-cover border border-black/10" />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {order.status === "delivered" && showFeedbackForm && !existingFeedback ? (
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
                  onClick={handleSubmitFeedback}
                  disabled={feedbackSubmitting}
                  className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#1f5d4e", border: "1px solid rgba(201,166,107,0.45)" }}
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
      </section>
    </div>
  );
}
