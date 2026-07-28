import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// import CookieConsent from "@/components/CookieConsent"; // لإعادة تشغيل رسالة الموافقة لاحقًا
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import BottomNav from "@/components/BottomNav";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AuthProvider from "@/components/AuthProvider";
import DisableContextMenu from "@/components/DisableContextMenu";
import Toaster from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mnajel.com"),
  title: {
    default: "مناجل | Manajel — زيت زيتون فلسطيني بكر ممتاز",
    template: "%s | مناجل Manajel",
  },
  description:
    "مناجل - Manajel: متجر فلسطيني لزيت الزيتون البكر الممتاز المعصور على البارد والمنتجات التراثية الطبيعية.",
  keywords: [
    "مناجل",
    "manajel",
    "mnajel",
    "زيت زيتون",
    "زيت زيتون فلسطيني",
    "زيت زيتون بكر ممتاز",
    "معصور على البارد",
    "متجر فلسطيني",
    "زعتر بلدي",
    "منتجات تراثية",
  ],
  openGraph: {
    type: "website",
    siteName: "مناجل | Manajel",
    locale: "ar_PS",
    alternateLocale: "en_US",
    images: ["/images/logo.jpg"],
  },
  twitter: {
    card: "summary",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Search Console / Bing Webmaster verification: paste the code into the env
  // vars and the meta tag appears automatically — no code change needed.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : {},
  },
  appleWebApp: {
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF8F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body style={{ backgroundColor: "#FBF8F2" }} className="flex flex-col min-h-screen antialiased">
        <AuthProvider>
          <LanguageProvider>
            <DisableContextMenu />
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <BottomNav />
            <FloatingWhatsApp />
            <Toaster />
            {/* <CookieConsent /> */}
            {/* ملاحظة: تم إيقاف رسالة الموافقة على الخصوصية مؤقتًا. احذف التعليق لإعادة تفعيلها. */}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
