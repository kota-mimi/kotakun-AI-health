import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 実際のStripe価格IDをテスト
    const testPriceIds = {
      biannual: 'price_1SNx4vKToWVElLyI2TyVD67H',
      monthly: 'price_1SMtSoKToWVElLyIFBXDDdgs'
    };
    
    console.log('🧪 プラン認識テスト開始');
    console.log('環境変数:', {
      biannual: process.env.STRIPE_BIANNUAL_PRICE_ID,
      monthly: process.env.STRIPE_MONTHLY_PRICE_ID
    });
    
    // Webhookのロジックと同じ判定を実行
    function detectPlan(priceId: string) {
      let currentPlan = '月額プラン'; // デフォルト
      
      console.log(`🔍 価格ID確認: ${priceId}`);
      console.log(`🔍 本番半年ID: ${process.env.STRIPE_BIANNUAL_PRICE_ID}`);
      console.log(`🔍 本番月額ID: ${process.env.STRIPE_MONTHLY_PRICE_ID}`);
      
      if (priceId === process.env.STRIPE_BIANNUAL_PRICE_ID) {
        currentPlan = '半年プラン';
        console.log('✅ 半年プラン認識');
      } else if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) {
        currentPlan = '月額プラン';
        console.log('✅ 月額プラン認識');
      } else {
        console.log('⚠️ 価格IDが一致しません。デフォルト月額プランを適用');
      }
      
      return currentPlan;
    }
    
    const results = {
      biannualTest: {
        priceId: testPriceIds.biannual,
        detectedPlan: detectPlan(testPriceIds.biannual),
        envMatch: testPriceIds.biannual === process.env.STRIPE_BIANNUAL_PRICE_ID
      },
      monthlyTest: {
        priceId: testPriceIds.monthly,
        detectedPlan: detectPlan(testPriceIds.monthly),
        envMatch: testPriceIds.monthly === process.env.STRIPE_MONTHLY_PRICE_ID
      }
    };
    
    console.log('✅ テスト完了:', results);
    
    return NextResponse.json({
      success: true,
      message: 'プラン認識テスト完了',
      results,
      recommendation: results.biannualTest.envMatch && results.monthlyTest.envMatch 
        ? '✅ 環境変数が正しく設定されています'
        : '❌ 環境変数を本番価格IDに更新する必要があります'
    });
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}