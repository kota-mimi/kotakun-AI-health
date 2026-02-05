// あなたのIDを完全リセットして新規ユーザー状態にする
const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';

const resetData = {
  userId,
  subscriptionStatus: 'inactive',
  currentPlan: 'free', 
  hasUsedTrial: false, // 重要：トライアル利用履歴をリセット
  createdAt: new Date(),
  updatedAt: new Date()
  // 古いデータは全て削除（null設定）
  // stripeCustomerId: null,
  // stripeSubscriptionId: null,
  // cancelledAt: null,
  // currentPeriodEnd: null,
  // trialEndDate: null
};

fetch('http://localhost:3000/api/debug-trial', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'reset_user',
    userId,
    resetData
  })
}).then(r => r.text()).then(console.log).catch(console.error);