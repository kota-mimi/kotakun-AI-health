// ユーザーの実際のAPIレスポンスをテスト
const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';

async function testUserAPI() {
  try {
    console.log('🔍 ユーザーAPIをテスト:', userId);
    
    const response = await fetch(`https://healthy-kun.com/api/plan/current?userId=${userId}`);
    const data = await response.json();
    
    console.log('📄 APIレスポンス:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ APIテストエラー:', error);
  }
}

testUserAPI();