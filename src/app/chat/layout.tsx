import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "kotakun チャット",
  description: "健康管理アシスタント kotakun との会話",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}