"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[#F2ECE2] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                required
              />
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
