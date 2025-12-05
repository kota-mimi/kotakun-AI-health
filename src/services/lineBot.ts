import type { User } from '@/types';

export class LineBotService {
  private accessToken: string;
  private baseUrl = 'https://api.line.me/v2/bot';

  constructor() {
    this.accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'POST', body?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LINE API Error: ${response.status} ${error}`);
    }

    return method === 'GET' ? response.json() : response;
  }

  // ユーザープロファイル取得
  async getUserProfile(userId: string) {
    return this.makeRequest(`/profile/${userId}`, 'GET');
  }

  // リッチメニュー設定
  async setRichMenu(userId: string, richMenuId: string) {
    return this.makeRequest(`/user/${userId}/richmenu/${richMenuId}`, 'POST');
  }

  // プッシュメッセージ送信
  async pushMessage(userId: string, messages: LineMessage[]) {
    return this.makeRequest('/message/push', 'POST', {
      to: userId,
      messages,
    });
  }

  // マルチキャストメッセージ送信
  async multicastMessage(userIds: string[], messages: LineMessage[]) {
    return this.makeRequest('/message/multicast', 'POST', {
      to: userIds,
      messages,
    });
  }

  // ブロードキャストメッセージ送信
  async broadcastMessage(messages: LineMessage[]) {
    return this.makeRequest('/message/broadcast', 'POST', {
      messages,
    });
  }

  // 健康関連のテンプレートメッセージを生成
  createHealthTemplates() {
    return {
      // 毎日のリマインダー
      dailyReminder: (userName: string): LineMessage => ({
        type: 'template',
        altText: '今日の健康記録はいかがですか？',
        template: {
          type: 'buttons',
          title: `${userName}さん、お疲れさまです！`,
          text: '今日の健康記録はいかがですか？',
          actions: [
            {
              type: 'uri',
              label: '今日の記録を見る',
              uri: `${process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}` : process.env.NEXT_PUBLIC_APP_URL}/dashboard`
            },
            {
              type: 'uri',
              label: '食事を記録',
              uri: `${process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}` : process.env.NEXT_PUBLIC_APP_URL}/meals/add`
            }
          ]
        }
      }),

      // 週次レポート
      weeklyReport: (userName: string, weeklyData: any): LineMessage => ({
        type: 'template',
        altText: '今週の健康レポートができました！',
        template: {
          type: 'buttons',
          title: `${userName}さんの今週のレポート`,
          text: `記録日数: ${weeklyData.recordDays}日\n平均カロリー: ${weeklyData.avgCalories}kcal\n体重変化: ${weeklyData.weightChange}kg`,
          actions: [
            {
              type: 'uri',
              label: '詳細レポートを見る',
              uri: `${process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}` : process.env.NEXT_PUBLIC_APP_URL}/reports`
            }
          ]
        }
      }),

      // 目標達成祝い
      goalAchievement: (goalType: string): LineMessage => ({
        type: 'template',
        altText: '目標達成おめでとうございます！',
        template: {
          type: 'buttons',
          title: '🎉 目標達成！',
          text: `${goalType}の目標を達成しました！\n素晴らしい継続力です！`,
          actions: [
            {
              type: 'uri',
              label: '次の目標を設定',
              uri: `${process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}` : process.env.NEXT_PUBLIC_APP_URL}/profile`
            }
          ]
        }
      }),

      // 食事分析結果
      mealAnalysis: (analysisResult: any): LineMessage => ({
        type: 'template',
        altText: '食事分析が完了しました',
        template: {
          type: 'buttons',
          title: '🍽️ 食事分析完了',
          text: `カロリー: ${analysisResult.calories}kcal\nタンパク質: ${analysisResult.protein}g\n炭水化物: ${analysisResult.carbs}g`,
          actions: [
            {
              type: 'uri',
              label: '詳細を見る',
              uri: `${process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}` : process.env.NEXT_PUBLIC_APP_URL}/meals`
            }
          ]
        }
      }),

      // エラーメッセージ
      error: (errorMessage: string): LineMessage => ({
        type: 'text',
        text: `申し訳ございません。エラーが発生しました。\n\n${errorMessage}\n\nしばらくしてから再度お試しください。`
      })
    };
  }

  // 健康アドバイスメッセージの送信
  async sendHealthAdvice(userId: string, adviceType: 'nutrition' | 'exercise' | 'sleep' | 'general', customMessage?: string) {
    // const templates = this.createHealthTemplates();
    
    const adviceMessages: Record<string, LineMessage> = {
      nutrition: {
        type: 'text',
        text: customMessage || '🥗 栄養バランスを意識した食事を心がけましょう！\n\nタンパク質、炭水化物、脂質をバランスよく摂取することが大切です。'
      },
      exercise: {
        type: 'text',
        text: customMessage || '🏃‍♀️ 運動は健康の基本です！\n\n週に3-5回、30分程度の有酸素運動がおすすめです。'
      },
      sleep: {
        type: 'text',
        text: customMessage || '😴 質の良い睡眠は健康の土台です！\n\n毎日7-8時間の睡眠を心がけ、規則的な生活リズムを保ちましょう。'
      },
      general: {
        type: 'text',
        text: customMessage || '✨ 健康管理は継続が大切です！\n\n小さな変化も積み重ねることで大きな成果につながります。'
      }
    };

    await this.pushMessage(userId, [adviceMessages[adviceType]]);
  }

  // 緊急時のメッセージ（メンテナンスなど）
  async sendMaintenanceNotice(userIds: string[]) {
    const message: LineMessage = {
      type: 'text',
      text: '🔧 メンテナンスのお知らせ\n\nLINE健康管理アプリは現在メンテナンス中です。\n\nご迷惑をおかけして申し訳ございません。\n完了次第お知らせいたします。'
    };

    // 100ユーザーずつに分けて送信（LINE APIの制限）
    for (let i = 0; i < userIds.length; i += 100) {
      const chunk = userIds.slice(i, i + 100);
      await this.multicastMessage(chunk, [message]);
    }
  }
}

// LINE Message types
export interface LineMessage {
  type: 'text' | 'image' | 'template' | 'flex';
  text?: string;
  originalContentUrl?: string;
  previewImageUrl?: string;
  altText?: string;
  template?: any;
  contents?: any;
}

// 古いリッチメニューコード削除済み - 実際のLINEリッチメニューは管理画面で設定

export default LineBotService;