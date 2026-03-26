"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

export default function LoginPageClient() {
  const { t, dir, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    if (result?.error?.includes("EMAIL_NOT_REGISTERED")) {
      setError(t("auth.emailNotRegistered"));
      setLoading(false);
      return;
    }

    setError(t("auth.invalidCredentials"));
    setLoading(false);
  };

  return (
    <div className="bg-[#121416] text-[#F2ECE2]" style={{ direction: dir, minHeight: "calc(100vh - 200px)" }}>
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-[#171a1d] p-6 shadow-md">
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#C9A66B]">Account</p>
          <h1 className="mb-2 text-3xl font-bold text-[#F2ECE2]">{t("auth.titleLogin")}</h1>
          <p className="mb-6 text-white/75">{t("auth.optional")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[#F2ECE2] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`hide-native-password-toggle w-full rounded-lg border px-3 py-2 ${dir === "rtl" ? "pl-10" : "pr-10"} text-[#F2ECE2] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40`}
                  style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={`absolute inset-y-0 ${dir === "rtl" ? "left-2" : "right-2"} flex items-center text-white/70 hover:text-[#F2ECE2]`}
                  aria-label={showPassword ? (language === "ar" ? "إخفاء كلمة المرور" : "Hide password") : (language === "ar" ? "إظهار كلمة المرور" : "Show password")}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.41.292-2.752.825-3.975M6.223 6.223A9.956 9.956 0 0112 4c5.523 0 10 4.477 10 10 0 2.213-.72 4.257-1.938 5.913M9.88 9.88a3 3 0 104.243 4.243M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-red-300">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="gold-button w-full rounded-lg py-2 font-semibold transition-opacity"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t("common.loading") : t("auth.loginButton")}
            </button>
          </form>

          <div className="mt-6 text-sm text-white/75">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="underline text-[#C9A66B] hover:text-[#F2ECE2]">
              {t("auth.register")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
