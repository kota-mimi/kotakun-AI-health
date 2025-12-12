'use client';

import { useEffect } from 'react';

export default function SharePage() {
  useEffect(() => {
    // Redirect to the working Vite share page
    window.location.href = 'https://health-share-ten.vercel.app';
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-white text-lg">Redirecting to share page...</div>
    </div>
  );
}