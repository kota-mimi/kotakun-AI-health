import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "読み込み中..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* シンプルなロゴ */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <div className="text-white text-xl font-bold">こ</div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">こたくん</h1>
      </div>

      {/* シンプルなスピナー */}
      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>

      {/* メッセージ */}
      <p className="text-gray-600 text-center">{message}</p>
    </div>
  );
}

// フルスクリーンローディング（アプリ起動時用）
export function AppLoadingScreen() {
  return <LoadingScreen message="アプリを起動中..." />;
}