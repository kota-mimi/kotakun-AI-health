import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft, 
  MessageCircle, 
  Mail,
  Phone,
  Clock,
  Send,
  FileText,
  Bug,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export function ContactPage({ onBack }: ContactPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactMethods = [
    {
      id: 'chat',
      title: 'ライブチャット',
      description: '即座にサポートスタッフと話せます',
      icon: MessageCircle,
      color: '#4682B4',
      available: true,
      responseTime: '平均2分',
      hours: '平日 9:00-18:00'
    },
    {
      id: 'email',
      title: 'メールサポート',
      description: '詳細な質問や要望をお送りください',
      icon: Mail,
      color: '#10B981',
      available: true,
      responseTime: '24時間以内',
      hours: '24時間受付'
    },
    {
      id: 'phone',
      title: '電話サポート',
      description: 'プレミアム会員様専用',
      icon: Phone,
      color: '#F59E0B',
      available: false,
      responseTime: '即時',
      hours: '平日 10:00-17:00'
    }
  ];

  const inquiryCategories = [
    {
      id: 'bug',
      title: '不具合・エラー報告',
      icon: Bug,
      color: '#EF4444'
    },
    {
      id: 'feature',
      title: '機能についての質問',
      icon: FileText,
      color: '#4682B4'
    },
    {
      id: 'suggestion',
      title: '改善提案・要望',
      icon: Lightbulb,
      color: '#F59E0B'
    },
    {
      id: 'account',
      title: 'アカウント・支払い',
      icon: AlertTriangle,
      color: '#8B5CF6'
    },
    {
      id: 'other',
      title: 'その他',
      icon: MessageCircle,
      color: '#6B7280'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !name || !email || !subject || !message) return;
    
    try {
      const categoryTitle = inquiryCategories.find(cat => cat.id === selectedCategory)?.title || selectedCategory;
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          category: categoryTitle,
          subject,
          message,
        }),
      });

      if (response.ok) {
        console.log('メール送信成功');
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        console.error('メール送信エラー:', errorData);
        alert('送信に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('送信エラー:', error);
      alert('送信に失敗しました。もう一度お試しください。');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 max-w-sm mx-auto relative flex items-center justify-center">
        <Card className="backdrop-blur-xl bg-white/90 shadow-lg border border-white/50 rounded-xl p-6 mx-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">送信完了</h2>
              <p className="text-sm text-slate-600 mb-4">
                お問い合わせありがとうございます。<br />
                24時間以内にご返信いたします。
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={onBack}
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                戻る
              </Button>
              <Button 
                onClick={onBack}
                className="flex-1 bg-health-primary hover:bg-health-primary-dark text-white"
              >
                ホームへ
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 max-w-sm mx-auto relative">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-50/20 pointer-events-none" style={{background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.1) 0%, transparent 50%, rgba(70, 130, 180, 0.05) 100%)'}}></div>
      
      {/* ヘッダー */}
      <div className="relative px-4 pt-4 pb-2">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-white/60"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">お問い合わせ</h1>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative px-4 py-2 pb-20 space-y-4">

        {/* お問い合わせフォーム */}
        <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">お問い合わせフォーム</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* カテゴリ選択 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  カテゴリ
                </label>
                <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                  <SelectTrigger className="bg-white/70">
                    <SelectValue placeholder="カテゴリを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {inquiryCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span>{category.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 名前 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  お名前
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="お名前を入力してください"
                  className="bg-white/70"
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  メールアドレス
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレスを入力してください"
                  className="bg-white/70"
                />
              </div>

              {/* 件名 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  件名
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="お問い合わせの件名を入力してください"
                  className="bg-white/70"
                />
              </div>

              {/* メッセージ */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  メッセージ
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="詳細な内容をお書きください。不具合の場合は、発生した状況や操作手順もお教えください。"
                  rows={5}
                  className="bg-white/70"
                />
              </div>

              {/* 送信ボタン */}
              <Button
                type="submit"
                disabled={!selectedCategory || !name || !email || !subject || !message}
                className="w-full bg-health-primary hover:bg-health-primary-dark text-white"
              >
                <Send size={16} className="mr-2" />
                送信する
              </Button>
            </form>
          </div>
        </Card>

      </div>
    </div>
  );
}