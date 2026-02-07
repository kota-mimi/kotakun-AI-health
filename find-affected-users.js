const { admin } = require('./src/lib/firebase-admin.js');

async function findAffectedUsers() {
  try {
    console.log('🔍 課金済みだが制限されているユーザーを検索中...');
    
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('subscriptionStatus', '==', 'active')
      .get();
    
    console.log(`✅ 発見: ${usersSnapshot.size} 人のアクティブユーザー`);
    
    const affectedUsers = [];
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      // プラン情報をチェック
      if (!userData.currentPlan || userData.currentPlan === '無料プラン') {
        affectedUsers.push({
          userId,
          subscriptionStatus: userData.subscriptionStatus,
          currentPlan: userData.currentPlan || 'undefined',
          stripeSubscriptionId: userData.stripeSubscriptionId,
          currentPeriodEnd: userData.currentPeriodEnd,
        });
      }
    }
    
    console.log(`⚠️  影響を受けたユーザー: ${affectedUsers.length} 人`);
    
    if (affectedUsers.length > 0) {
      console.log('\n影響を受けたユーザー一覧:');
      affectedUsers.forEach((user, index) => {
        console.log(`${index + 1}. userId: ${user.userId}`);
        console.log(`   プラン: ${user.currentPlan}`);
        console.log(`   サブスクID: ${user.stripeSubscriptionId}`);
        console.log(`   期間終了: ${user.currentPeriodEnd ? user.currentPeriodEnd.toDate() : 'N/A'}`);
        console.log('');
      });
    }
    
    return affectedUsers;
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

findAffectedUsers();