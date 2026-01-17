'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

export default function TrialPage() {
  const { isLiffReady } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('half-year');
  const [currentSlide, setCurrentSlide] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleStartTrial = () => {
    // TODO: Stripe決済フローに進む
    console.log('トライアル開始:', selectedPlan);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  if (!isLiffReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5BAFCE] mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero Section */}
      <section className="w-full">
        <img src="/hero-image.png" alt="LINEだから続く健康管理" className="w-full h-auto" />
      </section>

      {/* Plan Selection */}
      <section className="px-5 py-8">
        <div className="text-center mb-5">
          <h2 className="text-2xl font-black text-[#2C3E50]">
            健康管理を<span className="text-[#5BAFCE] font-['Poppins']">AI</span>でサポート！
          </h2>
        </div>

        {/* 半年プラン */}
        <div 
          className={`bg-white rounded-2xl p-5 mb-3 border-2 cursor-pointer transition-all relative shadow-sm ${
            selectedPlan === 'half-year' ? 'border-[#5BAFCE] shadow-[0_4px_20px_rgba(91,175,206,0.15)]' : 'border-transparent'
          }`}
          onClick={() => setSelectedPlan('half-year')}
        >
          <span className="absolute -top-3 left-5 bg-[#5BAFCE] text-white px-4 py-1 rounded-full text-xs font-bold shadow-[0_2px_8px_rgba(91,175,206,0.3)]">
            おすすめ！
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedPlan === 'half-year' ? 'border-[#5BAFCE] bg-[#5BAFCE]' : 'border-[#DDD]'
                }`}
              >
                {selectedPlan === 'half-year' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-lg font-bold text-[#2C3E50]">半年プラン</span>
            </div>
            <div className="text-right">
              <div className="font-['Poppins'] text-[28px] font-bold text-[#2C3E50]">
                500<span className="text-sm font-medium">円/月</span>
              </div>
              <div className="text-[13px] text-[#5BAFCE] font-medium">6ヶ月 3,000円</div>
            </div>
          </div>
        </div>

        {/* 月間プラン */}
        <div 
          className={`bg-white rounded-2xl p-5 mb-3 border-2 cursor-pointer transition-all shadow-sm ${
            selectedPlan === 'monthly' ? 'border-[#5BAFCE] shadow-[0_4px_20px_rgba(91,175,206,0.15)]' : 'border-transparent'
          }`}
          onClick={() => setSelectedPlan('monthly')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedPlan === 'monthly' ? 'border-[#5BAFCE] bg-[#5BAFCE]' : 'border-[#DDD]'
                }`}
              >
                {selectedPlan === 'monthly' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-lg font-bold text-[#2C3E50]">月間プラン</span>
            </div>
            <div className="text-right">
              <div className="font-['Poppins'] text-[28px] font-bold text-[#2C3E50]">
                790<span className="text-sm font-medium">円/月</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[15px] text-[#5A6C7D] my-6">
          3日間無料トライアル実施中！<span className="bg-[#D6EEF5] px-2 py-0.5 rounded font-bold">いつでもキャンセル可能です</span>
        </p>

        <Button 
          onClick={handleStartTrial}
          className="w-full bg-[#5BAFCE] hover:bg-[#4A9BBB] text-white border-none rounded-full py-4 text-lg font-bold shadow-[0_8px_24px_rgba(91,175,206,0.3)] hover:translate-y-[-2px] hover:shadow-[0_12px_32px_rgba(91,175,206,0.4)] transition-all"
        >
          無料で3日間試してみる
        </Button>
        <p className="text-center text-xs text-[#95A5B5] mt-3">
          ※既にご利用された方は、3日間無料期間の対象外です。
        </p>
      </section>

      {/* Features Section */}
      <section className="px-5 py-8 bg-white">
        <h2 className="text-[22px] font-bold text-center mb-6 text-[#2C3E50]">
          3日間で<span className="text-[#5BAFCE]">全機能</span>使い放題！
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-[13px] font-bold text-[#2C3E50]">AIと会話</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-[13px] font-bold text-[#2C3E50]">カロリー分析</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-[13px] font-bold text-[#2C3E50]">1日のフィードバック</div>
          </div>
        </div>

        <div className="bg-white rounded-full py-3 px-6 text-center shadow-sm mb-8">
          <span className="text-[#2C3E50]">トライアル期間中は</span>
          <span className="text-[#5BAFCE] font-bold">すべての機能</span>
          <span className="text-[#2C3E50]">が使えます</span>
        </div>

        {/* Feature Showcase */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-center mb-6 text-[#2C3E50]">実際の画面をチェック</h3>
          
          <div className="relative py-5">
            <div className="flex justify-center items-center gap-0">
              {[0, 1, 2, 3].map((index) => {
                let className = "w-[200px] flex-shrink-0 transition-all cursor-pointer opacity-40 scale-[0.85]";
                if (index === currentSlide) {
                  className = "w-[200px] flex-shrink-0 transition-all cursor-pointer opacity-100 scale-100 z-10";
                } else if (index === currentSlide - 1 || index === currentSlide + 1) {
                  className = "w-[200px] flex-shrink-0 transition-all cursor-pointer opacity-60 scale-90";
                }
                
                return (
                  <div key={index} className={className} onClick={() => setCurrentSlide(index)}>
                    <div className="bg-[#1a1a1a] rounded-[36px] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative">
                      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-[#1a1a1a] rounded-b-2xl z-10"></div>
                      <div className="bg-white rounded-[28px] w-full h-[380px] flex items-center justify-center text-[#95A5B5] text-xs overflow-hidden">
                        画像{index + 1}
                      </div>
                    </div>
                    {index === currentSlide && (
                      <div className="text-center mt-3 text-[13px] font-semibold text-[#2C3E50]">
                        {['AIとの会話', 'カロリー分析', '一目で記録が見れる', 'フィードバック'][index]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center gap-2 mt-5">
              {[0, 1, 2, 3].map((index) => (
                <div 
                  key={index}
                  className={`h-2 rounded cursor-pointer transition-all ${
                    index === currentSlide 
                      ? 'w-6 bg-[#5BAFCE] rounded-sm' 
                      : 'w-2 bg-[#D6EEF5]'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Second CTA */}
      <section className="px-5 py-8">
        <p className="text-center text-[15px] text-[#5A6C7D] mb-4">
          3日間無料トライアル実施中！<span className="bg-[#D6EEF5] px-2 py-0.5 rounded font-bold">いつでもキャンセル可能です</span>
        </p>
        <Button 
          onClick={handleStartTrial}
          className="w-full bg-[#5BAFCE] hover:bg-[#4A9BBB] text-white border-none rounded-full py-4 text-lg font-bold shadow-[0_8px_24px_rgba(91,175,206,0.3)]"
        >
          無料で3日間試してみる
        </Button>
        <p className="text-center text-xs text-[#95A5B5] mt-3">
          ※既にご利用された方は、3日間無料期間の対象外です。
        </p>
      </section>

      {/* FAQ Section */}
      <section className="px-5 py-8">
        <h2 className="text-[22px] font-bold text-center mb-6 text-[#2C3E50]">
          よくある<span className="text-[#5BAFCE]">質問</span>
        </h2>

        {[
          {
            q: "本当に無料で使えますか？",
            a: "最初の3日間は完全無料でご利用いただけます。トライアル期間中にキャンセルすれば、料金は一切かかりません。"
          },
          {
            q: "アプリのインストールは必要ですか？",
            a: "LINEだけで完結するサービスです。新しいアプリをインストールする必要はありません。いつも使っているLINEからすぐに始められます。"
          },
          {
            q: "初心者でも使えますか？",
            a: "LINEでメッセージを送るだけの簡単操作です。難しい設定は一切不要で、どなたでもすぐにお使いいただけます。"
          },
          {
            q: "解約はいつでもできますか？",
            a: "解約した場合、解約手続きの次回決済時までご利用いただけます。また、無料お試し期間中でも通常プランに変更可能ですので、ご気軽にお試しください。"
          },
          {
            q: "領収書は発行できますか？",
            a: "無料お試し期間の終了後、いつでも簡単に発行いただけます。"
          }
        ].map((faq, index) => (
          <div key={index} className="bg-white rounded-2xl mb-3 shadow-sm overflow-hidden">
            <div 
              className="p-5 text-[15px] font-bold text-[#2C3E50] flex items-center gap-3 cursor-pointer select-none relative"
              onClick={() => toggleFaq(index)}
            >
              <span className="text-[#5BAFCE] font-['Poppins'] font-bold flex-shrink-0">Q.</span>
              <span className="flex-1">{faq.q}</span>
              <ChevronDown 
                className={`w-4 h-4 text-[#95A5B5] transition-transform ${
                  openFaq === index ? 'rotate-180' : ''
                }`} 
              />
            </div>
            <div 
              className={`overflow-hidden transition-all ${
                openFaq === index ? 'max-h-48 px-5 pb-5' : 'max-h-0'
              }`}
            >
              <div className="border-t border-[#F0EDE8] pt-4">
                <div className="text-[#5BAFCE] font-bold text-[15px] mb-2 flex items-center gap-2">
                  <span className="font-['Poppins']">A.</span>
                  はい、{index === 0 ? '無料です' : index === 1 ? '不要です' : index === 2 ? 'もちろんです' : index === 3 ? 'いつでも解約可能です' : '発行できます'}
                </div>
                <p className="text-sm text-[#5A6C7D] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Notice Section */}
      <section className="px-5 py-8 bg-[#EDF7FA] pb-32">
        <h2 className="text-[22px] font-bold text-center mb-6 text-[#2C3E50]">注意事項</h2>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ul className="space-y-3">
            {[
              "このサブスクリプションを開始すると、その時点からAIとの会話無制限、カロリー分析、健康記録などすべての機能をご利用いただけます。",
              "無料トライアルは1度だけご利用いただけます。",
              "3日間の無料期間終了後、自動的に選択したプランに移行します。",
              "無料トライアル終了後、プレミアムプランに自動移行します。継続を希望されない場合は、トライアル期間中にキャンセルしてください。",
              "お支払いはLINE Payまたはクレジットカードをご利用いただけます。"
            ].map((item, index) => (
              <li key={index} className="text-[13px] text-[#5A6C7D] pl-5 relative leading-relaxed">
                <span className="absolute left-0 text-[#5BAFCE] font-bold">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-3 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50">
        <p className="text-center text-[13px] text-[#5A6C7D] mb-2">
          3日間無料トライアル実施中！<span className="bg-[#D6EEF5] px-2 py-0.5 rounded font-bold">いつでもキャンセル可能です</span>
        </p>
        <Button 
          onClick={handleStartTrial}
          className="w-full bg-[#5BAFCE] hover:bg-[#4A9BBB] text-white border-none rounded-full py-4 text-base font-bold shadow-[0_4px_16px_rgba(91,175,206,0.3)]"
        >
          無料で3日間試してみる
        </Button>
        <p className="text-center text-[11px] text-[#95A5B5] mt-2">
          ※既にご利用された方は、3日間無料期間の対象外です。
        </p>
      </div>
    </div>
  );
}