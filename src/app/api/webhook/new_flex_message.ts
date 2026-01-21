export function createMealFlexMessage(mealTypeJa: string, analysis: any, imageUrl: string | null, originalMealName?: string, aiAdvice?: string) {
  // 複数食事の場合
  if (analysis.isMultipleMeals) {
    return createMultipleMealFlexMessage(mealTypeJa, analysis, imageUrl, originalMealName, aiAdvice);
  }
  
  // 単一食事の場合（新しいデザイン）
  return {
    type: 'flex',
    altText: `${mealTypeJa}記録完了`,
    contents: {
      type: 'bubble',
      action: {
        type: 'uri',
        uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          // ヘッダー：食事タイプと詳細を見るボタン
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            margin: 'none',
            contents: [
              {
                type: 'text',
                text: mealTypeJa,
                size: 'lg',
                weight: 'bold',
                color: '#333333',
                flex: 1
              },
              {
                type: 'text',
                text: '詳細を見る',
                size: 'sm',
                color: '#666666',
                align: 'end',
                flex: 0
              }
            ]
          },
          // 区切り線
          {
            type: 'separator',
            margin: 'md',
            color: '#333333'
          },
          // メインコンテンツ：画像と食事情報を横並び
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            margin: 'md',
            contents: [
              // 左側：画像（正方形）
              ...(imageUrl ? [{
                type: 'image',
                url: imageUrl,
                size: 'full',
                aspectRatio: '1:1',
                aspectMode: 'cover',
                backgroundColor: '#f0f0f0',
                flex: 0,
                cornerRadius: '8px'
              }] : [{
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#f0f0f0',
                cornerRadius: '8px',
                paddingAll: '24px',
                flex: 0,
                contents: [
                  {
                    type: 'text',
                    text: '画像なし',
                    size: 'xs',
                    color: '#999999',
                    align: 'center'
                  }
                ]
              }]),
              // 右側：食事情報
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                flex: 1,
                contents: [
                  // 食事名
                  {
                    type: 'text',
                    text: '食事名',
                    size: 'sm',
                    color: '#666666',
                    margin: 'none'
                  },
                  {
                    type: 'text',
                    text: analysis.displayName || analysis.foodItems?.[0] || originalMealName || '食事',
                    size: 'md',
                    weight: 'bold',
                    color: '#333333',
                    wrap: true,
                    margin: 'xs'
                  },
                  // カロリー
                  {
                    type: 'text',
                    text: 'カロリー',
                    size: 'sm',
                    color: '#666666',
                    margin: 'sm'
                  },
                  {
                    type: 'text',
                    text: `${analysis.calories || 0}kcal`,
                    size: 'xl',
                    weight: 'bold',
                    color: '#333333',
                    margin: 'xs'
                  },
                  // PFC（横3列）
                  {
                    type: 'box',
                    layout: 'horizontal',
                    spacing: 'md',
                    margin: 'sm',
                    contents: [
                      {
                        type: 'box',
                        layout: 'vertical',
                        flex: 1,
                        contents: [
                          {
                            type: 'text',
                            text: 'P',
                            size: 'sm',
                            color: '#666666',
                            align: 'center'
                          },
                          {
                            type: 'text',
                            text: `${analysis.protein || 0}g`,
                            size: 'sm',
                            weight: 'bold',
                            color: '#333333',
                            align: 'center',
                            margin: 'xs'
                          }
                        ]
                      },
                      {
                        type: 'box',
                        layout: 'vertical',
                        flex: 1,
                        contents: [
                          {
                            type: 'text',
                            text: 'f',
                            size: 'sm',
                            color: '#666666',
                            align: 'center'
                          },
                          {
                            type: 'text',
                            text: `${analysis.fat || 0}g`,
                            size: 'sm',
                            weight: 'bold',
                            color: '#333333',
                            align: 'center',
                            margin: 'xs'
                          }
                        ]
                      },
                      {
                        type: 'box',
                        layout: 'vertical',
                        flex: 1,
                        contents: [
                          {
                            type: 'text',
                            text: 'c',
                            size: 'sm',
                            color: '#666666',
                            align: 'center'
                          },
                          {
                            type: 'text',
                            text: `${analysis.carbs || 0}g`,
                            size: 'sm',
                            weight: 'bold',
                            color: '#333333',
                            align: 'center',
                            margin: 'xs'
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          // 区切り線（AIアドバイスがある場合のみ）
          ...(aiAdvice ? [{
            type: 'separator',
            margin: 'lg',
            color: '#333333'
          }] : []),
          // AIアドバイスセクション（aiAdviceがある場合のみ）
          ...(aiAdvice ? [
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md',
              contents: [
                {
                  type: 'text',
                  text: 'AIアドバイス',
                  size: 'md',
                  weight: 'bold',
                  color: '#333333',
                  margin: 'none'
                },
                {
                  type: 'text',
                  text: aiAdvice,
                  size: 'sm',
                  color: '#333333',
                  wrap: true,
                  margin: 'sm',
                }
              ]
            }
          ] : [])
        ]
      }
    }
  };
}

// 複数食事用のFlexメッセージ
function createMultipleMealFlexMessage(mealTypeJa: string, analysis: any, imageUrl: string | null, originalMealName?: string, aiAdvice?: string) {
  const currentTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' });
  
  // 各食事のアイテムを生成（薄い線のフレームで囲む）
  const mealItems = analysis.meals.map((meal: any) => ({
    type: 'box',
    layout: 'vertical',
    margin: 'xs',
    paddingAll: '8px',
    borderWidth: '1px',
    borderColor: '#e0e0e0',
    cornerRadius: '8px',
    spacing: 'xs',
    contents: [
      {
        type: 'text',
        text: meal.displayName || meal.name,
        size: 'md',
        weight: 'bold',
        color: '#333333',
        wrap: true
      },
      {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        margin: 'xs',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            flex: 1,
            contents: [
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
          },
          {
            type: 'text',
            text: `${meal.calories}kcal`,
            size: 'md',
            color: '#4a90e2',
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
      action: {
        type: 'uri',
        uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          // 食事タイプヘッダー（右上に詳細ボタン付き）
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            margin: 'none',
            contents: [
              {
                type: 'text',
                text: mealTypeJa,
                size: 'md',
                weight: 'bold',
                color: '#333333',
                flex: 3
              },
              {
                type: 'text',
                text: '詳細',
                size: 'xs',
                color: '#999999',
                align: 'end',
                flex: 0
              }
            ]
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
            size: 'xs',
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
                paddingAll: '6px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${analysis.totalProtein || analysis.protein || 0}g`,
                    size: 'xs',
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
                paddingAll: '6px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `F: ${analysis.totalFat || analysis.fat || 0}g`,
                    size: 'xs',
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
                paddingAll: '6px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `C: ${analysis.totalCarbs || analysis.carbs || 0}g`,
                    size: 'xs',
                    weight: 'bold',
                    color: '#00aa00',
                    align: 'center'
                  }
                ]
              }
            ]
          },
          // AIアドバイスセクション（aiAdviceがある場合のみ）
          ...(aiAdvice ? [
            {
              type: 'separator',
              margin: 'lg',
              color: '#e0e0e0'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'AIアドバイス',
                      size: 'sm',
                      weight: 'bold',
                      color: '#4a90e2',
                      flex: 1
                    }
                  ],
                  margin: 'none'
                },
                {
                  type: 'text',
                  text: aiAdvice,
                  size: 'xs',
                  color: '#333333',
                  wrap: true,
                  margin: 'sm',
                }
              ]
            }
          ] : [])
        ]
      }
    }
  };
}


// 体重記録用のFlexメッセージ
export function createWeightFlexMessage(weight: number) {
  return {
    type: 'flex',
    altText: '体重記録完了',
    contents: {
      type: 'bubble',
      action: {
        type: 'uri',
        uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '体重記録',
            size: 'md',
            weight: 'bold',
            color: '#333333',
            margin: 'none'
          },
          {
            type: 'separator',
            margin: 'md',
            color: '#e0e0e0'
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '体重',
                size: 'xl',
                weight: 'bold',
                color: '#333333',
                flex: 1
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
          {
            type: 'text',
            text: `${weight}kg`,
            size: 'xxl',
            weight: 'bold',
            color: '#4a90e2',
            align: 'center',
            margin: 'lg'
          }
        ]
      }
    }
  };
}


export function createMultipleMealTimesFlexMessage(mealData: any, aiAdvice?: string) {
  const mealTypeNames = {
    breakfast: '朝食',
    lunch: '昼食', 
    dinner: '夕食',
    snack: '間食'
  };

  const contents = [
    // タイトル
    {
      type: 'text',
      text: '食事記録完了',
      size: 'xl',
      weight: 'bold',
      color: '#333333',
      align: 'center',
      margin: 'none'
    }
  ];

  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  // 各食事時間のセクションを追加
  Object.keys(mealData).forEach(mealTime => {
    const meals = mealData[mealTime];
    const mealTypeJa = mealTypeNames[mealTime] || mealTime;
    
    // 食事時間のヘッダー
    contents.push({
      type: 'separator',
      margin: 'md'
    });
    
    contents.push({
      type: 'text',
      text: mealTypeJa,
      size: 'lg',
      weight: 'bold',
      color: '#333333',
      margin: 'md'
    });

    // 各食事の表示（既存のスタイルに合わせて枠線付きボックス）
    meals.forEach(meal => {
      totalCalories += meal.calories || 0;
      totalProtein += meal.protein || 0;
      totalFat += meal.fat || 0;
      totalCarbs += meal.carbs || 0;

      contents.push({
        type: 'box',
        layout: 'vertical',
        margin: 'xs',
        paddingAll: '6px',
        borderWidth: '1px',
        borderColor: '#e0e0e0',
        cornerRadius: '8px',
        spacing: 'xs',
        contents: [
          {
            type: 'text',
            text: meal.displayName || meal.name,
            size: 'md',
            weight: 'bold',
            color: '#333333',
            wrap: true
          },
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            margin: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                spacing: 'sm',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${meal.protein || 0}g`,
                    size: 'xs',
                    color: '#cc0000',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: `F: ${meal.fat || 0}g`,
                    size: 'xs',
                    color: '#ff8800',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: `C: ${meal.carbs || 0}g`,
                    size: 'xs',
                    color: '#00aa00',
                    flex: 0
                  }
                ]
              },
              {
                type: 'text',
                text: `${meal.calories || 0}kcal`,
                size: 'md',
                color: '#4a90e2',
                flex: 0
              }
            ]
          }
        ]
      });
    });
  });

  // 合計セクション（複数食事アイテムと同じ形式に統一）
  contents.push({
    type: 'separator',
    margin: 'md',
    color: '#e0e0e0'
  });
  
  // 合計ラベル + カロリー（横並び）
  contents.push({
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
        text: `${Math.round(totalCalories)}kcal`,
        size: 'xl',
        weight: 'bold',
        color: '#4a90e2',
        flex: 0
      }
    ]
  });

  // 合計PFC表示（下の行）
  contents.push({
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
        paddingAll: '6px',
        flex: 1,
        contents: [
          {
            type: 'text',
            text: `P: ${Math.round(totalProtein)}g`,
            size: 'xs',
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
        paddingAll: '6px',
        flex: 1,
        contents: [
          {
            type: 'text',
            text: `F: ${Math.round(totalFat)}g`,
            size: 'xs',
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
        paddingAll: '6px',
        flex: 1,
        contents: [
          {
            type: 'text',
            text: `C: ${Math.round(totalCarbs)}g`,
            size: 'xs',
            weight: 'bold',
            color: '#00aa00',
            align: 'center'
          }
        ]
      }
    ]
  });

  // AIアドバイスセクション（提供されている場合のみ表示）
  if (aiAdvice) {
    contents.push(
      {
        type: 'separator',
        margin: 'lg',
        color: '#e0e0e0'
      },
      {
        type: 'box',
        layout: 'vertical',
        margin: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'AIアドバイス',
                size: 'sm',
                weight: 'bold',
                color: '#4a90e2',
                flex: 1
              }
            ],
            margin: 'none'
          },
          {
            type: 'text',
            text: aiAdvice,
            size: 'xs',
            color: '#333333',
            wrap: true,
            margin: 'sm',
          }
        ]
      }
    );
  }

  return {
    type: 'flex',
    altText: '複数食事記録完了',
    contents: {
      type: 'bubble',
      action: {
        type: 'uri',
        uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: contents
      }
    }
  };
}
