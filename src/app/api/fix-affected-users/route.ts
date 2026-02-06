import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 課金済みだが制限されているユーザーを検索中...');
    
    // アクティブなサブスクリプションを持つユーザーを検索
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('subscriptionStatus', '==', 'active')
      .get();
    
    console.log(`✅ 発見: ${usersSnapshot.size} 人のアクティブユーザー`);
    
    const affectedUsers = [];
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      // プラン情報をチェック - activeなのに無料プランまたはプラン情報なし
      if (!userData.currentPlan || userData.currentPlan === '無料プラン') {
        console.log(`⚠️  影響ユーザー発見: ${userId}`);
        affectedUsers.push({
          userId,
          subscriptionStatus: userData.subscriptionStatus,
          currentPlan: userData.currentPlan || 'undefined',
          stripeSubscriptionId: userData.stripeSubscriptionId,
          currentPeriodEnd: userData.currentPeriodEnd,
          updatedAt: userData.updatedAt,
        });
      }
    }
    
    console.log(`⚠️  影響を受けたユーザー: ${affectedUsers.length} 人`);
    
    // 修正が必要な場合の情報を提供
    const needsManualFix = affectedUsers.length > 0;
    
    return NextResponse.json({
      success: true,
      totalActiveUsers: usersSnapshot.size,
      affectedUsers: affectedUsers.length,
      needsManualFix,
      affectedUserDetails: affectedUsers,
      message: needsManualFix 
        ? `${affectedUsers.length}人のユーザーが影響を受けています。手動でプラン情報を修正する必要があります。` 
        : '影響を受けたユーザーは見つかりませんでした。',
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
    return NextResponse.json({ 
      error: 'Failed to check users', 
      details: error.message 
    }, { status: 500 });
  }
}