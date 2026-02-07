import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit, getTodayUsage, getUserPlan } from '@/utils/usageLimits';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // ユーザープラン取得
    const userPlan = await getUserPlan(userId);

    // 今日の使用状況取得
    const aiUsage = await getTodayUsage(userId, 'ai');
    const recordUsage = await getTodayUsage(userId, 'record');

    // 制限チェック
    const aiLimit = await checkUsageLimit(userId, 'ai');
    const recordLimit = await checkUsageLimit(userId, 'record');

    return NextResponse.json({
      success: true,
      userId,
      userPlan,
      todayUsage: {
        ai: aiUsage,
        record: recordUsage
      },
      limits: {
        ai: aiLimit,
        record: recordLimit
      }
    });

  } catch (error) {
    console.error('❌ Usage limit test error:', error);
    return NextResponse.json(
      { error: 'Failed to test usage limits' },
      { status: 500 }
    );
  }
}