const admin = require('firebase-admin');

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'kotakun',
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

async function createMonthlyPlanUser() {
  const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
  
  // 1ヶ月後の日付を計算
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  
  const monthlyUserData = {
    lineUserId: userId,
    subscriptionStatus: 'active',
    currentPlan: '月額プラン',
    currentPeriodEnd: currentPeriodEnd,
    stripeSubscriptionId: 'sub_test_monthly_123', 
    hasCompletedCounseling: true,
    profile: {
      name: '開発者',
      age: 30,
      gender: 'other',
      height: 170,
      weight: 65,
      activityLevel: 'moderate',
      goals: [{
        type: 'fitness_improve',
        targetValue: 65
      }]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
  };
  
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  await userRef.set(monthlyUserData, { merge: true });
  
  console.log(`✅ 月額プランユーザー作成完了: ${userId}`);
  console.log(`📅 期限: ${currentPeriodEnd.toLocaleDateString('ja-JP')}`);
  
  return monthlyUserData;
}

createMonthlyPlanUser()
  .then(data => {
    console.log('作成データ:', data);
    process.exit(0);
  })
  .catch(error => {
    console.error('エラー:', error);
    process.exit(1);
  });