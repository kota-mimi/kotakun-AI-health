export function createMealFlexMessage(mealTypeJa: string, analysis: any, imageUrl: string | null, originalMealName?: string) {
  // 複数食事の場合
  if (analysis.isMultipleMeals) {
    return createMultipleMealFlexMessage(mealTypeJa, analysis, imageUrl, originalMealName);
  }
  
  // 単一食事の場合（既存のロジック）
  return {
    type: 'flex',
    altText: `${mealTypeJa}記録完了`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          // 食事タイプヘッダー
          {
            type: 'text',
            text: mealTypeJa,
            size: 'md',
            weight: 'bold',
            color: '#333333',
            margin: 'none'
          },
          // 区切り線
          {
            type: 'separator',
            margin: 'md',
            color: '#e0e0e0'
          },
          // 画像エリア（画像がある場合のみ）
          ...(imageUrl ? [{
            type: 'image',
            url: imageUrl,
            size: 'full',
            aspectRatio: '16:9',
            aspectMode: 'cover',
            backgroundColor: '#f0f0f0',
            margin: 'md'
          }] : []),
          // 食事名と時刻
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: originalMealName || analysis.foodItems?.[0] || '食事',
                size: 'xl',
                weight: 'bold',
                color: '#333333',
                flex: 1,
                wrap: true
              },
              {
                type: 'text',
                text: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }),
                size: 'md',
                color: '#999999',
                flex: 0
              }
            ]
          },
          // PFC表示（横一列）
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#ffe6e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${analysis.protein || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#cc0000',
                    align: 'center'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#fff2e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `F: ${analysis.fat || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#ff8800',
                    align: 'center'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#e6f7e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `C: ${analysis.carbs || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#00aa00',
                    align: 'center'
                  }
                ]
              }
            ]
          },
          // カロリー表示（右端に配置）
          {
            type: 'text',
            text: `${analysis.calories}kcal`,
            size: 'xl',
            weight: 'bold',
            color: '#4a90e2',
            align: 'end',
            margin: 'md'
          }
        ]
      }
    }
  };
}

// 複数食事用のFlexメッセージ
function createMultipleMealFlexMessage(mealTypeJa: string, analysis: any, imageUrl: string | null, originalMealName?: string) {
  const currentTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' });
  
  // 各食事のアイテムを生成（薄い線のフレームで囲む）
  const mealItems = analysis.meals.map((meal: any) => ({
    type: 'box',
    layout: 'vertical',
    margin: 'sm',
    paddingAll: '12px',
    borderWidth: '1px',
    borderColor: '#e0e0e0',
    cornerRadius: '8px',
    spacing: 'xs',
    contents: [
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: meal.name,
            size: 'md',
            weight: 'bold',
            color: '#333333',
            flex: 1
          },
          {
            type: 'text',
            text: `${meal.calories}kcal`,
            size: 'md',
            color: '#4a90e2',
            flex: 0
          }
        ]
      },
      {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        margin: 'xs',
        contents: [
          {
            type: 'text',
            text: ' ',
            flex: 1
          },
          {
            type: 'text',
            text: `P: ${meal.protein}g`,
            size: 'xs',
            color: '#cc0000',
            flex: 0
          },
          {
            type: 'text',
            text: `F: ${meal.fat}g`,
            size: 'xs',
            color: '#ff8800',
            flex: 0
          },
          {
            type: 'text',
            text: `C: ${meal.carbs}g`,
            size: 'xs',
            color: '#00aa00',
            flex: 0
          }
        ]
      }
    ]
  }));

  return {
    type: 'flex',
    altText: `${mealTypeJa}記録完了`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          // 食事タイプヘッダー
          {
            type: 'text',
            text: mealTypeJa,
            size: 'md',
            weight: 'bold',
            color: '#333333',
            margin: 'none'
          },
          // 区切り線
          {
            type: 'separator',
            margin: 'md',
            color: '#e0e0e0'
          },
          // 画像エリア（画像がある場合のみ）
          ...(imageUrl ? [{
            type: 'image',
            url: imageUrl,
            size: 'full',
            aspectRatio: '16:9',
            aspectMode: 'cover',
            backgroundColor: '#f0f0f0',
            margin: 'md'
          }] : []),
          // 時刻表示
          {
            type: 'text',
            text: currentTime,
            size: 'sm',
            color: '#999999',
            align: 'end',
            margin: 'md'
          },
          // 各食事の詳細
          ...mealItems,
          // 区切り線
          {
            type: 'separator',
            margin: 'md',
            color: '#e0e0e0'
          },
          // 合計表示
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '合計',
                size: 'lg',
                weight: 'bold',
                color: '#333333',
                flex: 1
              },
              {
                type: 'text',
                text: `${analysis.totalCalories || analysis.calories || 0}kcal`,
                size: 'xl',
                weight: 'bold',
                color: '#4a90e2',
                flex: 0
              }
            ]
          },
          // 合計PFC表示
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            margin: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#ffe6e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${analysis.totalProtein || analysis.protein || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#cc0000',
                    align: 'center'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#fff2e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `F: ${analysis.totalFat || analysis.fat || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#ff8800',
                    align: 'center'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#e6f7e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `C: ${analysis.totalCarbs || analysis.carbs || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#00aa00',
                    align: 'center'
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  };
}

// カロリー分析用のシンプルなFlexメッセージ
export function createCalorieAnalysisFlexMessage(analysis: any, originalMealName: string) {
  // 複数食事の場合
  if (analysis.isMultipleMeals) {
    return createMultipleCalorieAnalysisFlexMessage(analysis, originalMealName);
  }
  
  // 単一食事の場合
  return {
    type: 'flex',
    altText: `${originalMealName}のカロリー分析`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          // 「カロリー」ヘッダー
          {
            type: 'text',
            text: 'カロリー',
            size: 'md',
            weight: 'bold',
            color: '#333333',
            margin: 'none'
          },
          // 区切り線
          {
            type: 'separator',
            margin: 'md',
            color: '#e0e0e0'
          },
          // 食事名
          {
            type: 'text',
            text: originalMealName,
            size: 'xl',
            weight: 'bold',
            color: '#333333',
            margin: 'md'
          },
          // PFC表示（横一列）
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#ffe6e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${analysis.protein || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#cc0000',
                    align: 'center'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#fff2e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `F: ${analysis.fat || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#ff8800',
                    align: 'center'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#e6f7e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `C: ${analysis.carbs || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#00aa00',
                    align: 'center'
                  }
                ]
              }
            ]
          },
          // カロリー表示（右端に配置）
          {
            type: 'text',
            text: `${analysis.calories}kcal`,
            size: 'xl',
            weight: 'bold',
            color: '#4a90e2',
            align: 'end',
            margin: 'md'
          }
        ]
      }
    }
  };
}

// 複数食事用のカロリー分析Flexメッセージ
function createMultipleCalorieAnalysisFlexMessage(analysis: any, originalMealName: string) {
  // 各食事のアイテムを生成
  const mealItems = analysis.meals.map((meal: any) => [
    {
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: meal.name,
          size: 'md',
          weight: 'bold',
          color: '#333333',
          flex: 1
        },
        {
          type: 'text',
          text: `${meal.calories}kcal`,
          size: 'md',
          color: '#4a90e2',
          flex: 0
        }
      ]
    },
    {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      margin: 'xs',
      contents: [
        {
          type: 'text',
          text: ' ',
          flex: 1
        },
        {
          type: 'text',
          text: `P: ${meal.protein}g`,
          size: 'xs',
          color: '#cc0000',
          flex: 0
        },
        {
          type: 'text',
          text: `F: ${meal.fat}g`,
          size: 'xs',
          color: '#ff8800',
          flex: 0
        },
        {
          type: 'text',
          text: `C: ${meal.carbs}g`,
          size: 'xs',
          color: '#00aa00',
          flex: 0
        }
      ]
    }
  ]).flat();

  return {
    type: 'flex',
    altText: `${originalMealName}のカロリー分析`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          // 「カロリー」ヘッダー
          {
            type: 'text',
            text: 'カロリー',
            size: 'md',
            weight: 'bold',
            color: '#333333',
            margin: 'none'
          },
          // 区切り線
          {
            type: 'separator',
            margin: 'md',
            color: '#e0e0e0'
          },
          // 各食事の詳細
          ...mealItems,
          // 区切り線
          {
            type: 'separator',
            margin: 'md',
            color: '#e0e0e0'
          },
          // 合計表示
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '合計',
                size: 'lg',
                weight: 'bold',
                color: '#333333',
                flex: 1
              },
              {
                type: 'text',
                text: `${analysis.totalCalories || analysis.calories || 0}kcal`,
                size: 'xl',
                weight: 'bold',
                color: '#4a90e2',
                flex: 0
              }
            ]
          },
          // 合計PFC表示
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            margin: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#ffe6e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${analysis.totalProtein || analysis.protein || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#cc0000',
                    align: 'center'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#fff2e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `F: ${analysis.totalFat || analysis.fat || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#ff8800',
                    align: 'center'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#e6f7e6',
                cornerRadius: '8px',
                paddingAll: '8px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `C: ${analysis.totalCarbs || analysis.carbs || 0}g`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#00aa00',
                    align: 'center'
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  };
}