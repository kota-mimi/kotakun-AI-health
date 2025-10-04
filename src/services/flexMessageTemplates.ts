// Flex Message Templates for Counseling Results

export function createCounselingResultFlexMessage(analysis: any, userProfile: any) {
  const nutritionPlan = analysis.nutritionPlan || {};
  const userName = userProfile.name;
  const age = userProfile.age || 0;
  const gender = userProfile.gender === 'male' ? '男性' : userProfile.gender === 'female' ? '女性' : 'その他';
  const height = parseFloat(userProfile.height) || 0;
  const currentWeight = parseFloat(userProfile.weight) || 0;
  const targetWeight = parseFloat(userProfile.targetWeight) || currentWeight;
  const weightDifference = currentWeight - targetWeight;

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
      size: 'kilo',
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
        backgroundColor: '#33B8F4',
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
                    text: `-${Math.abs(weightDifference)}kg`,
                    size: 'sm',
                    color: '#FC1515',
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