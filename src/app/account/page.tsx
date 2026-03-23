"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AccountPage() {
  const { t, dir } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/user");
        if (!res.ok) return;
        const data = await res.json();
        setEmail(data.user.email ?? "");
        setPhone(data.user.phone ?? "");
        setCity(data.user.city ?? "");
        setAddress(data.user.address ?? "");
      } catch (e) {}
    };

    if (status === "authenticated") {
      fetchUser();
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, city, address }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Error");
        setLoading(false);
        return;
      }

      setSuccess(t("account.updated") || "Updated");
      setLoading(false);
    } catch (err) {
      setError(t("common.error") || "Server error");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121416] text-[#F2ECE2]" style={{ direction: dir, minHeight: "calc(100vh - 200px)" }}>
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-[#171a1d] p-6 shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-[#F2ECE2]">{t("account.title") || "Account"}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.email")}</label>
              <input
                type="email"
                value={email || ((session?.user as { email?: string } | undefined)?.email ?? "")}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border px-3 py-2 text-white/60"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "#121416" }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full rounded-lg border px-3 py-2 text-right text-[#F2ECE2]"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.city")}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[#F2ECE2]"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">{t("auth.address")}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[#F2ECE2]"
                style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "#121416" }}
              />
            </div>

            {error && <div className="text-sm text-red-300">{error}</div>}
            {success && <div className="text-sm text-emerald-300">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="gold-button mb-2 w-full rounded-lg py-2 font-semibold transition-opacity"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t("common.loading") : t("account.save") || "Save"}
            </button>

            <button
              type="button"
              onClick={() => signOut()}
              className="w-full rounded-lg border py-2 font-semibold text-[#F2ECE2] transition-colors hover:bg-[#1b2024]"
              style={{ borderColor: "rgba(201,166,107,0.5)", backgroundColor: "#121416" }}
            >
              {t("auth.logout")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
