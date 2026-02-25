"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import UsersSummary from "@/components/UsersSummary";

export default function UsersSummaryPage() {
  const { dir } = useLanguage();
  const router = useRouter();

  return (
    <div style={{ direction: dir }} className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
          >
            ← رجوع
          </button>
        </div>
        <UsersSummary />
      </div>
    </div>
  );
}
