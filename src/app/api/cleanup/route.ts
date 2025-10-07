import { NextRequest, NextResponse } from 'next/server';
import { cleanupAllTempMealData } from '@/app/api/webhook/route';

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 緊急清掃API実行開始');
    const result = await cleanupAllTempMealData();
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `${result.cleaned}件の一時データを削除しました`
        : `清掃エラー: ${result.error}`,
      cleaned: result.cleaned || 0
    });
  } catch (error: any) {
    console.error('🚨 清掃APIエラー:', error);
    return NextResponse.json(
      { error: error.message || '清掃に失敗しました' },
      { status: 500 }
    );
  }
}