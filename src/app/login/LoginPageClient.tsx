"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLORS } from "@/constants/store";
import Link from "next/link";

export default function LoginPageClient() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (result?.ok) {
      router.push(callbackUrl);
      return;
    }

    setError(t("auth.invalidCredentials"));
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12" style={{ direction: dir }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>
        {t("auth.titleLogin")}
      </h1>
      <p className="text-gray-800 mb-6">{t("auth.optional")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {t("auth.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2"
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
            className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border }}
            required
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg text-white transition-opacity"
          style={{ backgroundColor: COLORS.primary, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? t("common.loading") : t("auth.loginButton")}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-800">
        {t("auth.noAccount")} {" "}
        <Link href="/register" className="underline" style={{ color: COLORS.primary }}>
          {t("auth.register")}
        </Link>
      </div>
    </div>
  );
}
