"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, city, address, email, password }),
    });

    if (res.ok) {
      setSuccess(t("auth.successRegister"));
      await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      router.push("/");
      return;
    }

    if (res.status === 409) {
      setError(t("auth.emailInUse"));
    } else {
      setError(t("common.error"));
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12" style={{ direction: dir }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>
        {t("auth.titleRegister")}
      </h1>
      <p className="text-gray-800 mb-6">{t("auth.optional")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {t("auth.name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {t("auth.phone")}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.contact.phonePlaceholder}
            className="w-full border rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {t("auth.city")}
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {t("auth.address")}
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {t("auth.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {t("auth.password")}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {t("auth.confirmPassword")}
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg text-white transition-opacity"
          style={{ backgroundColor: COLORS.primary, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? t("common.loading") : t("auth.registerButton")}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-800">
        {t("auth.haveAccount")} {" "}
        <Link href="/login" className="underline" style={{ color: COLORS.primary }}>
          {t("auth.login")}
        </Link>
      </div>
    </div>
  );
}
