// Webhookの価格ID認識テスト用スクリプト

async function testWebhookPriceDetection() {
  console.log('🧪 Webhook価格ID認識テスト');
  
  // 実際の本番価格ID（スクリーンショットから取得）
  const actualPriceIds = {
    biannual: 'price_1SNx4vKToWVElLyI2TyVD67H',
    monthly: 'price_1SMtSoKToWVElLyIFBXDDdgs'
  };
  
  // 環境変数の価格ID
  const envPriceIds = {
    biannual: process.env.STRIPE_BIANNUAL_PRICE_ID,
    monthly: process.env.STRIPE_MONTHLY_PRICE_ID
  };
  
  console.log('\n📋 価格ID比較:');
  console.log('半年プラン:');
  console.log(`  実際: ${actualPriceIds.biannual}`);
  console.log(`  環境変数: ${envPriceIds.biannual}`);
  console.log(`  一致: ${actualPriceIds.biannual === envPriceIds.biannual ? '✅' : '❌'}`);
  
  console.log('\n月額プラン:');
  console.log(`  実際: ${actualPriceIds.monthly}`);
  console.log(`  環境変数: ${envPriceIds.monthly}`);
  console.log(`  一致: ${actualPriceIds.monthly === envPriceIds.monthly ? '✅' : '❌'}`);
  
  // Webhookロジックのシミュレーション
  console.log('\n🔄 Webhookロジック シミュレーション:');
  
  function simulateWebhookPlanDetection(priceId) {
    let currentPlan = '月額プラン'; // デフォルト
    
    if (priceId === envPriceIds.biannual) {
      currentPlan = '半年プラン';
    } else if (priceId === envPriceIds.monthly) {
      currentPlan = '月額プラン';
    }
    
    return currentPlan;
  }
  
  console.log(`半年プラン価格ID → ${simulateWebhookPlanDetection(actualPriceIds.biannual)}`);
  console.log(`月額プラン価格ID → ${simulateWebhookPlanDetection(actualPriceIds.monthly)}`);
}

testWebhookPriceDetection();