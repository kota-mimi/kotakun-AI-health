'use client';

import React, { useState } from 'react';

export default function TestDeletePage() {
  const [mealId, setMealId] = useState('meal_1759040130151');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    console.log('🚨🚨🚨 TestDeletePage: Starting deletion for:', mealId);
    
    if (!window.confirm('この食事記録を削除しますか？')) {
      console.log('🚨 TestDeletePage: User cancelled');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('🚨 TestDeletePage: Calling DELETE API');
      const response = await fetch('/api/meals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: 'U7fd12476d6263912e0d9c99fc3a6bef9',
          date: new Date().toISOString().split('T')[0],
          mealType: 'breakfast',
          mealId: mealId
        }),
      });

      console.log('🚨 TestDeletePage: Response status:', response.status);
      
      if (response.ok) {
        console.log('🚨🚨🚨 TestDeletePage: DELETE SUCCESS!');
        alert('削除API呼び出し成功！');
      } else {
        console.error('🚨 TestDeletePage: DELETE FAILED');
        alert('削除APIが失敗しました');
      }
    } catch (error) {
      console.error('🚨 TestDeletePage: Error:', error);
      alert('エラーが発生しました: ' + error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚨 削除機能テストページ</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          削除するMeal ID:
          <input
            type="text"
            value={mealId}
            onChange={(e) => setMealId(e.target.value)}
            style={{
              marginLeft: '10px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '200px'
            }}
          />
        </label>
      </div>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        style={{
          background: isDeleting ? '#ccc' : 'red',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '8px',
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          fontSize: '18px',
          fontWeight: 'bold'
        }}
      >
        {isDeleting ? '削除中...' : '🗑️ 削除APIテスト'}
      </button>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>このボタンを押すと:</p>
        <ul>
          <li>DELETE /api/meals APIが呼び出されます</li>
          <li>ブラウザコンソールに詳細ログが出力されます</li>
          <li>サーバーログにもリクエストが記録されます</li>
        </ul>
      </div>
    </div>
  );
}