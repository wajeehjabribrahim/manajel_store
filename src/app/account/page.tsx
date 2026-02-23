"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { COLORS } from "@/constants/store";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AccountPage() {
  const { t, dir } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    <div className="max-w-md mx-auto px-4 py-12" style={{ direction: dir }}>
      <h1 className="text-2xl font-bold mb-4" style={{ color: COLORS.primary }}>
        {t("account.title") || "Account"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">{t("auth.phone")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            style={{ borderColor: COLORS.border }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">{t("auth.city")}</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            style={{ borderColor: COLORS.border }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">{t("auth.address")}</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            style={{ borderColor: COLORS.border }}
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
          {loading ? t("common.loading") : t("account.save") || "Save"}
        </button>
      </form>
    </div>
  );
}
