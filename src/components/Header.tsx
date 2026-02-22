"use client";

import Link from "next/link";
import Image from "next/image";
import { COLORS } from "@/constants/store";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { t, language } = useLanguage();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  const navItems = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.shop"), href: "/shop" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  return (
    <header
      style={{ backgroundColor: COLORS.primary }}
      className="text-white shadow-lg relative"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2" style={{ borderColor: COLORS.accent }}>
              <Image
                src="/images/logo.png"
                alt="Manajel Logo"
                width={40}
                height={40}
                priority
                className="object-cover w-full h-full"
              />
            </div>
            <span className="text-xl font-bold">{t("nav.brand")}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-opacity"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Language Switcher, Auth & Cart */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/products"
                      className="transition-opacity"
                      title={t("admin.addProduct") === "admin.addProduct" ? "إضافة منتج" : t("admin.addProduct")}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="transition-opacity"
                      title={t("admin.orders") === "admin.orders" ? "الطلبات" : t("admin.orders")}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </Link>
                  </>
                )}
                <Link
                  href="/orders"
                  className="transition-opacity"
                  title={t("orders.myOrders")}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </Link>
                <span className="text-sm opacity-90">
                  {t("auth.welcome")}
                  {session?.user?.name ? `, ${session.user.name}` : ""}
                </span>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1 rounded-md border border-white/40 hover:bg-white/10 transition-colors"
                >
                  {t("auth.register")}
                </Link>
              </div>
            )}
            <Link
              href="/cart"
              className="relative transition-opacity"
              title={t("nav.cart")}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0h2m-2 0H9m4 0a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            </Link>
          </div>

          {/* Mobile Icons - Language, Account & Cart */}
          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={isAuthenticated ? "/orders" : "/login"}
              className="transition-opacity"
              title={isAuthenticated ? t("orders.myOrders") : t("auth.login")}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
            <Link
              href="/cart"
              className="transition-opacity"
              title={t("nav.cart")}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0h2m-2 0H9m4 0a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            </Link>
          </div>

          {/* Mobile Menu Button - Removed */}
        </div>
      </nav>
    </header>
  );
}
