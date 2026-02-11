'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createPaymentSession } from '../lib/payment';

export default function TrialPage() {
  const { isLiffReady, liffUser, isLoggedIn } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('half-year');
  const [currentSlide, setCurrentSlide] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const selectPlan = (plan: string) => {
    setSelectedPlan(plan);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const updateCarousel = (index: number) => {
    setCurrentSlide(index);
  };

  const handleStartTrial = async () => {
    try {
      console.log('🔗 トライアルボタン押下');
      
      // ユーザー認証必須（プラン管理ページと同じロジック）
      if (!liffUser?.userId) {
        alert('LINEアプリでアクセスしてください。\n\nブラウザから直接アクセスした場合は、LINEアプリで当サービスを友達追加後、再度お試しください。');
        return;
      }

      console.log('✅ ユーザーID取得成功:', liffUser.userId);
      
      // プラン管理ページと同じcreatePaymentSession関数を使用
      console.log('💳 決済セッション作成開始:', selectedPlan);
      
      // プランIDをStripe価格IDにマッピング
      const planIdMapping = {
        'monthly': 'monthly',
        'half-year': 'biannual', 
        'annual': 'annual'
      };
      const planId = planIdMapping[selectedPlan as keyof typeof planIdMapping] || 'biannual';
      
      const session = await createPaymentSession(
        planId,
        liffUser.userId,
        `${window.location.origin}/payment/success`,
        `${window.location.origin}/payment/cancel`,
        true  // includeTrial = true（3日間無料トライアル）
      );

      if (session.url) {
        console.log('✅ 決済セッション作成成功、リダイレクト:', session.url);
        window.location.href = session.url;
      } else {
        throw new Error('決済URLの取得に失敗しました');
      }
    } catch (error) {
      console.error('❌ トライアル処理エラー:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('本番Stripe APIキー')) {
          alert('現在メンテナンス中です。しばらく経ってからお試しください。');
        } else {
          alert('エラーが発生しました: ' + error.message);
        }
      } else {
        alert('予期しないエラーが発生しました。もう一度お試しください。');
      }
    }
  };

  if (!isLiffReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        fontFamily: "'Noto Sans JP', sans-serif",
        background: '#FFFFFF'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#5BAFCE'}}></div>
          <p style={{color: '#5A6C7D'}}>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Poppins:wght@600;700&display=swap');
        
        :root {
          --primary: #5BAFCE;
          --primary-dark: #4A9BBB;
          --primary-light: #D6EEF5;
          --secondary: #EDF7FA;
          --accent: #5BAFCE;
          --text-dark: #2C3E50;
          --text-medium: #5A6C7D;
          --text-light: #95A5B5;
          --bg-main: #FFFFFF;
          --bg-card: #FFFFFF;
          --highlight: #D6EEF5;
          --success: #5BAFCE;
          --border-radius: 16px;
        }
        
        body {
          font-family: 'Noto Sans JP', sans-serif;
          background-color: var(--bg-main);
          color: var(--text-dark);
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        paddingBottom: '100px',
        fontFamily: "'Noto Sans JP', sans-serif",
        lineHeight: 1.7
      }}>
        
        {/* Hero Section */}
        <section style={{ width: '100%', background: '#FFFFFF', padding: 0, textAlign: 'center' }}>
          <img 
            src="/images/hero-line-health.png" 
            alt="LINEだから続く健康管理" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </section>

        {/* Plan Selection */}
        <section style={{ padding: '32px 20px', background: '#FFFFFF' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#2C3E50',
              margin: 0
            }}>
              健康管理を<span style={{ color: '#5BAFCE', fontFamily: "'Poppins', sans-serif" }}>AI</span>でサポート！
            </h2>
          </div>

          {/* 年間プラン */}
          <div 
            onClick={() => selectPlan('annual')}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '12px',
              border: `2px solid ${selectedPlan === 'annual' ? '#5BAFCE' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: selectedPlan === 'annual' 
                ? '0 4px 20px rgba(91, 175, 206, 0.15)' 
                : '0 2px 12px rgba(0, 0, 0, 0.04)'
            }}
          >
            <span style={{
              position: 'absolute',
              top: '-12px',
              left: '20px',
              background: '#FF6B6B',
              color: 'white',
              padding: '4px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
            }}>
              最安！52%OFF
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedPlan === 'annual' ? '#5BAFCE' : '#DDD'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  background: selectedPlan === 'annual' ? '#5BAFCE' : 'transparent'
                }}>
                  {selectedPlan === 'annual' && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'white',
                      borderRadius: '50%'
                    }}></div>
                  )}
                </div>
                <span style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#2C3E50'
                }}>年間プラン</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#2C3E50'
                }}>
                  375<span style={{ fontSize: '14px', fontWeight: 500 }}>円/月</span>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#5BAFCE',
                  fontWeight: 500
                }}>12ヶ月 4,500円</div>
              </div>
            </div>
          </div>

          {/* 半年プラン */}
          <div 
            onClick={() => selectPlan('half-year')}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '12px',
              border: `2px solid ${selectedPlan === 'half-year' ? '#5BAFCE' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: selectedPlan === 'half-year' 
                ? '0 4px 20px rgba(91, 175, 206, 0.15)' 
                : '0 2px 12px rgba(0, 0, 0, 0.04)'
            }}
          >
            <span style={{
              position: 'absolute',
              top: '-12px',
              left: '20px',
              background: '#5BAFCE',
              color: 'white',
              padding: '4px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(91, 175, 206, 0.3)'
            }}>
              おすすめ！
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedPlan === 'half-year' ? '#5BAFCE' : '#DDD'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  background: selectedPlan === 'half-year' ? '#5BAFCE' : 'transparent'
                }}>
                  {selectedPlan === 'half-year' && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'white',
                      borderRadius: '50%'
                    }}></div>
                  )}
                </div>
                <span style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#2C3E50'
                }}>半年プラン</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#2C3E50'
                }}>
                  500<span style={{ fontSize: '14px', fontWeight: 500 }}>円/月</span>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#5BAFCE',
                  fontWeight: 500
                }}>6ヶ月 3,000円</div>
              </div>
            </div>
          </div>

          {/* 月間プラン */}
          <div 
            onClick={() => selectPlan('monthly')}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '12px',
              border: `2px solid ${selectedPlan === 'monthly' ? '#5BAFCE' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: selectedPlan === 'monthly' 
                ? '0 4px 20px rgba(91, 175, 206, 0.15)' 
                : '0 2px 12px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedPlan === 'monthly' ? '#5BAFCE' : '#DDD'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  background: selectedPlan === 'monthly' ? '#5BAFCE' : 'transparent'
                }}>
                  {selectedPlan === 'monthly' && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'white',
                      borderRadius: '50%'
                    }}></div>
                  )}
                </div>
                <span style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#2C3E50'
                }}>月間プラン</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#2C3E50'
                }}>
                  790<span style={{ fontSize: '14px', fontWeight: 500 }}>円/月</span>
                </div>
              </div>
            </div>
          </div>

          <p style={{
            textAlign: 'center',
            margin: '24px 0 16px',
            fontSize: '14px',
            lineHeight: 1.3,
            color: '#5A6C7D'
          }}>
            3日間無料実施中！<span style={{
              background: '#D6EEF5',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '13px',
              marginLeft: '4px'
            }}>いつでもキャンセル可能</span>
          </p>

          <button 
            onClick={(e) => {
              console.log('🔘 トライアルボタンクリック検出');
              e.preventDefault();
              e.stopPropagation();
              handleStartTrial();
            }}
            onTouchStart={() => {
              console.log('👆 トライアルボタンタッチ検出');
            }}
            style={{
              width: '100%',
              background: '#5BAFCE',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '18px 32px',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(91, 175, 206, 0.3)',
              transition: 'all 0.3s ease',
              fontFamily: "'Noto Sans JP', sans-serif",
              pointerEvents: 'auto',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => {
              console.log('🖱️ ボタンホバー');
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(91, 175, 206, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(91, 175, 206, 0.3)';
            }}
          >
            無料で3日間試してみる
          </button>
          
          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#95A5B5',
            marginTop: '12px'
          }}>
            ※既にご利用された方は、3日間無料期間の対象外です。
          </p>
        </section>

        {/* Features Section */}
        <section style={{ padding: '32px 20px', background: '#FFFFFF' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '24px',
            color: '#2C3E50'
          }}>
            3日間で<span style={{ color: '#5BAFCE' }}>全機能</span>使い放題！
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '16px 8px',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#2C3E50'
              }}>AIと会話</div>
            </div>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '16px 8px',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#2C3E50'
              }}>カロリー分析</div>
            </div>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '16px 8px',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#2C3E50'
              }}>1日のフィードバック</div>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '50px',
            padding: '12px 24px',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            marginBottom: '32px'
          }}>
            <span style={{ color: '#2C3E50' }}>トライアル期間中は</span>
            <span style={{ color: '#5BAFCE', fontWeight: 700 }}>すべての機能</span>
            <span style={{ color: '#2C3E50' }}>が使えます</span>
          </div>

          {/* Feature Showcase */}
          <div style={{ marginTop: '32px', overflow: 'hidden' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '24px',
              color: '#2C3E50'
            }}>実際の画面をチェック</h3>
            
            <div 
              style={{ position: 'relative', padding: '20px 0', overflow: 'hidden', cursor: 'grab' }}
              onTouchStart={(e) => {
                const startX = e.touches[0].clientX;
                e.currentTarget.setAttribute('data-start-x', startX.toString());
              }}
              onTouchEnd={(e) => {
                const startX = parseFloat(e.currentTarget.getAttribute('data-start-x') || '0');
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;
                
                if (Math.abs(diff) > 50) {
                  if (diff > 0 && currentSlide < 3) {
                    updateCarousel(currentSlide + 1);
                  } else if (diff < 0 && currentSlide > 0) {
                    updateCarousel(currentSlide - 1);
                  }
                }
              }}
            >
              <div style={{
                display: 'flex',
                transition: 'transform 0.4s ease',
                transform: `translateX(-${currentSlide * 25}%)`,
                width: '400%'
              }}>
                {[0, 1, 2, 3].map((index) => {
                  return (
                    <div 
                      key={index}
                      style={{
                        flexShrink: 0,
                        width: '25%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: '380px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        margin: '0 auto'
                      }}>
                        {index === 0 ? (
                          <img 
                            src="/images/chat-mockup.png" 
                            alt="AIとの会話" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              background: 'transparent',
                              filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))'
                            }}
                          />
                        ) : index === 1 ? (
                          <img 
                            src="/images/calorie-analysis-mockup.png" 
                            alt="カロリー分析" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              background: 'transparent',
                              filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))'
                            }}
                          />
                        ) : index === 2 ? (
                          <img 
                            src="/images/dashboard-mockup.png" 
                            alt="一目で記録が見れる" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              background: 'transparent',
                              filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))'
                            }}
                          />
                        ) : index === 3 ? (
                          <img 
                            src="/images/feedback-mockup.png" 
                            alt="フィードバック" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              background: 'transparent',
                              filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))'
                            }}
                          />
                        ) : (
                          <div style={{
                            color: '#95A5B5',
                            fontSize: '12px',
                            textAlign: 'center'
                          }}>
                            その他
                          </div>
                        )}
                      </div>
                      <div style={{
                        textAlign: 'center',
                        marginTop: '16px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#2C3E50'
                      }}>
                        {['AIとの会話', 'カロリー分析', '一目で記録が見れる', 'フィードバック'][index]}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '20px'
              }}>
                {[0, 1, 2, 3].map((index) => (
                  <div 
                    key={index}
                    onClick={() => updateCarousel(index)}
                    style={{
                      width: index === currentSlide ? '24px' : '8px',
                      height: '8px',
                      borderRadius: index === currentSlide ? '4px' : '50%',
                      background: index === currentSlide ? '#5BAFCE' : '#D6EEF5',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Second CTA */}
        <section style={{ padding: '32px 20px' }}>
          <p style={{
            textAlign: 'center',
            margin: '24px 0 16px',
            fontSize: '14px',
            lineHeight: 1.3,
            color: '#5A6C7D'
          }}>
            3日間無料実施中！<span style={{
              background: '#D6EEF5',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '13px',
              marginLeft: '4px'
            }}>いつでもキャンセル可能</span>
          </p>
          <button 
            onClick={(e) => {
              console.log('🔘 2つ目のトライアルボタンクリック検出');
              e.preventDefault();
              e.stopPropagation();
              handleStartTrial();
            }}
            style={{
              width: '100%',
              background: '#5BAFCE',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '18px 32px',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(91, 175, 206, 0.3)',
              transition: 'all 0.3s ease',
              fontFamily: "'Noto Sans JP', sans-serif",
              pointerEvents: 'auto',
              touchAction: 'manipulation'
            }}
          >
            無料で3日間試してみる
          </button>
          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#95A5B5',
            marginTop: '12px'
          }}>
            ※既にご利用された方は、3日間無料期間の対象外です。
          </p>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '32px 20px', background: '#FFFFFF' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '24px',
            color: '#2C3E50'
          }}>
            よくある<span style={{ color: '#5BAFCE' }}>質問</span>
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
            <div 
              key={index}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                marginBottom: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div 
                onClick={() => toggleFaq(index)}
                style={{
                  padding: '20px',
                  fontSize: '14px',
            lineHeight: 1.3,
                  fontWeight: 700,
                  color: '#2C3E50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative'
                }}
              >
                <span style={{
                  color: '#5BAFCE',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  flexShrink: 0
                }}>Q.</span>
                <span style={{ flex: 1 }}>{faq.q}</span>
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  width: '10px',
                  height: '10px',
                  borderRight: '2px solid #95A5B5',
                  borderBottom: '2px solid #95A5B5',
                  transform: openFaq === index ? 'rotate(-135deg)' : 'rotate(45deg)',
                  transition: 'transform 0.3s ease'
                }}></div>
              </div>
              <div style={{
                padding: openFaq === index ? '0 20px 20px' : '0 20px 0',
                maxHeight: openFaq === index ? '200px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, padding 0.3s ease'
              }}>
                <div style={{
                  borderTop: '1px solid #F0EDE8',
                  paddingTop: '16px'
                }}>
                  <div style={{
                    color: '#5BAFCE',
                    fontWeight: 700,
                    fontSize: '14px',
            lineHeight: 1.3,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif" }}>A.</span>
                    はい、{index === 0 ? '無料です' : index === 1 ? '不要です' : index === 2 ? 'もちろんです' : index === 3 ? 'いつでも解約可能です' : '発行できます'}
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: '#5A6C7D',
                    lineHeight: 1.8,
                    margin: 0
                  }}>{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Notice Section */}
        <section style={{ padding: '32px 20px 120px', background: '#EDF7FA' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '24px',
            color: '#2C3E50'
          }}>注意事項</h2>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px 20px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
          }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                "このサブスクリプションを開始すると、その時点からAIとの会話無制限、カロリー分析、健康記録などすべての機能をご利用いただけます。",
                "無料トライアルは1度だけご利用いただけます。",
                "3日間の無料期間終了後、自動的に選択したプランに移行します。",
                "無料トライアル終了後、プレミアムプランに自動移行します。継続を希望されない場合は、トライアル期間中にキャンセルしてください。",
                "お支払いはLINE Payまたはクレジットカードをご利用いただけます。"
              ].map((item, index) => (
                <li 
                  key={index}
                  style={{
                    fontSize: '13px',
                    color: '#5A6C7D',
                    paddingLeft: '20px',
                    position: 'relative',
                    marginBottom: '12px',
                    lineHeight: 1.7
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    color: '#5BAFCE',
                    fontWeight: 'bold'
                  }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Fixed Bottom CTA */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#FFFFFF',
          padding: '12px 20px 24px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          <p style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#5A6C7D',
            marginBottom: '8px',
            lineHeight: 1.2
          }}>
            3日間無料実施中！<span style={{
              background: '#D6EEF5',
              padding: '1px 6px',
              borderRadius: '3px',
              fontWeight: 700,
              fontSize: '10px',
              marginLeft: '4px'
            }}>いつでもキャンセル可能</span>
          </p>
          <button 
            onClick={(e) => {
              console.log('🔘 3つ目の固定ボタンクリック検出');
              e.preventDefault();
              e.stopPropagation();
              handleStartTrial();
            }}
            style={{
              width: '100%',
              background: '#5BAFCE',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(91, 175, 206, 0.3)',
              fontFamily: "'Noto Sans JP', sans-serif",
              pointerEvents: 'auto',
              touchAction: 'manipulation'
            }}
          >
            無料で3日間試してみる
          </button>
          <p style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#95A5B5',
            marginTop: '8px'
          }}>
            ※既にご利用された方は、3日間無料期間の対象外です。
          </p>
        </div>
      </div>
    </>
  );
}