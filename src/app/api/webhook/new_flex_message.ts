export function createMealFlexMessage(mealTypeJa: string, analysis: any, imageUrl: string | null, originalMealName?: string, aiAdvice?: string) {
  // 複数食事の場合
  if (analysis.isMultipleMeals) {
    return createMultipleMealFlexMessage(mealTypeJa, analysis, imageUrl, originalMealName, aiAdvice);
  }
  
  // 単一食事の場合（既存のロジック）
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
                text: analysis.displayName || analysis.foodItems?.[0] || originalMealName || '食事',
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
                paddingAll: '6px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${analysis.protein || 0}g`,
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
                    text: `F: ${analysis.fat || 0}g`,
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
                    text: `C: ${analysis.carbs || 0}g`,
                    size: 'xs',
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
            text: analysis.displayName || analysis.foodItems?.[0] || originalMealName,
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
                paddingAll: '6px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${analysis.protein || 0}g`,
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
                    text: `F: ${analysis.fat || 0}g`,
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
                    text: `C: ${analysis.carbs || 0}g`,
                    size: 'xs',
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
          text: meal.displayName || meal.name,
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

// 複数食事時間の記録用Flexメッセージ
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

// 運動カテゴリ判定関数（拡張版）
function determineExerciseCategory(exercise: any): string {
  const name = exercise.name || exercise.exerciseName || '';
  const type = exercise.type || exercise.exerciseType || '';
  
  // 既存のtypeが設定されている場合は優先
  if (type && ['cardio', 'strength', 'sports', 'flexibility', 'daily', 'water', 'martial_arts', 'dance', 'winter'].includes(type)) {
    return type;
  }
  
  // 運動名から判定
  const exerciseName = name.toLowerCase();
  
  // 水中運動
  if (/水泳|プール|泳|サーフィン|ダイビング|カヤック|ウィンドサーフィン|水中/.test(exerciseName)) {
    return 'water';
  }
  
  // 格闘技
  if (/空手|柔道|剣道|ボクシング|キック|格闘技|武術|合気道/.test(exerciseName)) {
    return 'martial_arts';
  }
  
  // ダンス
  if (/ダンス|踊|社交|ヒップホップ|エアロビクス|バレエ/.test(exerciseName)) {
    return 'dance';
  }
  
  // ウィンタースポーツ
  if (/スキー|スノーボード|スケート|雪/.test(exerciseName)) {
    return 'winter';
  }
  
  // 柔軟性・ストレッチ
  if (/ヨガ|ピラティス|ストレッチ|太極拳|柔軟/.test(exerciseName)) {
    return 'flexibility';
  }
  
  // 筋力トレーニング
  if (/筋トレ|腕立て|腹筋|背筋|スクワット|ベンチ|デッド|プレス|懸垂|バーベル|ダンベル|重量/.test(exerciseName)) {
    return 'strength';
  }
  
  // 有酸素運動
  if (/ランニング|ジョギング|ウォーキング|歩|走|サイクリング|自転車|ハイキング|エアロ/.test(exerciseName)) {
    return 'cardio';
  }
  
  // スポーツ・球技
  if (/野球|サッカー|テニス|バスケ|バレー|卓球|バドミントン|ゴルフ|ボウリング|スポーツ|クライミング/.test(exerciseName)) {
    return 'sports';
  }
  
  // 日常活動
  if (/家事|掃除|ガーデニング|階段|買い物|日常/.test(exerciseName)) {
    return 'daily';
  }
  
  // デフォルト（既存のtypeフィールドがある場合はそれを使用、なければcardio）
  return type || 'cardio';
}

// カテゴリ別の表示項目を決定する関数
function getDisplayItemsForCategory(category: string, exercise: any): any[] {
  const details = [];
  
  // 基本的な時間表示（ほぼ全カテゴリで使用）
  if (exercise.duration && exercise.duration > 0) {
    details.push(createDetailRow('時間', `${exercise.duration}分`));
  }
  
  switch (category) {
    case 'cardio': // 有酸素運動
      if (exercise.steps && exercise.steps > 0) {
        details.push(createDetailRow('歩数', `${exercise.steps.toLocaleString()}歩`));
      }
      if (exercise.distance && exercise.distance > 0) {
        details.push(createDetailRow('距離', `${exercise.distance}km`));
        if (exercise.duration && exercise.duration > 0) {
          const pace = (exercise.duration / exercise.distance).toFixed(1);
          details.push(createDetailRow('ペース', `${pace}分/km`));
        }
      }
      break;
      
    case 'strength': // 筋力トレーニング
      if (exercise.weightSets && exercise.weightSets.length > 0) {
        exercise.weightSets.forEach((weightSet: any, index: number) => {
          let displayText = '';
          if (weightSet.weight && weightSet.weight > 0) {
            displayText = `${weightSet.weight}kg × ${weightSet.reps}回`;
            if (weightSet.sets && weightSet.sets > 1) {
              displayText += ` × ${weightSet.sets}セット`;
            }
          } else {
            displayText = `${weightSet.reps}回`;
            if (weightSet.sets && weightSet.sets > 1) {
              displayText += ` × ${weightSet.sets}セット`;
            }
          }
          details.push(createDetailRow(`セット${index + 1}`, displayText));
        });
      } else {
        if (exercise.sets && exercise.sets > 0 && exercise.reps && exercise.reps > 0) {
          let displayText = '';
          if (exercise.weight && exercise.weight > 0) {
            displayText = `${exercise.weight}kg × ${exercise.reps}回 × ${exercise.sets}セット`;
          } else {
            displayText = `${exercise.reps}回 × ${exercise.sets}セット`;
          }
          details.push(createDetailRow('セット', displayText));
        } else if (exercise.reps && exercise.reps > 0) {
          details.push(createDetailRow('回数', `${exercise.reps}回`));
        }
        if (exercise.weight && exercise.weight > 0 && !exercise.weightSets) {
          details.push(createDetailRow('重量', `${exercise.weight}kg`));
        }
      }
      if (exercise.totalReps && exercise.totalReps > 0) {
        details.push(createDetailRow('総回数', `${exercise.totalReps}回`));
      }
      break;
      
    case 'water': // 水中運動
      if (exercise.distance && exercise.distance > 0) {
        details.push(createDetailRow('距離', `${exercise.distance}km`));
      }
      break;
      
    case 'sports': // スポーツ・球技
      // 基本情報のみ表示（時間は上で共通処理）
      break;
      
    case 'flexibility': // ストレッチ・ヨガ
      // 基本情報のみ表示（時間は上で共通処理）
      break;
      
    case 'martial_arts': // 格闘技
      if (exercise.reps && exercise.reps > 0) {
        details.push(createDetailRow('回数', `${exercise.reps}回`));
      }
      break;
      
    case 'dance': // ダンス
      // 基本情報のみ表示（時間は上で共通処理）
      break;
      
    case 'winter': // ウィンタースポーツ
      if (exercise.distance && exercise.distance > 0) {
        details.push(createDetailRow('距離', `${exercise.distance}km`));
      }
      break;
      
    case 'daily': // 日常活動
      // 基本情報のみ表示（時間は上で共通処理）
      break;
      
    default:
      // その他の場合は基本的な情報のみ
      if (exercise.reps && exercise.reps > 0) {
        details.push(createDetailRow('回数', `${exercise.reps}回`));
      }
      if (exercise.distance && exercise.distance > 0) {
        details.push(createDetailRow('距離', `${exercise.distance}km`));
      }
      break;
  }
  
  // 消費カロリー表示（全カテゴリ共通・青色表示）
  if (exercise.calories || exercise.caloriesBurned) {
    details.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '消費カロリー',
          size: 'sm',
          color: '#666666',
          flex: 1
        },
        {
          type: 'text',
          text: `${exercise.calories || exercise.caloriesBurned || 0}kcal`,
          size: 'sm',
          color: '#4a90e2',
          weight: 'bold',
          flex: 0
        }
      ]
    });
  }
  
  return details;
}

// 詳細行作成ヘルパー関数
function createDetailRow(label: string, value: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    margin: 'sm',
    contents: [
      {
        type: 'text',
        text: label,
        size: 'sm',
        color: '#666666',
        flex: 1
      },
      {
        type: 'text',
        text: value,
        size: 'sm',
        color: '#333333',
        weight: 'bold',
        flex: 0
      }
    ]
  };
}

// 運動記録用のFlexメッセージ
export function createExerciseFlexMessage(exerciseData: any, originalText?: string) {
  const currentTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' });
  
  // 複数運動の場合
  if (exerciseData.isMultipleExercises) {
    return createMultipleExercisesFlexMessage(exerciseData, originalText);
  }
  
  // 単一運動の場合
  const exercise = exerciseData.exercise || exerciseData;
  console.log('🏃‍♂️ Flexメッセージ作成 - exercise data:', JSON.stringify(exercise, null, 2));
  
  // 運動カテゴリの判定（拡張版）
  const exerciseType = determineExerciseCategory(exercise);
  console.log('🏃‍♂️ 運動カテゴリ判定結果:', exerciseType);
  
  // displayNameから回数を抽出してrepsに設定（フォールバック）
  if (!exercise.reps && exercise.displayName) {
    const repsMatch = exercise.displayName.match(/(\d+)回/);
    if (repsMatch) {
      exercise.reps = parseInt(repsMatch[1]);
      console.log('🔄 displayNameから回数を抽出:', exercise.reps);
    }
  }
  
  const contents = [
    // 運動記録ヘッダー
    {
      type: 'text',
      text: '運動記録',
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
    // 運動名と時刻
    {
      type: 'box',
      layout: 'horizontal',
      margin: 'md',
      contents: [
        {
          type: 'text',
          text: exercise.name || '運動',
          size: 'xl',
          weight: 'bold',
          color: '#333333',
          flex: 1,
          wrap: true
        },
        {
          type: 'text',
          text: currentTime,
          size: 'md',
          color: '#999999',
          flex: 0
        }
      ]
    }
  ];

  // カテゴリ別の動的詳細表示
  const details = getDisplayItemsForCategory(exerciseType, exercise);

  // 詳細を追加
  contents.push(...details);

  return {
    type: 'flex',
    altText: '運動記録完了',
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

// 複数運動用のFlexメッセージ
function createMultipleExercisesFlexMessage(exerciseData: any, originalText?: string) {
  const currentTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' });
  
  const contents = [
    // 運動記録ヘッダー
    {
      type: 'text',
      text: '運動記録',
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
    // 時刻表示
    {
      type: 'text',
      text: currentTime,
      size: 'sm',
      color: '#999999',
      align: 'end',
      margin: 'md'
    }
  ];

  let totalCalories = 0;

  // 各運動の詳細
  exerciseData.exercises.forEach((exercise: any) => {
    totalCalories += exercise.calories || exercise.caloriesBurned || 0;
    
    const exerciseContents = [
      {
        type: 'text',
        text: exercise.displayName || exercise.name || '運動',
        size: 'lg',
        weight: 'bold',
        color: '#333333',
        margin: 'md'
      }
    ];

    const details = [];
    
    if (exercise.duration && exercise.duration > 0) {
      details.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'xs',
        contents: [
          {
            type: 'text',
            text: '時間',
            size: 'xs',
            color: '#666666',
            flex: 1
          },
          {
            type: 'text',
            text: `${exercise.duration}分`,
            size: 'xs',
            color: '#333333',
            flex: 0
          }
        ]
      });
    }

    // weightSetsがある場合（複数重量パターン）
    if (exercise.weightSets && exercise.weightSets.length > 0) {
      exercise.weightSets.forEach((weightSet, index) => {
        details.push({
          type: 'box',
          layout: 'horizontal',
          margin: 'xs',
          contents: [
            {
              type: 'text',
              text: `セット${index + 1}`,
              size: 'xs',
              color: '#666666',
              flex: 1
            },
            {
              type: 'text',
              text: `${weightSet.weight && weightSet.weight > 0 ? `${weightSet.weight}kg × ` : ''}${weightSet.reps}回${weightSet.sets && weightSet.sets > 1 ? ` × ${weightSet.sets}セット` : ''}`,
              size: 'xs',
              color: '#333333',
              flex: 0
            }
          ]
        });
      });
    } else if (exercise.sets && exercise.sets > 0 && exercise.reps && exercise.reps > 0) {
      // 通常のセット・回数表示
      details.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'xs',
        contents: [
          {
            type: 'text',
            text: 'セット',
            size: 'xs',
            color: '#666666',
            flex: 1
          },
          {
            type: 'text',
            text: `${exercise.sets}セット × ${exercise.reps}回`,
            size: 'xs',
            color: '#333333',
            flex: 0
          }
        ]
      });
    }

    if (exercise.weight && exercise.weight > 0 && !exercise.weightSets) {
      // weightSetsがない場合のみ異体重量表示
      details.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'xs',
        contents: [
          {
            type: 'text',
            text: '重量',
            size: 'xs',
            color: '#666666',
            flex: 1
          },
          {
            type: 'text',
            text: `${exercise.weight}kg`,
            size: 'xs',
            color: '#333333',
            flex: 0
          }
        ]
      });
    }

    // 複数運動時は個別カロリー表示を削除（合計のみ表示）

    // 運動ボックス
    contents.push({
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      paddingAll: '12px',
      borderWidth: '1px',
      borderColor: '#e0e0e0',
      cornerRadius: '8px',
      contents: [
        ...exerciseContents,
        ...details
      ]
    });
  });

  // 合計カロリー
  if (totalCalories > 0) {
    contents.push({
      type: 'separator',
      margin: 'md',
      color: '#e0e0e0'
    });
    
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
          text: `消費カロリー ${totalCalories}kcal`,
          size: 'sm',
          weight: 'bold',
          color: '#4a90e2',
          flex: 0
        }
      ]
    });
  }

  return {
    type: 'flex',
    altText: '運動記録完了',
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

// カロリー表示専用のFlexメッセージ（記録しない）
export function createCalorieOnlyFlexMessage(analysis: any, originalMealName: string, imageUrl?: string, aiAdvice?: string) {
  // 複数食事の場合
  if (analysis.isMultipleMeals) {
    return createMultipleCalorieOnlyFlexMessage(analysis, originalMealName, imageUrl, aiAdvice);
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
          // 食事名
          {
            type: 'text',
            text: analysis.displayName || analysis.foodItems?.[0] || originalMealName,
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
                paddingAll: '6px',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: `P: ${analysis.protein || 0}g`,
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
                    text: `F: ${analysis.fat || 0}g`,
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
                    text: `C: ${analysis.carbs || 0}g`,
                    size: 'xs',
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
                      flex: 0
                    },
                    {
                      type: 'text',
                      text: '🤖',
                      size: 'sm',
                      flex: 0,
                      margin: 'xs'
                    }
                  ]
                },
                {
                  type: 'text',
                  text: aiAdvice,
                  size: 'xs',
                  color: '#666666',
                  margin: 'sm',
                  wrap: true,
                  lineSpacing: '15px'
                }
              ]
            }
          ] : [])
        ]
      }
    }
  };
}

// 複数食事用のカロリー表示専用Flexメッセージ
function createMultipleCalorieOnlyFlexMessage(analysis: any, originalMealName: string, imageUrl?: string, aiAdvice?: string) {
  // 各食事のアイテムを生成
  const mealItems = analysis.meals.map((meal: any) => [
    {
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: meal.displayName || meal.name,
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
                      flex: 0
                    },
                    {
                      type: 'text',
                      text: '🤖',
                      size: 'sm',
                      flex: 0,
                      margin: 'xs'
                    }
                  ]
                },
                {
                  type: 'text',
                  text: aiAdvice,
                  size: 'xs',
                  color: '#666666',
                  margin: 'sm',
                  wrap: true,
                  lineSpacing: '15px'
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
  const currentTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' });
  
  const contents = [
    // 体重記録ヘッダー
    {
      type: 'text',
      text: '体重記録',
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
    // 体重と時刻
    {
      type: 'box',
      layout: 'horizontal',
      margin: 'md',
      contents: [
        {
          type: 'text',
          text: `${weight}kg`,
          size: 'xl',
          weight: 'bold',
          color: '#333333',
          flex: 1
        },
        {
          type: 'text',
          text: currentTime,
          size: 'md',
          color: '#999999',
          flex: 0
        }
      ]
    }
  ];

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
        contents: contents
      }
    }
  };
}
