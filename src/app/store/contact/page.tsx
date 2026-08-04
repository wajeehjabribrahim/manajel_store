"use client";

import { COLORS, CONTACT_INFO } from "@/constants/store";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/constants/translations";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const { language } = useLanguage();
  const t = translations[language];
  // Built from CONTACT_INFO.phone, exactly like the floating button. The old
  // wa.me/message/… invite short link no longer opened a chat.
  const WHATSAPP_URL = `https://wa.me/${CONTACT_INFO.phone.replace(/\D/g, "")}`;
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send message. Please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error("Contact form error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FBF8F2] text-[#121416] tajawal-regular-all">
      {/* Header */}
      <section
        style={{
          background: "linear-gradient(180deg, #F3EEE3 0%, #FBF8F2 100%)",
          borderBottom: "1px solid rgba(201,166,107,0.25)",
        }}
        className="text-[#121416] py-12 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-3xl md:text-4xl gold-texture font-bold  mb-2 leading-tight">{t.contact.title}</h1>
          <p className="text-xs sm:text-sm md:text-base text-black/80 leading-relaxed">
            {t.contact.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 mb-16">
          {/* Contact Info */}
          {[
            {
              icon: (
                <svg
                  className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-[#C9A66B]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ),
              title: t.contact.address,
              content: CONTACT_INFO.address,
            },
            {
              icon: (
                <svg
                  className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-[#C9A66B]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m22 7-10 5L2 7" />
                </svg>
              ),
              title: t.contact.emailAddr,
              content: CONTACT_INFO.email,
            },
            {
              icon: (
                <svg
                  className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  viewBox="0 0 32 32"
                  fill="currentColor"
                  aria-hidden="true"
                  style={{ color: "#25D366" }}
                >
                  <path d="M19.11 17.27c-.27-.14-1.61-.79-1.86-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.35-.8-.71-1.34-1.6-1.5-1.87-.16-.27-.02-.42.12-.56.12-.12.27-.31.41-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.14-.61-1.47-.84-2.02-.22-.53-.44-.46-.61-.47h-.52c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27s.97 2.64 1.11 2.82c.14.18 1.9 2.9 4.59 4.07.64.28 1.14.45 1.53.57.64.2 1.23.17 1.69.1.52-.08 1.61-.66 1.84-1.3.23-.64.23-1.19.16-1.3-.07-.12-.25-.18-.52-.31Z" />
                  <path d="M16 3C8.82 3 3 8.82 3 16c0 2.53.72 4.89 1.97 6.88L3.5 28.5l5.78-1.44A12.95 12.95 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm0 23.5c-2.16 0-4.18-.63-5.88-1.72l-.42-.27-3.43.85.91-3.34-.28-.43A10.45 10.45 0 0 1 5.5 16C5.5 10.2 10.2 5.5 16 5.5S26.5 10.2 26.5 16 21.8 26.5 16 26.5Z" />
                </svg>
              ),
              title: t.contact.whatsappNum,
              content: CONTACT_INFO.phone,
              link: WHATSAPP_URL,
            },
          ].map((item, i) => (
            <div key={i} className="text-center px-1">
              <div className="mb-3 flex justify-center">{item.icon}</div>
              <h3 className="font-bold mb-1 text-xs sm:text-sm md:text-base text-[#C9A66B] leading-tight">
                {item.title}
              </h3>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  // mt-1 matches the address/email paragraphs below; mt-2 sat
                  // this value 4px lower than the other two cards.
                  className="mt-1 block text-[11px] sm:text-xs md:text-sm text-black/80 no-underline transition-colors hover:text-[#C9A66B] break-words"
                >
                  {item.content}
                </a>
              ) : (
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-black/80 break-words">{item.content}</p>
              )}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="rounded-xl border border-black/10 bg-[#FFFFFF] p-5 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <h2 className="text-3xl font-bold mb-6 text-[#C9A66B]">
              {t.contact.sendMessage}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black/80 mb-1">
                  {t.contact.name} {t.contact.required}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                  className="w-full px-4 py-2 border rounded-lg text-[#121416] placeholder:text-black/40 focus:outline-none focus:ring-2"
                  placeholder={t.contact.namePlaceholder}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black/80 mb-1">
                  {t.contact.email} {t.contact.required}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                  className="w-full px-4 py-2 border rounded-lg text-[#121416] placeholder:text-black/40 focus:outline-none focus:ring-2"
                  placeholder={t.contact.emailPlaceholder}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-black/80 mb-1">
                  {t.contact.phone}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                  className={`w-full px-4 py-2 border rounded-lg text-[#121416] placeholder:text-black/40 focus:outline-none focus:ring-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                  placeholder={t.contact.phonePlaceholder}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-black/80 mb-1">
                  {t.contact.subject} {t.contact.required}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                  className="w-full px-4 py-2 border rounded-lg text-[#121416] placeholder:text-black/40 focus:outline-none focus:ring-2"
                  placeholder={t.contact.subjectPlaceholder}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-black/80 mb-1">
                  {t.contact.message} {t.contact.required}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{ borderColor: "rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF" }}
                  className="w-full px-4 py-2 border rounded-lg text-[#121416] placeholder:text-black/40 focus:outline-none focus:ring-2"
                  placeholder={t.contact.messagePlaceholder}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gold-button w-full py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <span className="tajawal-regular">جاري الإرسال...</span> : t.contact.send}
              </button>

              {submitted && (
                <div
                  style={{ backgroundColor: "#D4EDDA", color: "#155724", borderColor: "#C3E6CB" }}
                  className="border p-3 rounded"
                >
                  تم استقبال رسالتك بنجاح. سيتم الرد عليك قريباً
                </div>
              )}

              {error && (
                <div
                  style={{ backgroundColor: "#F8D7DA", color: "#721C24", borderColor: "#F5C6CB" }}
                  className="border p-3 rounded"
                >
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Info Section */}
          <div
            className="h-fit rounded-xl border border-black/10 bg-[#FFFFFF] p-5 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
          >
            <h3 className="text-2xl font-bold mb-6 text-[#C9A66B]">
              {t.contact.helpTitle}
            </h3>
            <p className="text-black/80 mb-6">
              {t.contact.helpDesc}
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2 text-[#C9A66B]">
                  {t.contact.hours}
                </h4>
                <p className="text-black/80 text-sm whitespace-pre-line">
                  {t.contact.hoursTime}
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-2 text-[#C9A66B]">
                  {t.contact.responseTime}
                </h4>
                <p className="text-black/80 text-sm">
                  {t.contact.responseDesc}
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-2 text-[#C9A66B]">
                  {t.contact.bulkOrders}
                </h4>
                <p className="text-black/80 text-sm">
                  {t.contact.bulkOrdersDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
