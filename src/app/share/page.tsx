'use client';

import { useEffect } from 'react';

export default function SharePage() {
  useEffect(() => {
    // Vercelデプロイ済みの共有ページにリダイレクト
    window.location.href = 'https://health-share-ten.vercel.app';
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-white text-lg">共有ページに移動中...</div>
    </div>
  );
}