'use client';

import { UserGuidePage } from '@/components/UserGuidePage';

export default function GuidePage() {
  const handleBack = () => {
    // ダッシュボードに戻る
    window.location.href = '/dashboard';
  };

  return <UserGuidePage onBack={handleBack} />;
}