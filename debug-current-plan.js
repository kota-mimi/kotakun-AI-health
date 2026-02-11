// 現在のプラン取得APIをテスト

const testCurrentPlan = async () => {
  try {
    const userId = 'U3a6b36f77d71d0ee539347f4fe1d6424'; // せいたさんのID
    
    console.log('🔍 現在のプラン取得テスト:', userId);
    
    const response = await fetch(`https://kotakun-ai-health.vercel.app/api/plan/current?userId=${userId}`);
    
    const data = await response.json();
    
    console.log('📊 APIレスポンス詳細:');
    console.log('  - success:', data.success);
    console.log('  - plan:', data.plan);
    console.log('  - planName:', data.planName);
    console.log('  - status:', data.status);
    console.log('  - currentPeriodEnd:', data.currentPeriodEnd);
    console.log('  - stripeSubscriptionId:', data.stripeSubscriptionId);
    
    console.log('\n🎯 期待する表示:');
    if (data.status === 'trial') {
      console.log('  - プラン名: 月額プラン（お試し期間中） ✅');
      console.log('  - 期限表示: お試し終了日 ✅');
      console.log('  - ボタン: お試しを終了する ✅');
    } else if (data.status === 'active') {
      console.log('  - プラン名: 月額プラン ✅');
      console.log('  - 期限表示: 次回更新日 ✅');
      console.log('  - ボタン: プランを解約する ✅');
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
};

testCurrentPlan();