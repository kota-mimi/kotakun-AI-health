// 記録メニューを表示
async function showRecordMenu(replyToken: string) {
  const recordMenuMessage = {
    type: 'flex',
    altText: '記録メニュー',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📝 記録メニュー',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#4CAF50',
        paddingAll: 'md'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '📸 写真で食事記録',
              data: 'action=photo_record'
            },
            style: 'primary',
            color: '#FF9800'
          },
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '📝 テキストで記録',
              data: 'action=text_record'
            },
            style: 'secondary',
            margin: 'md'
          }
        ]
      }
    }
  };

  await replyMessage(replyToken, [recordMenuMessage]);
}

// AIアドバイスモードを開始
async function startAIAdviceMode(replyToken: string, userId: string) {
  // AIアドバイスモードのフラグを設定（セッション管理）
  await setAIAdviceMode(userId, true);
  
  const adviceMessage = {
    type: 'flex',
    altText: '🤖 AIアドバイスモード',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🤖 AIアドバイスモード',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#9C27B0',
        paddingAll: 'md'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'こたくんプロ版になりました！',
            weight: 'bold',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: '詳細な健康相談・専門的なアドバイスができます',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: '✨ 利用できる機能',
            weight: 'bold',
            margin: 'md'
          },
          {
            type: 'text',
            text: '• 栄養バランスの詳細分析\n• 運動プログラムの提案\n• 生活習慣の改善案\n• 個別化された健康アドバイス',
            size: 'sm',
            color: '#333333',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'text',
            text: 'お気軽にご相談ください！',
            size: 'sm',
            color: '#9C27B0',
            margin: 'md',
            weight: 'bold'
          }
        ]
      }
    }
  };

  await replyMessage(replyToken, [adviceMessage]);
}

// AIアドバイスモードの設定（簡単なメモリキャッシュ）
const aiAdviceModeUsers = new Set<string>();

async function setAIAdviceMode(userId: string, enabled: boolean) {
  if (enabled) {
    aiAdviceModeUsers.add(userId);
  } else {
    aiAdviceModeUsers.delete(userId);
  }
}

async function isAIAdviceMode(userId: string): Promise<boolean> {
  return aiAdviceModeUsers.has(userId);
}