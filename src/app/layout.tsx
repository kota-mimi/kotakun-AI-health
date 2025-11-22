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
  title: "ヘルシーくん",
  description: "AIを活用した個人向け健康管理サービス",
  keywords: ["健康管理", "LINE", "AI", "食事記録", "運動記録", "ヘルスケア"],
  openGraph: {
    title: "ヘルシーくん",
    description: "AIを活用した個人向け健康管理サービス",
    type: "website",
    locale: "ja_JP",
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
