'use client';

import React, { useState, useEffect } from 'react';

export default function ReloadDashboardPage() {
  const [mealData, setMealData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMealData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: 'U7fd12476d6263912e0d9c99fc3a6bef9',
          date: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMealData(data.mealData);
        console.log('🔄 Meal data loaded:', data.mealData);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMealData();
  }, []);

  const handleDelete = async (mealId: string) => {
    console.log('🗑️ Deleting meal:', mealId);
    
    if (!window.confirm('この食事を削除しますか？')) return;

    try {
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

      if (response.ok) {
        console.log('🎉 Delete successful! Reloading data...');
        alert('削除成功！データを再読み込みします');
        // 削除後、即座にデータを再取得
        await fetchMealData();
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('エラーが発生しました');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔄 リアルタイム食事データ</h1>
      
      <button
        onClick={fetchMealData}
        style={{
          background: '#4682B4',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}
      >
        🔄 データを再読み込み
      </button>

      {isLoading && <p>読み込み中...</p>}

      {mealData && (
        <div>
          <h2>今日の食事データ</h2>
          
          {Object.entries(mealData).map(([mealType, meals]) => (
            <div key={mealType} style={{ marginBottom: '20px' }}>
              <h3>{mealType.toUpperCase()}</h3>
              
              {Array.isArray(meals) && meals.length > 0 ? (
                meals.map((meal, index) => (
                  <div 
                    key={index}
                    style={{
                      border: '1px solid #ccc',
                      padding: '10px',
                      margin: '5px 0',
                      borderRadius: '5px',
                      background: '#f9f9f9'
                    }}
                  >
                    <strong>{meal.name}</strong> - {meal.calories}kcal
                    <br />
                    <small>ID: {meal.id}</small>
                    <br />
                    <button
                      onClick={() => handleDelete(meal.id)}
                      style={{
                        background: 'red',
                        color: 'white',
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '3px',
                        marginTop: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ 削除
                    </button>
                  </div>
                ))
              ) : (
                <p>食事なし</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}