'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Activity, Apple, TrendingUp, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { 
    isLiffReady, 
    isLoggedIn, 
    liffUser, 
    hasCompletedCounseling,
    login,
    isInClient
  } = useAuth();

  const handleStartCounseling = () => {
    if (!isLoggedIn) {
      login();
      return;
    }
    window.location.href = '/counseling';
  };

  const handleOpenDashboard = () => {
    window.location.href = '/dashboard';
  };

  // ログイン済みでカウンセリング完了の場合はダッシュボードへ直接リダイレクト
  if (isLiffReady && isLoggedIn && hasCompletedCounseling) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-800">LINE健康管理</h1>
          </div>
          <p className="text-gray-600 text-lg">
            AIがあなたの健康をサポートする個人専用アプリ
          </p>
        </div>

        {/* メイン機能紹介 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Apple className="h-10 w-10 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">食事管理</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                食事写真を送るだけでAIが栄養分析。カロリーや栄養バランスを自動で記録します。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Activity className="h-10 w-10 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">運動記録</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                日々の運動や体重変化を記録。目標達成をサポートします。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <TrendingUp className="h-10 w-10 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">健康レポート</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                週次・月次の健康レポートで改善点を可視化。継続的な健康管理をサポート。
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* 開始ボタン */}
        <div className="text-center mb-8">
          <Card className="inline-block">
            <CardContent className="pt-6">
              {!isLiffReady ? (
                <>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    アプリを読み込み中...
                  </h2>
                  <Button 
                    size="lg"
                    disabled
                    className="bg-gray-400 text-white px-8 py-3 text-lg"
                  >
                    読み込み中...
                  </Button>
                </>
              ) : !isLoggedIn ? (
                <>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    LINEでログインして始めましょう
                  </h2>
                  <p className="text-gray-600 mb-6">
                    LINEアカウントでログインして、あなた専用の健康管理を始めましょう
                  </p>
                  <Button 
                    onClick={login}
                    size="lg"
                    className="bg-[#00C300] hover:bg-[#00B200] text-white px-8 py-3 text-lg flex items-center gap-2 mx-auto"
                  >
                    <LogIn className="h-5 w-5" />
                    LINEでログイン
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    まずは健康カウンセリングから始めましょう
                  </h2>
                  <p className="text-gray-600 mb-6">
                    あなたに最適な健康管理プランをAIが作成します
                  </p>
                  <Button 
                    onClick={handleStartCounseling}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  >
                    カウンセリングを始める
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 特徴説明 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
            なぜLINE健康管理を選ぶのか？
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <p>LINEで簡単に食事写真を送信するだけで栄養分析</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>AIによるパーソナライズされた健康アドバイス</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <p>継続的な記録で健康習慣の定着をサポート</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <p>視覚的なグラフで進捗状況を分かりやすく表示</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
