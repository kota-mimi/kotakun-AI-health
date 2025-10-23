// Flex Message Templates for Counseling Results

export function createCounselingResultFlexMessage(analysis: any, userProfile: any) {
  const nutritionPlan = analysis.nutritionPlan || {};
  const userName = userProfile.name;
  console.log('🔍 Flex Template - userProfile.name:', userProfile.name);
  console.log('🔍 Flex Template - userName:', userName);
  const age = userProfile.age || 0;
  const gender = userProfile.gender === 'male' ? '男性' : userProfile.gender === 'female' ? '女性' : 'その他';
  const height = parseFloat(userProfile.height) || 0;
  const currentWeight = parseFloat(userProfile.weight) || 0;
  const targetWeight = parseFloat(userProfile.targetWeight) || currentWeight;
  const weightDifference = Math.round((currentWeight - targetWeight) * 10) / 10;

  // 目標の日本語変換
  const getGoalText = (goal: string) => {
    switch(goal) {
      case 'weight_loss': return '体重を落としたい';
      case 'healthy_beauty': return '健康的にキレイになりたい';
      case 'weight_gain': return '体重を増やしたい';
      case 'muscle_gain': return '筋肉をつけたい';
      case 'lean_muscle': return '筋肉をつけながら痩せたい';
      case 'fitness_improve': return '運動不足解消・体力を向上したい';
      default: return '健康になりたい';
    }
  };

  return {
    type: 'flex',
    altText: `${userName}さんのカウンセリング結果`,
    contents: {
      type: 'bubble',
      size: 'mega',
      action: {
        type: 'uri',
        uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      },
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'カウンセリング結果',
            weight: 'bold',
            color: '#ffffff',
            size: 'xl',
            align: 'center'
          }
        ],
        backgroundColor: '#1E90FF',
        paddingAll: '16px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // BasicInfo: あなたの情報セクション
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'あなたの情報',
                weight: 'bold',
                size: 'md',
                color: '#374151',
                margin: 'lg'
              },
              {
                type: 'separator',
                color: '#F3F4F6',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              // 上段：名前・年齢
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: '名前',
                        size: 'xs',
                        color: '#6B7280',
                        align: 'center'
                      },
                      {
                        type: 'text',
                        text: userName,
                        size: 'sm',
                        color: '#111827',
                        align: 'center',
                        margin: 'xs'
                      }
                    ],
                    flex: 1
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: '年齢',
                        size: 'xs',
                        color: '#6B7280',
                        align: 'center'
                      },
                      {
                        type: 'text',
                        text: `${age}歳`,
                        size: 'sm',
                        color: '#111827',
                        align: 'center',
                        margin: 'xs'
                      }
                    ],
                    flex: 1
                  }
                ]
              },
              // 下段：性別・身長
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: '性別',
                        size: 'xs',
                        color: '#6B7280',
                        align: 'center'
                      },
                      {
                        type: 'text',
                        text: gender,
                        size: 'sm',
                        color: '#111827',
                        align: 'center',
                        margin: 'xs'
                      }
                    ],
                    flex: 1
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: '身長',
                        size: 'xs',
                        color: '#6B7280',
                        align: 'center'
                      },
                      {
                        type: 'text',
                        text: `${height}cm`,
                        size: 'sm',
                        color: '#111827',
                        align: 'center',
                        margin: 'xs'
                      }
                    ],
                    flex: 1
                  }
                ],
                margin: 'sm'
              }
            ],
            backgroundColor: '#F9FAFB',
            borderColor: '#F3F4F6',
            borderWidth: '1px',
            cornerRadius: '4px',
            paddingAll: '12px',
            margin: 'sm'
          },

          // BasicInfo: 体重セクション
          {
            type: 'text',
            text: '体重',
            weight: 'bold',
            size: 'sm',
            color: '#374151',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '現在',
                    size: 'xs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: `${currentWeight}kg`,
                    size: 'sm',
                    color: '#111827',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '目標',
                    size: 'xs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: `${targetWeight}kg`,
                    size: 'sm',
                    color: '#111827',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '目標まで',
                    size: 'xs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: weightDifference > 0 ? `-${Math.abs(weightDifference)}kg` : `+${Math.abs(weightDifference)}kg`,
                    size: 'sm',
                    color: weightDifference > 0 ? '#FC1515' : '#10B981',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              }
            ],
            backgroundColor: '#F9FAFB',
            borderColor: '#F3F4F6',
            borderWidth: '1px',
            cornerRadius: '4px',
            paddingAll: '12px',
            margin: 'sm'
          },

          // DailyTargets: 1日の目安セクション
          {
            type: 'separator',
            color: '#F3F4F6',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '1日の目安',
                weight: 'bold',
                size: 'md',
                color: '#374151',
                margin: 'md'
              },
              {
                type: 'separator',
                color: '#F3F4F6',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'カロリー',
                size: 'xs',
                color: '#6B7280',
                align: 'center'
              },
              {
                type: 'text',
                text: `${nutritionPlan.dailyCalories || 2000}kcal`,
                size: 'sm',
                color: '#2563EB',
                align: 'center',
                margin: 'xs'
              }
            ],
            backgroundColor: '#EFF6FF',
            borderColor: '#DBEAFE',
            borderWidth: '1px',
            cornerRadius: '4px',
            paddingAll: '12px',
            margin: 'sm'
          },

          // DailyTargets: PFCバランス
          {
            type: 'text',
            text: 'PFCバランス',
            weight: 'bold',
            size: 'sm',
            color: '#374151',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'タンパク質',
                    size: 'xs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: `${(nutritionPlan.macros && nutritionPlan.macros.protein) || 120}g`,
                    size: 'sm',
                    color: '#EF4444',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '脂質',
                    size: 'xs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: `${(nutritionPlan.macros && nutritionPlan.macros.fat) || 67}g`,
                    size: 'sm',
                    color: '#F59E0B',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '炭水化物',
                    size: 'xs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: `${(nutritionPlan.macros && nutritionPlan.macros.carbs) || 250}g`,
                    size: 'sm',
                    color: '#10B981',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              }
            ],
            backgroundColor: '#F9FAFB',
            borderColor: '#F3F4F6',
            borderWidth: '1px',
            cornerRadius: '4px',
            paddingAll: '12px',
            margin: 'sm'
          },

        ],
        paddingAll: '16px'
      },
    }
  };
}

// Daily Feedback Flex Message Template
export function createDailyFeedbackFlexMessage(
  feedbackData: {
    date: string;
    weight?: { value: number };
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    exerciseTime: number;
    exercises: Array<{ type: string; duration: number }>;
    mealCount: number;
  },
  feedbackText: string,
  userName?: string,
  targetValues?: {
    targetCalories: number;
    macros: {
      protein: number;
      fat: number;
      carbs: number;
    }
  }
) {
  // フィードバックテキストを解析してセクション分け
  const lines = feedbackText.split('\n').filter(line => line.trim());
  
  // メインセクションを抽出
  const summarySection = extractSection(lines, '📊 今日の記録', '━━━━━━━━━━━━━━━━━━━━');
  const bodySection = extractSection(lines, '🎯 体重管理', '🌟 総合評価');
  const totalSection = extractSection(lines, '🌟 総合評価', '');

  // 達成率計算
  const targetCal = targetValues?.targetCalories || 2000;
  const targetProtein = targetValues?.macros.protein || 120;
  const targetFat = targetValues?.macros.fat || 67;
  const targetCarbs = targetValues?.macros.carbs || 250;
  
  const calorieAchievement = Math.round((feedbackData.calories / targetCal) * 100);
  const proteinAchievement = Math.round((feedbackData.protein / targetProtein) * 100);
  const fatAchievement = Math.round((feedbackData.fat / targetFat) * 100);
  const carbsAchievement = Math.round((feedbackData.carbs / targetCarbs) * 100);

  // 達成状況の判定と色分け
  const getAchievementStatus = (value: number, type: 'calorie' | 'protein' | 'fat' | 'carbs') => {
    if (type === 'calorie') {
      if (value >= 90 && value <= 110) return { text: '良好', color: '#059669' };
      if (value < 90) return { text: '不足', color: '#DC2626' };
      return { text: '過多', color: '#EA580C' };
    }
    if (type === 'protein') {
      if (value >= 80) return { text: '良好', color: '#059669' };
      return { text: '不足', color: '#DC2626' };
    }
    if (type === 'fat' || type === 'carbs') {
      if (value >= 70 && value <= 120) return { text: '良好', color: '#059669' };
      if (value < 70) return { text: '不足', color: '#DC2626' };
      return { text: '過多', color: '#EA580C' };
    }
  };

  const calorieStatus = getAchievementStatus(calorieAchievement, 'calorie');
  const proteinStatus = getAchievementStatus(proteinAchievement, 'protein');
  const fatStatus = getAchievementStatus(fatAchievement, 'fat');
  const carbsStatus = getAchievementStatus(carbsAchievement, 'carbs');

  return {
    type: 'flex',
    altText: `${userName ? userName + 'さんの' : ''}${feedbackData.date}の1日フィードバック`,
    contents: {
      type: 'bubble',
      size: 'mega',
      action: {
        type: 'uri',
        uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      },
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${feedbackData.date} フィードバック`,
            weight: 'bold',
            color: '#ffffff',
            size: 'lg',
            align: 'center'
          }
        ],
        backgroundColor: '#1E90FF',
        paddingAll: '16px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // 今日の記録サマリー
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '今日の記録',
                weight: 'bold',
                size: 'md',
                color: '#374151',
                margin: 'lg'
              },
              {
                type: 'separator',
                color: '#F3F4F6',
                margin: 'sm'
              }
            ]
          },
          
          // カロリー達成率
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '摂取カロリー',
                size: 'sm',
                color: '#374151',
                flex: 2
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: `${feedbackData.calories}`,
                    size: 'sm',
                    color: '#2563EB',
                    weight: 'bold',
                    flex: 0,
                    align: 'end'
                  },
                  {
                    type: 'text',
                    text: `/${targetCal}kcal`,
                    size: 'sm',
                    color: '#6B7280',
                    flex: 0,
                    align: 'end'
                  }
                ],
                flex: 2
              },
              {
                type: 'text',
                text: calorieStatus.text,
                size: 'xs',
                color: calorieStatus.color,
                align: 'end',
                flex: 1,
                weight: 'bold'
              }
            ],
            margin: 'md'
          },
          
          // PFC達成率セクション
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'PFCバランス',
                weight: 'bold',
                size: 'sm',
                color: '#374151',
                margin: 'md'
              },
              // タンパク質
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'タンパク質',
                    size: 'sm',
                    color: '#374151',
                    flex: 2
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: `${feedbackData.protein}`,
                        size: 'sm',
                        color: '#DC2626',
                        weight: 'bold',
                        flex: 0,
                        align: 'end'
                      },
                      {
                        type: 'text',
                        text: `/${targetProtein}g`,
                        size: 'sm',
                        color: '#6B7280',
                        flex: 0,
                        align: 'end'
                      }
                    ],
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: proteinStatus.text,
                    size: 'xs',
                    color: proteinStatus.color,
                    align: 'end',
                    flex: 1,
                    weight: 'bold'
                  }
                ],
                margin: 'sm'
              },
              // 脂質
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '脂質',
                    size: 'sm',
                    color: '#374151',
                    flex: 2
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: `${feedbackData.fat}`,
                        size: 'sm',
                        color: '#F59E0B',
                        weight: 'bold',
                        flex: 0,
                        align: 'end'
                      },
                      {
                        type: 'text',
                        text: `/${targetFat}g`,
                        size: 'sm',
                        color: '#6B7280',
                        flex: 0,
                        align: 'end'
                      }
                    ],
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: fatStatus.text,
                    size: 'xs',
                    color: fatStatus.color,
                    align: 'end',
                    flex: 1,
                    weight: 'bold'
                  }
                ],
                margin: 'xs'
              },
              // 炭水化物
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '炭水化物',
                    size: 'sm',
                    color: '#374151',
                    flex: 2
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: `${feedbackData.carbs}`,
                        size: 'sm',
                        color: '#059669',
                        weight: 'bold',
                        flex: 0,
                        align: 'end'
                      },
                      {
                        type: 'text',
                        text: `/${targetCarbs}g`,
                        size: 'sm',
                        color: '#6B7280',
                        flex: 0,
                        align: 'end'
                      }
                    ],
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: carbsStatus.text,
                    size: 'xs',
                    color: carbsStatus.color,
                    align: 'end',
                    flex: 1,
                    weight: 'bold'
                  }
                ],
                margin: 'xs'
              }
            ]
          },
          
          // 運動記録（縦並び）
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '運動記録',
                weight: 'bold',
                size: 'sm',
                color: '#374151',
                margin: 'md'
              },
              // 運動リスト
              ...(feedbackData.exercises.length > 0 ? 
                feedbackData.exercises.map(exercise => ({
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: `・${exercise.type}`,
                      size: 'sm',
                      color: '#374151',
                      flex: 4
                    },
                    {
                      type: 'text',
                      text: `${exercise.duration}分`,
                      size: 'sm',
                      color: '#6B7280',
                      align: 'end',
                      flex: 2
                    }
                  ],
                  margin: 'sm'
                })) : 
                [{
                  type: 'text',
                  text: '運動記録なし',
                  size: 'sm',
                  color: '#9CA3AF',
                  margin: 'sm'
                }]
              ),
              // 総運動時間
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '総運動時間',
                    size: 'sm',
                    color: '#374151',
                    weight: 'bold',
                    flex: 4
                  },
                  {
                    type: 'text',
                    text: `${feedbackData.exerciseTime}分`,
                    size: 'sm',
                    color: '#059669',
                    align: 'end',
                    flex: 2,
                    weight: 'bold'
                  }
                ],
                margin: 'md',
                backgroundColor: '#F0FDF4',
                paddingAll: '8px',
                cornerRadius: '6px'
              }
            ]
          },

          // 食事評価セクション
          {
            type: 'separator',
            color: '#E0E0E0',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '食事内容の評価',
                weight: 'bold',
                size: 'lg',
                color: '#1E90FF',
                margin: 'md'
              },
              {
                type: 'text',
                text: '良かった点',
                weight: 'bold',
                size: 'md',
                color: '#4CAF50',
                margin: 'md'
              },
              {
                type: 'text',
                text: extractSectionFromText(feedbackText, '【良かった点】', '【改善が必要な点】') || '・栄養バランスを意識した食事選択\n・適切な食事回数の維持',
                size: 'sm',
                color: '#333333',
                wrap: true,
                margin: 'sm'
              },
              {
                type: 'text',
                text: '改善点',
                weight: 'bold',
                size: 'md',
                color: '#FF9800',
                margin: 'md'
              },
              {
                type: 'text',
                text: extractSectionFromText(feedbackText, '【改善が必要な点】', '■ 本日の運動内容の評価') || '・タンパク質摂取量の調整\n・食事タイミングの見直し',
                size: 'sm',
                color: '#333333',
                wrap: true,
                margin: 'sm'
              }
            ]
          },

          // 運動評価セクション
          {
            type: 'separator',
            color: '#E0E0E0',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '運動内容の評価',
                weight: 'bold',
                size: 'lg',
                color: '#1E90FF',
                margin: 'md'
              },
              {
                type: 'text',
                text: '良かった点',
                weight: 'bold',
                size: 'md',
                color: '#4CAF50',
                margin: 'md'
              },
              {
                type: 'text',
                text: extractSectionFromText(feedbackText, '■ 本日の運動内容の評価', '【改善提案】') || '・運動習慣の継続',
                size: 'sm',
                color: '#333333',
                wrap: true,
                margin: 'sm'
              },
              {
                type: 'text',
                text: '改善提案',
                weight: 'bold',
                size: 'md',
                color: '#FF9800',
                margin: 'md'
              },
              {
                type: 'text',
                text: extractSectionFromText(feedbackText, '【改善提案】', '■ 明日からの具体的アクション') || '・運動強度の調整\n・バランスの良い運動プログラム',
                size: 'sm',
                color: '#333333',
                wrap: true,
                margin: 'sm'
              }
            ]
          },

          // アクションセクション
          {
            type: 'separator',
            color: '#E0E0E0',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '明日はこれを試してみて！',
                weight: 'bold',
                size: 'lg',
                color: '#1E90FF',
                margin: 'md'
              },
              {
                type: 'text',
                text: extractSectionFromText(feedbackText, '■ 明日はこれを試してみて！', '') || '・朝食にタンパク質を意識した食事を選んでみよう\n・昼食では野菜を多めに摂取しよう\n・夕方に軽い運動を取り入れてみよう',
                size: 'sm',
                color: '#333333',
                wrap: true,
                margin: 'md',
                maxLines: 10
              }
            ]
          },

        ],
        paddingAll: '16px'
      }
    }
  };
}

// テキストから特定セクションを抽出するヘルパー関数
function extractSection(lines: string[], startMarker: string, endMarker: string): string {
  const startIndex = lines.findIndex(line => line.includes(startMarker));
  if (startIndex === -1) return '';
  
  let endIndex = lines.length;
  if (endMarker) {
    const foundEndIndex = lines.findIndex((line, index) => index > startIndex && line.includes(endMarker));
    if (foundEndIndex !== -1) {
      endIndex = foundEndIndex;
    }
  }
  
  return lines.slice(startIndex + 1, endIndex)
    .filter(line => !line.includes('━━━━━━━━━━━━━━━━━━━━'))
    .join('\n')
    .trim();
}

// テキストを指定文字数で切り詰めるヘルパー関数
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// テキストから特定セクションを抽出するヘルパー関数（文字列版）
function extractSectionFromText(text: string, startMarker: string, endMarker: string): string {
  const lines = text.split('\n').filter(line => line.trim());
  return extractSection(lines, startMarker, endMarker);
}