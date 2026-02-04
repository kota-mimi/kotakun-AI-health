const fetch = require('node-fetch');

async function deleteUser() {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    
    console.log('🗑️ Firebaseからユーザーデータを削除中...', userId);
    
    // APIエンドポイント経由で削除
    const response = await fetch('https://healthy-kun.com/api/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ ユーザーデータ削除完了！', result);
      console.log('🎯 これで新規ユーザーとして再開始できます');
    } else {
      console.error('❌ 削除エラー:', response.status);
    }
    
  } catch (error) {
    console.error('❌ 削除処理エラー:', error);
  }
}

deleteUser();