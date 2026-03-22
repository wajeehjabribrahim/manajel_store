"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { COLORS } from "@/constants/store";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>مناجل | Manajel</title>
        <meta
          name="description"
          content="مناجل - Manajel: متجر فلسطيني لزيت الزيتون البكر الممتاز والمنتجات التراثية الطبيعية."
        />
        <meta
          name="keywords"
          content="مناجل, manajel, mnajel, زيت زيتون فلسطيني, متجر فلسطيني, زعتر بلدي, منتجات تراثية"
        />
        <meta
          name="theme-color"
          content={COLORS.primary}
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:locale" content="ar_PS" />
        <meta property="og:locale:alternate" content="en_US" />
      </head>
      <body style={{ backgroundColor: "#121416" }} className="flex flex-col min-h-screen antialiased">
        <AuthProvider>
          <LanguageProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <FloatingWhatsApp />
            <CookieConsent />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
