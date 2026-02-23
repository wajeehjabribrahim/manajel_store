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
    <div>
      {/* Header */}
      <section
        style={{ backgroundColor: COLORS.primary }}
        className="text-white py-12 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{t.contact.title}</h1>
          <p className="text-lg opacity-90">
            {t.contact.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Contact Info */}
          {[
            {
              icon: "📍",
              title: t.contact.address,
              content: CONTACT_INFO.address,
            },
            {
              icon: "📧",
              title: t.contact.emailAddr,
              content: CONTACT_INFO.email,
            },
            {
              icon: "📞",
              title: t.contact.phoneNum,
              content: CONTACT_INFO.phone,
            },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3
                style={{ color: COLORS.primary }}
                className="font-bold mb-2"
              >
                {item.title}
              </h3>
              <p className="text-gray-900">{item.content}</p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2
              style={{ color: COLORS.primary }}
              className="text-3xl font-bold mb-6"
            >
              {t.contact.sendMessage}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
                  {t.contact.name} {t.contact.required}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ borderColor: COLORS.border }}
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2"
                  placeholder={t.contact.namePlaceholder}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                  {t.contact.email} {t.contact.required}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ borderColor: COLORS.border }}
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2"
                  placeholder={t.contact.emailPlaceholder}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-1">
                  {t.contact.phone}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ borderColor: COLORS.border }}
                  className="w-full px-4 py-2 border rounded-lg text-right text-gray-900 focus:outline-none focus:ring-2"
                  placeholder={t.contact.phonePlaceholder}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-1">
                  {t.contact.subject} {t.contact.required}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{ borderColor: COLORS.border }}
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2"
                  placeholder={t.contact.subjectPlaceholder}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-1">
                  {t.contact.message} {t.contact.required}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{ borderColor: COLORS.border }}
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2"
                  placeholder={t.contact.messagePlaceholder}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "جاري الإرسال..." : t.contact.send}
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
            style={{ backgroundColor: COLORS.accent }}
            className="rounded-lg p-8"
          >
            <h3
              style={{ color: COLORS.primary }}
              className="text-2xl font-bold mb-6"
            >
              {t.contact.helpTitle}
            </h3>
            <p className="text-gray-900 mb-6">
              {t.contact.helpDesc}
            </p>

            <div className="space-y-4">
              <div>
                <h4
                  style={{ color: COLORS.primary }}
                  className="font-bold mb-2"
                >
                  {t.contact.hours}
                </h4>
                <p className="text-gray-900 text-sm whitespace-pre-line">
                  {t.contact.hoursTime}
                </p>
              </div>

              <div>
                <h4
                  style={{ color: COLORS.primary }}
                  className="font-bold mb-2"
                >
                  {t.contact.responseTime}
                </h4>
                <p className="text-gray-900 text-sm">
                  {t.contact.responseDesc}
                </p>
              </div>

              <div>
                <h4
                  style={{ color: COLORS.primary }}
                  className="font-bold mb-2"
                >
                  {t.contact.bulkOrders}
                </h4>
                <p className="text-gray-900 text-sm">
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
