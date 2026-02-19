"use client";

import Link from "next/link";
import Image from "next/image";
import { COLORS } from "@/constants/store";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { t, language } = useLanguage();

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
          {/* Categories Menu Button & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="hover:opacity-80 transition-opacity p-1"
              title={t("shop.categories")}
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            
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
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:opacity-80 transition-opacity"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Language Switcher & Cart */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/cart"
              className="relative hover:opacity-80 transition-opacity"
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-3 pb-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 hover:opacity-80 transition-opacity"
              >
                {item.name}
              </Link>
            ))}
            <Link href="/cart" className="block py-2 hover:opacity-80">
              {t("nav.cart")}
            </Link>
            <div className="pt-3 border-t border-white/20">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </nav>

      {/* Categories Sidebar */}
      {categoriesOpen && (
        <>
          {/* Sidebar */}
          <div
            className={`fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} h-full w-72 bg-white shadow-xl z-50 transform transition-transform`}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            <div className="p-6">
              {/* Close Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 style={{ color: COLORS.primary }} className="text-xl font-bold">
                  {t("nav.brand")}
                </h2>
                <button
                  onClick={() => setCategoriesOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Menu List */}
              <div className="space-y-3">
                <Link
                  href="/"
                  onClick={() => setCategoriesOpen(false)}
                  className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: COLORS.primary }}
                >
                  <span className="font-semibold">{t("nav.home")}</span>
                </Link>
                
                <Link
                  href="/shop"
                  onClick={() => setCategoriesOpen(false)}
                  className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {t("common.shopNow")}
                </Link>
                
                <Link
                  href="/cart"
                  onClick={() => setCategoriesOpen(false)}
                  className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {t("nav.cart")}
                </Link>
                
                <Link
                  href="/about"
                  onClick={() => setCategoriesOpen(false)}
                  className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {t("nav.about")}
                </Link>
                
                <Link
                  href="/contact"
                  onClick={() => setCategoriesOpen(false)}
                  className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {t("nav.contact")}
                </Link>
                
                <Link
                  href="/faq"
                  onClick={() => setCategoriesOpen(false)}
                  className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {t("nav.faq")}
                </Link>
                
                <Link
                  href="/shipping-policy"
                  onClick={() => setCategoriesOpen(false)}
                  className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {t("policies.shippingPolicy")}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
