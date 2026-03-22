"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
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

  // Password rules and client-side validation
  const passwordRules = [
    {
      key: "minLength",
      test: (p: string) => p.length >= 6,
      message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    },
    {
      key: "digit",
      test: (p: string) => /\d/.test(p),
      message: "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل",
    },
  ];

  const unmetRules = passwordRules.filter((r) => !r.test(password));

  return (
    <div className="bg-[#121416] text-[#F2ECE2]" style={{ direction: dir, minHeight: "calc(100vh - 200px)" }}>
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-[#171a1d] p-6 shadow-md">
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#C9A66B]">Account</p>
          <h1 className="mb-2 text-3xl font-bold text-[#F2ECE2]">{t("auth.titleRegister")}</h1>
          <p className="mb-6 text-white/75">{t("auth.optional")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[#F2ECE2] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.contact.phonePlaceholder}
                className="w-full rounded-lg border px-3 py-2 text-right text-[#F2ECE2] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.city")}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[#F2ECE2] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.address")}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[#F2ECE2] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                required
              />
            </div>
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
              {unmetRules.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm text-red-300">
                  {unmetRules.map((r) => (
                    <li key={r.key}>{r.message}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.confirmPassword")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[#F2ECE2] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/40"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
                required
              />
            </div>

            {error && <div className="text-sm text-red-300">{error}</div>}
            {success && <div className="text-sm text-emerald-300">{success}</div>}

            <button
              type="submit"
              disabled={
                loading || unmetRules.length > 0 || password !== confirmPassword
              }
              className="w-full rounded-lg py-2 font-semibold text-[#14171a] transition-opacity"
              style={{ backgroundColor: "#C9A66B", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t("common.loading") : t("auth.registerButton")}
            </button>
          </form>

          <div className="mt-6 text-sm text-white/75">
            {t("auth.haveAccount")} {" "}
            <Link href="/login" className="underline text-[#C9A66B] hover:text-[#F2ECE2]">
              {t("auth.login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
