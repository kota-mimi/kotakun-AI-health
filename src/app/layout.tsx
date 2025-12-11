import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LiffProvider } from "@/contexts/LiffContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LINEで簡単ダイエット | AI食事記録ヘルシーくん - 無料健康管理アプリ",
  description: "LINEで写真を送るだけでAIが栄養計算！面倒な入力なしで続けられるダイエットアプリ。体重・食事・運動を簡単記録。完全無料で今すぐ始められます。",
  keywords: ["LINE ダイエット", "AI 食事記録", "無料 健康管理アプリ", "写真 栄養計算", "簡単 体重管理", "ダイエット アプリ おすすめ", "食事記録 アプリ", "LINE bot 健康", "AI栄養士", "カロリー計算 自動"],
  openGraph: {
    title: "LINEで簡単ダイエット | AI食事記録ヘルシーくん",
    description: "LINEで写真を送るだけでAIが栄養計算！面倒な入力なしで続けられるダイエットアプリ。完全無料で今すぐ始められます。",
    type: "website",
    locale: "ja_JP",
    siteName: "ヘルシーくん",
    url: "https://kotakun-ai-health.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "LINEで簡単ダイエット | ヘルシーくん",
    description: "写真を送るだけでAIが栄養計算！無料のLINEダイエットアプリ",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <LiffProvider>
            {children}
          </LiffProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
