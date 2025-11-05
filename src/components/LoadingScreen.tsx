import React from 'react';
import { Heart, Activity, Scale, Utensils } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "健康データを読み込み中..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col items-center justify-center z-50">
      {/* ブランドロゴエリア */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
          <Heart className="w-10 h-10 text-white animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">こたくん</h1>
        <p className="text-sm text-slate-600">AI健康アシスタント</p>
      </div>

      {/* アニメーションアイコン */}
      <div className="flex space-x-6 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0s' }}>
          <Activity className="w-6 h-6 text-blue-600" />
        </div>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
          <Scale className="w-6 h-6 text-green-600" />
        </div>
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
          <Utensils className="w-6 h-6 text-orange-600" />
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-64 bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
      </div>

      {/* メッセージ */}
      <p className="text-slate-600 text-center px-8">{message}</p>

      {/* 波アニメーション */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <svg
          className="w-full h-20"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="rgba(59, 130, 246, 0.1)"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}

// フルスクリーンローディング（アプリ起動時用）
export function AppLoadingScreen() {
  return <LoadingScreen message="アプリを起動しています..." />;
}

// データローディング（部分的な読み込み用）
export function DataLoadingScreen({ message }: { message?: string }) {
  return <LoadingScreen message={message} />;
}