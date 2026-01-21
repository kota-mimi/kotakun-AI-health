// Flex Message Templates for Counseling Results

export function createCounselingResultFlexMessage(analysis: any, userProfile: any) {
  const nutritionPlan = analysis.nutritionPlan || {};
  const userName = userProfile.name;
  const age = userProfile.age || 0;
  const gender = userProfile.gender === 'male' ? '男性' : userProfile.gender === 'female' ? '女性' : 'その他';
  const height = parseFloat(userProfile.height) || 0;
  const currentWeight = parseFloat(userProfile.weight) || 0;
  const targetWeight = parseFloat(userProfile.targetWeight) || currentWeight;
  const weightDifference = Math.round((currentWeight - targetWeight) * 10) / 10;

  // 目標の日本語変換
  const getGoalText = (goal: string) => {
    switch(goal) {
      case 'rapid_loss': return '集中減量 (-0.7kg/週)';
      case 'moderate_loss': return '標準減量 (-0.5kg/週)';
      case 'slow_loss': return '緩やか減量 (-0.25kg/週)';
      case 'maintenance': return '健康維持 (±0kg/週)';
      case 'lean_gain': return 'リーンゲイン (+0.2kg/週)';
      case 'moderate_gain': return '筋肉増加 (+0.3kg/週)';
      case 'bulk_gain': return 'バルクアップ (+0.5kg/週)';
      // 旧形式のサポート（下位互換性）
      case 'weight_loss': return '体重を落としたい';
      case 'healthy_beauty': return '健康的にキレイになりたい';
      case 'weight_gain': return '体重を増やしたい';
      case 'muscle_gain': return '筋肉をつけたい';
      case 'lean_muscle': return '筋肉をつけながら痩せたい';
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
              },
              {
                type: 'separator',
                color: '#F3F4F6',
                margin: 'sm'
              }
            ]
          },

          // 目安の数値表示
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              // カロリー
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'カロリー',
                    size: 'sm',
                    color: '#374151',
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: `${nutritionPlan.dailyCalories || 1800}kcal`,
                    size: 'sm',
                    color: '#2563EB',
                    weight: 'bold',
                    align: 'end',
                    flex: 2
                  }
                ],
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
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: `${nutritionPlan.macros?.protein || Math.round(((nutritionPlan.dailyCalories || 1800) * 0.25) / 4)}g`,
                    size: 'sm',
                    color: '#DC2626',
                    weight: 'bold',
                    align: 'end',
                    flex: 2
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
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: `${nutritionPlan.macros?.fat || Math.round(((nutritionPlan.dailyCalories || 1800) * 0.30) / 9)}g`,
                    size: 'sm',
                    color: '#F59E0B',
                    weight: 'bold',
                    align: 'end',
                    flex: 2
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
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: `${nutritionPlan.macros?.carbs || Math.round(((nutritionPlan.dailyCalories || 1800) * 0.45) / 4)}g`,
                    size: 'sm',
                    color: '#059669',
                    weight: 'bold',
                    align: 'end',
                    flex: 2
                  }
                ],
                margin: 'xs'
              }
            ],
            backgroundColor: '#F9FAFB',
            borderColor: '#F3F4F6',
            borderWidth: '1px',
            cornerRadius: '4px',
            paddingAll: '12px',
            margin: 'sm'
          },

          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'separator',
                margin: 'md'
              },
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '3日間無料トライアル',
                  uri: 'https://kotakun-ai-health.vercel.app/trial'
                },
                style: 'primary',
                color: '#5BAFCE',
                margin: 'md'
              },
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '詳細データを見る',
                  uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
                },
                style: 'secondary',
                margin: 'xs'
              }
            ]
          }

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
    weightComparison?: { current?: number; previous?: number; change?: number; changeText?: string };
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
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
          
          // 体重比較（摂取カロリーの上に表示）
          ...(feedbackData.weightComparison && feedbackData.weightComparison.current ? [{
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '体重',
                size: 'sm',
                color: '#374151',
                flex: 3
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: `${feedbackData.weightComparison.current}kg`,
                    size: 'sm',
                    color: '#2563EB',
                    weight: 'bold',
                    align: 'end',
                    flex: 0
                  },
                  ...(feedbackData.weightComparison.changeText ? [{
                    type: 'text',
                    text: `(${feedbackData.weightComparison.changeText})`,
                    size: 'xs',
                    color: feedbackData.weightComparison.change && feedbackData.weightComparison.change > 0 ? '#DC2626' : feedbackData.weightComparison.change && feedbackData.weightComparison.change < 0 ? '#059669' : '#6B7280',
                    align: 'end',
                    flex: 0,
                    margin: 'xs'
                  }] : [])
                ],
                flex: 7,
                justifyContent: 'flex-end'
              }
            ],
            margin: 'md'
          }] : []),
          
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
                flex: 3
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: `${feedbackData.calories}kcal`,
                    size: 'sm',
                    color: '#2563EB',
                    weight: 'bold',
                    align: 'end',
                    flex: 0
                  }
                ],
                flex: 3,
                justifyContent: 'flex-end'
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
                    flex: 3
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: `${feedbackData.protein}g`,
                        size: 'sm',
                        color: '#DC2626',
                        weight: 'bold',
                        align: 'end',
                        flex: 0
                      }
                    ],
                    flex: 3,
                    justifyContent: 'flex-end'
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
                    flex: 3
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: `${feedbackData.fat}g`,
                        size: 'sm',
                        color: '#F59E0B',
                        weight: 'bold',
                        align: 'end',
                        flex: 0
                      }
                    ],
                    flex: 3,
                    justifyContent: 'flex-end'
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
                    flex: 3
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: `${feedbackData.carbs}g`,
                        size: 'sm',
                        color: '#059669',
                        weight: 'bold',
                        align: 'end',
                        flex: 0
                      }
                    ],
                    flex: 3,
                    justifyContent: 'flex-end'
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

          // 食事評価セクション
          {
            type: 'separator',
            color: '#E0E0E0',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'text',
                text: '食事評価',
                weight: 'bold',
                size: 'lg',
                color: '#1E90FF'
              },
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'none',
                contents: [
                  {
                    type: 'text',
                    text: '良かった点',
                    weight: 'bold',
                    size: 'md',
                    color: '#4CAF50'
                  },
                  {
                    type: 'text',
                    text: extractSectionFromText(feedbackText, '■ 食事評価', '■ 運動評価').split('改善点:')[0].replace('良かった点:', '') || '・栄養バランスを意識した食事選択ができています\n・3食しっかりと食事を摂られているのが素晴らしいです',
                    size: 'sm',
                    color: '#333333',
                    wrap: true
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'none',
                contents: [
                  {
                    type: 'text',
                    text: '改善点',
                    weight: 'bold',
                    size: 'md',
                    color: '#FF9800'
                  },
                  {
                    type: 'text',
                    text: extractSectionFromText(feedbackText, '■ 食事評価', '■ 運動評価').split('改善点:')[1] || '・野菜不足が気になります\n・水分補給を意識してください',
                    size: 'sm',
                    color: '#333333',
                    wrap: true
                  }
                ]
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

// Recipe Flex Message Template
export function createRecipeFlexMessage(
  recipeName: string,
  ingredients: string[],
  instructions: string[],
  cookingInfo?: {
    cookingTime?: string;
    servings?: string;
    difficulty?: string;
    calories?: string;
    totalCost?: string;
  },
  healthTips?: string
) {
  return {
    type: 'flex',
    altText: `${recipeName}のレシピ`,
    contents: {
      type: 'bubble',
      size: 'mega',
      direction: 'ltr',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: recipeName,
            weight: 'bold',
            color: '#ffffff',
            size: 'xl',
            align: 'center',
            wrap: true
          }
        ],
        backgroundColor: '#1E90FF',
        paddingAll: '8px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // 調理情報セクション（コンパクト化）
          ...(cookingInfo && (cookingInfo.cookingTime || cookingInfo.servings || cookingInfo.calories) ? [{
            type: 'box',
            layout: 'horizontal',
            contents: [
              ...(cookingInfo.cookingTime ? [{
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '時間',
                    size: 'xxs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: cookingInfo.cookingTime,
                    size: 'xs',
                    color: '#111827',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              }] : []),
              ...(cookingInfo.servings ? [{
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '人数',
                    size: 'xxs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: cookingInfo.servings,
                    size: 'xs',
                    color: '#111827',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              }] : []),
              ...(cookingInfo.calories ? [{
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'カロリー',
                    size: 'xxs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: cookingInfo.calories,
                    size: 'xs',
                    color: '#111827',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              }] : []),
              ...(cookingInfo.totalCost ? [{
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '材料費',
                    size: 'xxs',
                    color: '#6B7280',
                    align: 'center'
                  },
                  {
                    type: 'text',
                    text: cookingInfo.totalCost,
                    size: 'xs',
                    color: '#111827',
                    align: 'center',
                    margin: 'xs'
                  }
                ],
                flex: 1
              }] : [])
            ],
            backgroundColor: '#F9FAFB',
            borderColor: '#F3F4F6',
            borderWidth: '1px',
            cornerRadius: '4px',
            paddingAll: '8px',
            margin: 'sm'
          }] : []),
          // 材料セクション（2列表示）
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '材料',
                weight: 'bold',
                size: 'sm',
                color: '#374151',
                margin: 'sm'
              },
              {
                type: 'separator',
                color: '#F3F4F6',
                margin: 'xs'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: ingredients.slice(0, 12).map(ingredient => ({
              type: 'text',
              text: `・${ingredient}`,
              size: 'xs',
              color: '#374151',
              margin: 'xs',
              wrap: true
            })),
            backgroundColor: '#F9FAFB',
            borderColor: '#F3F4F6',
            borderWidth: '1px',
            cornerRadius: '4px',
            paddingAll: '8px',
            margin: 'xs'
          },

          // 作り方セクション（コンパクト化）
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '作り方',
                weight: 'bold',
                size: 'sm',
                color: '#374151',
                margin: 'sm'
              },
              {
                type: 'separator',
                color: '#F3F4F6',
                margin: 'xs'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: instructions.slice(0, 12).map((instruction, index) => ({
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `${index + 1}.`,
                  size: 'xs',
                  color: '#2563EB',
                  weight: 'bold',
                  flex: 0,
                  margin: 'none'
                },
                {
                  type: 'text',
                  text: instruction,
                  size: 'xs',
                  color: '#374151',
                  wrap: true,
                  flex: 5,
                  margin: 'xs'
                }
              ],
              margin: 'xs'
            })),
            backgroundColor: '#F9FAFB',
            borderColor: '#F3F4F6',
            borderWidth: '1px',
            cornerRadius: '4px',
            paddingAll: '8px',
            margin: 'xs'
          }
        ],
        paddingAll: '16px'
      }
    }
  };
}

// 利用制限時のFlexメッセージを作成
export async function createUsageLimitFlex(limitType: "ai" | "record" | "feedback", userId: string) {
  const hashedUserId = hashUserId(userId);
  const liffUrl = process.env.NEXT_PUBLIC_LIFF_ID ? 
    `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard?luid=${hashedUserId}&tab=plan` :
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?luid=${hashedUserId}&tab=plan`;
  
  let hasUsedTrial = false;
  try {
    const { admin } = await import("@/lib/firebase-admin");
    const db = admin.firestore();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const subscriptionStatus = userData?.subscriptionStatus;
      const trialEndDate = userData?.trialEndDate;
      const cancelledAt = userData?.cancelledAt;
      
      hasUsedTrial = (
        subscriptionStatus === "trial" ||
        subscriptionStatus === "cancel_at_period_end" ||
        subscriptionStatus === "active" ||
        subscriptionStatus === "lifetime" ||
        (subscriptionStatus === "inactive" && trialEndDate) ||
        cancelledAt
      );
    } else {
      hasUsedTrial = false;
    }
  } catch (error) {
    hasUsedTrial = false;
  }
  
  let title = "";
  let description = "";
  
  switch (limitType) {
    case "ai":
      title = "AI会話の制限";
      description = "無料プランでは1日3回までAI会話をご利用いただけます。";
      break;
    case "record":
      title = "記録の制限";
      description = "無料プランでは1日1回まで記録をご利用いただけます。";
      break;
    case "feedback":
      title = "フィードバック機能の制限";
      description = "フィードバック機能は有料プランの機能です。";
      break;
  }
  
  return {
    type: "flex",
    altText: `${title}に達しました`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "lg",
            align: "center"
          }
        ],
        backgroundColor: "#FFF4E6",
        paddingAll: "lg"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: description,
            wrap: true,
            size: "md",
            color: "#666666"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "text",
            text: "有料プランにアップグレードすると無制限でご利用いただけます！",
            wrap: true,
            size: "sm",
            color: "#1E90FF",
            weight: "bold",
            margin: "lg"
          }
        ],
        paddingAll: "lg"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: hasUsedTrial ? [
          {
            type: "button",
            action: {
              type: "uri",
              label: "プランをアップグレード",
              uri: liffUrl
            },
            style: "primary",
            color: "#1E90FF"
          }
        ] : [
          {
            type: "button",
            action: {
              type: "uri",
              label: "3日間無料トライアル",
              uri: "https://kotakun-ai-health.vercel.app/trial"
            },
            style: "primary",
            color: "#5BAFCE"
          }
        ],
        paddingAll: "lg"
      }
    }
  };
}

function hashUserId(userId: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(userId + process.env.LINE_CHANNEL_SECRET).digest("hex").substring(0, 16);
}
