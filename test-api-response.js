const dotenv = require('dotenv');
const admin = require('firebase-admin');

// .env.localファイルを読み込み
dotenv.config({ path: '.env.local' });

// Firebase Admin初期化
if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'healthy-kun';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });

    console.log('✅ Firebase Admin初期化完了');
  } catch (error) {
    console.error('❌ Firebase初期化エラー:', error);
    process.exit(1);
  }
}

// API処理を再現
async function simulateAPIResponse(userId) {
  const db = admin.firestore();
  
  console.log(`🔍 ${userId} のAPI応答をシミュレート中...`);
  console.log('');

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const currentPlan = userData?.currentPlan;
      const subscriptionStatus = userData?.subscriptionStatus || 'inactive';
      const currentPeriodEnd = userData?.currentPeriodEnd?.toDate?.() || null;
      const stripeSubscriptionId = userData?.stripeSubscriptionId || null;
      
      console.log('📊 Firestoreデータ:');
      console.log('- currentPlan:', currentPlan);
      console.log('- subscriptionStatus:', subscriptionStatus);
      console.log('- currentPeriodEnd:', currentPeriodEnd);
      console.log('- stripeSubscriptionId:', stripeSubscriptionId);
      console.log('');
      
      // プラン名を標準形式に変換（APIロジック再現）
      let plan = 'free';
      let planName = '無料プラン';
      
      // お試し期間中の場合（3日間無制限）
      if (subscriptionStatus === 'trial' || subscriptionStatus === 'cancel_at_period_end') {
        const trialEnd = userData?.trialEndDate?.toDate();
        if (trialEnd && new Date() < trialEnd) {
          console.log('🎁 お試し期間中/解約予定: 月額プラン扱い');
          plan = 'monthly';
          planName = subscriptionStatus === 'cancel_at_period_end' 
            ? '月額プラン（お試し期間中・解約予定）'
            : '月額プラン（お試し期間中）';
        }
      }
      // 永続プランの場合
      else if (subscriptionStatus === 'lifetime') {
        plan = 'lifetime';
        planName = currentPlan || '永久利用プラン';
      }
      // 通常のアクティブプランの場合
      else if (subscriptionStatus === 'active' || subscriptionStatus === 'cancel_at_period_end') {
        console.log('✅ アクティブプラン処理に入りました');
        if (currentPlan === '月額プラン') {
          plan = 'monthly';
          planName = '月額プラン';
        } else if (currentPlan === '3ヶ月プラン') {
          plan = 'quarterly';  
          planName = '3ヶ月プラン';
        } else if (currentPlan === '半年プラン') {
          plan = 'biannual';
          planName = '半年プラン';
          console.log('🎯 半年プランとして認識');
        }
      }
      // cancelledの場合（現在のAPIでは処理されない）
      else if (subscriptionStatus === 'cancelled') {
        console.log('❌ cancelledステータスは処理されない → 無料プラン扱い');
        if (currentPeriodEnd && new Date() < currentPeriodEnd) {
          console.log(`⏰ でも期限は残ってる: ${currentPeriodEnd}`);
        }
      }
      
      console.log('🎯 API応答結果:');
      console.log('- plan:', plan);
      console.log('- planName:', planName);
      console.log('- status:', subscriptionStatus);
      console.log('- currentPeriodEnd:', currentPeriodEnd);
      
      return {
        success: true,
        plan,
        planName,
        status: subscriptionStatus,
        currentPeriodEnd,
        stripeSubscriptionId
      };
      
    } else {
      console.log('❌ ユーザードキュメント未存在');
      return {
        success: true,
        plan: 'free',
        planName: '無料プラン',
        status: 'inactive'
      };
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

async function testBothUsers() {
  console.log('🧪 両方のユーザーのAPI応答をテスト');
  console.log('');
  
  // 1. 実際の課金ユーザー
  console.log('1️⃣ 実際の課金ユーザー:');
  await simulateAPIResponse('U495bd12b195b7be12845147ebcafb316');
  
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  
  // 2. あなた（解約後）
  console.log('2️⃣ あなた（解約後）:');
  await simulateAPIResponse('U7fd12476d6263912e0d9c99fc3a6bef9');
}

testBothUsers().then(() => {
  console.log('');
  console.log('🏁 テスト完了');
  process.exit(0);
}).catch((error) => {
  console.error('💥 処理失敗:', error);
  process.exit(1);
});