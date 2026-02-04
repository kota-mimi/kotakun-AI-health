require('dotenv').config({ path: '.env.local' });
const { admin } = require('./src/lib/firebase-admin.ts');

async function checkRealUser() {
  const userId = 'U495bd12b195b7be12845147ebcafb316'; // 実際の課金ユーザー
  
  console.log(`🔍 実際の課金ユーザー ${userId} のデータを詳細確認中...`);
  
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('\n📊 Firestoreデータ:');
      console.log('- currentPlan:', userData?.currentPlan);
      console.log('- subscriptionStatus:', userData?.subscriptionStatus);
      console.log('- currentPeriodEnd:', userData?.currentPeriodEnd?.toDate ? userData.currentPeriodEnd.toDate() : userData?.currentPeriodEnd);
      console.log('- stripeSubscriptionId:', userData?.stripeSubscriptionId);
      console.log('- createdAt:', userData?.createdAt?.toDate ? userData.createdAt.toDate() : userData?.createdAt);
      console.log('- updatedAt:', userData?.updatedAt?.toDate ? userData.updatedAt.toDate() : userData?.updatedAt);
      
      // UI表示条件の計算
      const status = userData?.subscriptionStatus || 'inactive';
      const plan = userData?.currentPlan;
      const periodEnd = userData?.currentPeriodEnd?.toDate ? userData.currentPeriodEnd.toDate() : null;
      
      console.log('\n🖥️ UI表示条件の計算:');
      console.log('解約ボタン表示条件:');
      console.log(`- status === 'active' || status === 'trial': ${status === 'active' || status === 'trial'}`);
      console.log(`- plan !== 'free': ${plan !== 'free'}`);  
      console.log(`- status !== 'lifetime': ${status !== 'lifetime'}`);
      console.log(`- !plan?.startsWith('crowdfund'): ${!plan?.startsWith('crowdfund')}`);
      
      const shouldShowCancelButton = (status === 'active' || status === 'trial') && 
                                   plan !== 'free' && 
                                   status !== 'lifetime' && 
                                   !plan?.startsWith('crowdfund');
      
      console.log(`-> 解約ボタン表示: ${shouldShowCancelButton}`);
      console.log(`-> 期限表示: ${periodEnd ? periodEnd.toLocaleDateString('ja-JP') : 'なし'}`);
      
      // APIレスポンスもテスト
      console.log('\n🎯 API応答をシミュレート:');
      const response = await fetch(`http://localhost:3000/api/plan/current?userId=${userId}`);
      if (response.ok) {
        const apiData = await response.json();
        console.log('API結果:', apiData);
      } else {
        console.log('❌ API呼び出し失敗');
      }
      
    } else {
      console.log('❌ ユーザーデータが見つかりません');
    }
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkRealUser();