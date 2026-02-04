// ユーザーデータを完全リセット（決済テスト用）

async function resetUserData() {
  const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
  
  try {
    console.log('🗑️ ユーザーデータを完全削除中...', userId);
    
    const response = await fetch('https://healthy-kun.com/api/admin/reset-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    const result = await response.json();
    console.log('結果:', result);
    
    if (result.success) {
      console.log('✅ ユーザーデータ削除完了');
      console.log('👤 LINE友達削除 → 再追加で新規ユーザーとして開始してください');
    } else {
      console.log('❌ 削除失敗:', result.error);
    }
    
  } catch (error) {
    console.error('❌ リセットエラー:', error);
  }
}

resetUserData();