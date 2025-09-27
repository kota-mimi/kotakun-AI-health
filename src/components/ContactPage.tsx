import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !subject || !message) return;
    
    console.log('お問い合わせ送信:', { selectedCategory, subject, message });
    setIsSubmitted(true);
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
            <Button 
              onClick={onBack}
              className="w-full bg-health-primary hover:bg-health-primary-dark text-white"
            >
              戻る
            </Button>
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
            <p className="text-sm text-slate-600">サポート・質問・不具合報告</p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative px-4 py-2 pb-20 space-y-4">
        {/* サポート方法 */}
        <Card className="overflow-hidden">
          <div className="px-4 pt-2 pb-0 border-b border-white/40 bg-white/40">
            <h3 className="font-semibold text-slate-800">サポート方法</h3>
          </div>
          <div className="divide-y divide-white/30">
            {contactMethods.map((method) => (
              <div key={method.id} className="pt-2 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{backgroundColor: `${method.color}15`}}
                    >
                      <method.icon size={18} style={{color: method.color}} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-slate-800">{method.title}</h4>
                        {method.available ? (
                          <Badge className="bg-success/20 text-success text-xs">利用可能</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">要プレミアム</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{method.description}</p>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock size={10} />
                          <span>{method.responseTime}</span>
                        </div>
                        <span>{method.hours}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!method.available}
                    onClick={() => console.log(`${method.title}を開始`)}
                  >
                    <ExternalLink size={14} className="mr-1" />
                    開始
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* お問い合わせフォーム */}
        <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">お問い合わせフォーム</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* カテゴリ選択 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  お問い合わせ種別
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {inquiryCategories.map((category) => (
                    <Button
                      key={category.id}
                      type="button"
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className={`w-full justify-start h-auto p-3 ${
                        selectedCategory === category.id 
                          ? 'bg-health-primary text-white' 
                          : 'hover:bg-white/80'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedCategory === category.id 
                              ? 'bg-white/20' 
                              : ''
                          }`}
                          style={{
                            backgroundColor: selectedCategory === category.id 
                              ? 'rgba(255,255,255,0.2)' 
                              : `${category.color}15`
                          }}
                        >
                          <category.icon 
                            size={16} 
                            style={{
                              color: selectedCategory === category.id 
                                ? 'white' 
                                : category.color
                            }} 
                          />
                        </div>
                        <span className="text-sm">{category.title}</span>
                      </div>
                    </Button>
                  ))}
                </div>
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
                disabled={!selectedCategory || !subject || !message}
                className="w-full bg-health-primary hover:bg-health-primary-dark text-white"
              >
                <Send size={16} className="mr-2" />
                送信する
              </Button>
            </form>
          </div>
        </Card>

        {/* 注意事項 */}
        <Card className="backdrop-blur-xl bg-slate-50/80 shadow-lg border border-slate-200/50 rounded-xl p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-800">ご注意</h4>
            <div className="space-y-1 text-sm text-slate-600">
              <p>• 回答までに最大24時間お時間をいただく場合があります</p>
              <p>• 不具合報告の際は、端末情報とスクリーンショットがあると解決が早くなります</p>
              <p>• 緊急性の高い問題はライブチャットをご利用ください</p>
              <p>• 個人情報や機密情報の記載はお控えください</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}