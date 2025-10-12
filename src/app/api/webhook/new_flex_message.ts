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
                text: originalMealName || analysis.displayName || analysis.foodItems?.[0] || '食事',
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
            text: analysis.displayName || originalMealName,
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

// 複数食事時間の記録用Flexメッセージ
export function createMultipleMealTimesFlexMessage(mealData: any) {
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
                text: meal.displayName || meal.name,
                size: 'md',
                weight: 'bold',
                color: '#333333',
                flex: 1
              },
              {
                type: 'text',
                text: `${meal.calories || 0}kcal`,
                size: 'md',
                color: '#4a90e2',
                flex: 0
              }
            ]
          },
          // PFC表示（既存の複数食事スタイルに合わせてテキストのみ）
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
          }
        ]
      });
    });
  });

  // 合計セクション
  contents.push({
    type: 'separator',
    margin: 'md'
  });
  
  contents.push({
    type: 'text',
    text: '合計',
    size: 'lg',
    weight: 'bold',
    color: '#333333',
    margin: 'md'
  });

  // 合計PFC表示（既存スタイルに合わせて横一列のボックス）
  contents.push({
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
            text: `P: ${Math.round(totalProtein)}g`,
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
            text: `F: ${Math.round(totalFat)}g`,
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
            text: `C: ${Math.round(totalCarbs)}g`,
            size: 'sm',
            weight: 'bold',
            color: '#00aa00',
            align: 'center'
          }
        ]
      }
    ]
  });

  // カロリー表示（既存スタイルに合わせて右端配置）
  contents.push({
    type: 'text',
    text: `${Math.round(totalCalories)}kcal`,
    size: 'xl',
    weight: 'bold',
    color: '#4a90e2',
    align: 'end',
    margin: 'md'
  });

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

  // 運動詳細を追加
  const details = [];
  
  if (exercise.duration && exercise.duration > 0) {
    details.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '時間',
          size: 'sm',
          color: '#666666',
          flex: 1
        },
        {
          type: 'text',
          text: `${exercise.duration}分`,
          size: 'sm',
          color: '#333333',
          weight: 'bold',
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
        margin: 'sm',
        contents: [
          {
            type: 'text',
            text: `セット${index + 1}`,
            size: 'sm',
            color: '#666666',
            flex: 1
          },
          {
            type: 'text',
            text: `${weightSet.weight}kg × ${weightSet.reps}回`,
            size: 'sm',
            color: '#333333',
            weight: 'bold',
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
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: 'セット',
          size: 'sm',
          color: '#666666',
          flex: 1
        },
        {
          type: 'text',
          text: `${exercise.sets}セット × ${exercise.reps}回`,
          size: 'sm',
          color: '#333333',
          weight: 'bold',
          flex: 0
        }
      ]
    });
  }

  // 単純な回数表示（weightSetsがない場合）
  if (exercise.reps && exercise.reps > 0 && (!exercise.weightSets || exercise.weightSets.length === 0)) {
    details.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '回数',
          size: 'sm',
          color: '#666666',
          flex: 1
        },
        {
          type: 'text',
          text: `${exercise.reps}回`,
          size: 'sm',
          color: '#333333',
          weight: 'bold',
          flex: 0
        }
      ]
    });
  }

  if (exercise.weight && exercise.weight > 0 && !exercise.weightSets) {
    // weightSetsがない場合のみ単体重量表示
    details.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '重量',
          size: 'sm',
          color: '#666666',
          flex: 1
        },
        {
          type: 'text',
          text: `${exercise.weight}kg`,
          size: 'sm',
          color: '#333333',
          weight: 'bold',
          flex: 0
        }
      ]
    });
  }

  if (exercise.distance) {
    details.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '距離',
          size: 'sm',
          color: '#666666',
          flex: 1
        },
        {
          type: 'text',
          text: `${exercise.distance}km`,
          size: 'sm',
          color: '#333333',
          weight: 'bold',
          flex: 0
        }
      ]
    });
  }

  // 強度は表示しない（ユーザー要望により非表示）
  /*
  if (exercise.intensity) {
    details.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '強度',
          size: 'sm',
          color: '#666666',
          flex: 1
        },
        {
          type: 'text',
          text: exercise.intensity,
          size: 'sm',
          color: '#333333',
          weight: 'bold',
          flex: 0
        }
      ]
    });
  }
  */

  // 詳細を追加
  contents.push(...details);

  // カロリー表示
  if (exercise.calories || exercise.caloriesBurned) {
    contents.push({
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
          color: '#333333',
          weight: 'bold',
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
            size: 'sm',
            color: '#666666',
            flex: 1
          },
          {
            type: 'text',
            text: `${exercise.duration}分`,
            size: 'sm',
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
              size: 'sm',
              color: '#666666',
              flex: 1
            },
            {
              type: 'text',
              text: `${weightSet.weight}kg × ${weightSet.reps}回`,
              size: 'sm',
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
            size: 'sm',
            color: '#666666',
            flex: 1
          },
          {
            type: 'text',
            text: `${exercise.sets}セット × ${exercise.reps}回`,
            size: 'sm',
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
            size: 'sm',
            color: '#666666',
            flex: 1
          },
          {
            type: 'text',
            text: `${exercise.weight}kg`,
            size: 'sm',
            color: '#333333',
            flex: 0
          }
        ]
      });
    }

    if (exercise.calories || exercise.caloriesBurned) {
      details.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'xs',
        contents: [
          {
            type: 'text',
            text: 'カロリー',
            size: 'sm',
            color: '#666666',
            flex: 1
          },
          {
            type: 'text',
            text: `${exercise.calories || exercise.caloriesBurned}kcal`,
            size: 'sm',
            color: '#333333',
            weight: 'bold',
            flex: 0
          }
        ]
      });
    }

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
          color: '#333333',
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

// 体重記録用のFlexメッセージ
export function createWeightFlexMessage(weight: number, bodyFat?: number) {
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

  // 体脂肪率がある場合は追加
  if (bodyFat !== undefined && bodyFat !== null) {
    contents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '体脂肪率',
          size: 'sm',
          color: '#666666',
          flex: 1
        },
        {
          type: 'text',
          text: `${bodyFat}%`,
          size: 'sm',
          color: '#4a90e2',
          weight: 'bold',
          flex: 0
        }
      ]
    });
  }

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
