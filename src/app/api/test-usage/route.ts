import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit, getTodayUsage } from '@/utils/usageLimits';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as 'ai' | 'record';

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId and type are required' },
        { status: 400 }
      );
    }

    // 現在の使用状況を確認
    const todayUsage = await getTodayUsage(userId, type);
    const limitCheck = await checkUsageLimit(userId, type);

    console.log('🔍 利用状況確認:', {
      userId,
      type,
      todayUsage,
      limitCheck
    });

    return NextResponse.json({
      success: true,
      userId,
      type,
      todayUsage,
      limitCheck
    });

  } catch (error) {
    console.error('❌ Usage check error:', error);
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    );
  }
}