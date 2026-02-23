"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const { language, dir } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "read">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (session && session.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, router]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contact?action=list");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        setError("فشل تحميل الرسائل");
      }
    } catch {
      setError("حدث خطأ أثناء تحميل الرسائل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const res = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: messageId, status: "read" }),
      });

      if (res.ok) {
        await loadMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, status: "read" });
        }
      }
    } catch {
      alert("فشل تحديث حالة الرسالة");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) {
      return;
    }

    setDeletingId(messageId);
    try {
      const res = await fetch("/api/contact", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: messageId }),
      });

      if (res.ok) {
        await loadMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      } else {
        alert("فشل حذف الرسالة");
      }
    } catch {
      alert("حدث خطأ أثناء حذف الرسالة");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "new") return msg.status === "new";
    if (filter === "read") return msg.status === "read";
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <section style={{ backgroundColor: COLORS.primary }} className="text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">الرسائل المستقبلة</h1>
          <p className="text-opacity-90">إدارة رسائل التواصل من العملاء</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {(["all", "new", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                filter === f
                  ? "text-white"
                  : "bg-white text-gray-900 hover:opacity-80"
              }`}
              style={{
                backgroundColor: filter === f ? COLORS.primary : undefined,
              }}
            >
              {f === "all" && "الكل"}
              {f === "new" && `جديد (${messages.filter((m) => m.status === "new").length})`}
              {f === "read" && `مقروء (${messages.filter((m) => m.status === "read").length})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
            <p className="mt-4">جاري التحميل...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded">
            <p className="text-gray-500">لا توجد رسائل</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (message.status === "new") {
                        handleMarkAsRead(message.id);
                      }
                    }}
                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedMessage?.id === message.id
                        ? "bg-blue-50 border-l-4"
                        : ""
                    }`}
                    style={{
                      borderLeftColor:
                        selectedMessage?.id === message.id ? COLORS.primary : undefined,
                      backgroundColor:
                        selectedMessage?.id === message.id ? "#EFF6FF" : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{message.subject}</h3>
                        <p className="text-sm text-gray-600">{message.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ml-2 ${
                          message.status === "new"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {message.status === "new" ? "جديد" : "مقروء"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Details */}
            <div className="lg:col-span-1">
              {selectedMessage ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">{selectedMessage.subject}</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500">الاسم</label>
                      <p className="text-gray-900">{selectedMessage.name}</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500">البريد الإلكتروني</label>
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>

                    {selectedMessage.phone && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500">الهاتف</label>
                        <a
                          href={`tel:${selectedMessage.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedMessage.phone}
                        </a>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-gray-500">التاريخ</label>
                      <p className="text-gray-900">
                        {formatDate(selectedMessage.createdAt)}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <label className="text-xs font-semibold text-gray-500 block mb-2">
                        الرسالة
                      </label>
                      <p className="text-gray-900 whitespace-pre-wrap text-sm">
                        {selectedMessage.message}
                      </p>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      {selectedMessage.status === "new" && (
                        <button
                          onClick={() => handleMarkAsRead(selectedMessage.id)}
                          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
                        >
                          وضع علامة كمقروءة
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(selectedMessage.id)}
                        disabled={deletingId === selectedMessage.id}
                        className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === selectedMessage.id ? "جاري الحذف..." : "حذف"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  اختر رسالة لعرض التفاصيل
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
