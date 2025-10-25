import { useState, useEffect } from 'react';
import { useLiff } from '@/contexts/LiffContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft, 
  MessageCircle, 
  Send,
  FileText,
  Bug,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export function ContactPage({ onBack }: ContactPageProps) {
  const { isLoggedIn, user, context } = useLiff();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 LIFF状態:', { isLoggedIn, user, context });
    if (isLoggedIn && user?.userId) {
      setLineUserId(user.userId);
      console.log('✅ LINE User ID設定:', user.userId);
    } else {
      console.log('⚠️ LINE User ID取得できず');
    }
  }, [isLoggedIn, user, context]);


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
      
      console.log('🔍 送信データ:', {
        name,
        email,
        category: categoryTitle,
        subject,
        message,
        lineUserId
      });
      
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
          lineUserId,
        }),
      });

      console.log('📡 レスポンスステータス:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 送信成功:', result);
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        console.error('❌ メール送信エラー:', errorData);
        alert(`送信に失敗しました: ${errorData.error || 'エラーが発生しました'}`);
      }
    } catch (error) {
      console.error('❌ 送信エラー:', error);
      alert('送信に失敗しました。ネットワークエラーの可能性があります。');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white overflow-y-auto">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
              <span>戻る</span>
            </Button>
            <h1 className="text-lg font-semibold text-gray-800">お問い合わせ</h1>
            <div className="w-16"></div> {/* スペーサー */}
          </div>
        </div>

        <div className="p-4 pb-20 space-y-6 flex items-center justify-center min-h-[60vh]">
          <Card className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mx-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">お問い合わせ</h1>
          <div className="w-16"></div> {/* スペーサー */}
        </div>
      </div>

      <div className="p-4 pb-20 space-y-6">

        {/* お問い合わせフォーム */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">お問い合わせフォーム</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* カテゴリ選択 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  カテゴリ
                </label>
                <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                  <SelectTrigger className="bg-white border border-gray-300">
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
                  className="bg-white border border-gray-300"
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
                  className="bg-white border border-gray-300"
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
                  className="bg-white border border-gray-300"
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
                  className="bg-white border border-gray-300"
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