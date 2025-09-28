import React from 'react';

interface SimpleMealDeleteProps {
  mealId: string;
  onDeleteSuccess: () => void;
}

export function SimpleMealDelete({ mealId, onDeleteSuccess }: SimpleMealDeleteProps) {
  const handleDelete = async () => {
    console.log('🚨🚨🚨 SimpleMealDelete: Starting deletion for:', mealId);
    
    if (!window.confirm('この食事記録を削除しますか？')) {
      console.log('🚨 SimpleMealDelete: User cancelled');
      return;
    }

    try {
      console.log('🚨 SimpleMealDelete: Calling DELETE API');
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

      console.log('🚨 SimpleMealDelete: Response status:', response.status);
      
      if (response.ok) {
        console.log('🚨🚨🚨 SimpleMealDelete: DELETE SUCCESS!');
        alert('削除しました！');
        onDeleteSuccess();
      } else {
        console.error('🚨 SimpleMealDelete: DELETE FAILED');
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('🚨 SimpleMealDelete: Error:', error);
      alert('エラーが発生しました');
    }
  };

  return (
    <button
      onClick={handleDelete}
      style={{
        background: 'red',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      🗑️ 削除テスト
    </button>
  );
}