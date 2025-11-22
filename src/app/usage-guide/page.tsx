'use client';

import React from 'react';

export default function UsageGuidePage() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      background: '#ffffff',
      padding: '20px'
    }}>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          max-width: 750px;
          margin: 0 auto;
        }

        /* セクション */
        section {
          padding: 40px 0;
        }

        .section-title {
          font-size: 1.6rem;
          font-weight: bold;
          margin-bottom: 30px;
          text-align: center;
          color: #1E90FF;
          position: relative;
          padding-bottom: 15px;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 4px;
          background: linear-gradient(90deg, #1E90FF, #4169E1);
          border-radius: 2px;
        }

        .step-container {
          margin-bottom: 50px;
        }

        .step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #1E90FF 0%, #4169E1 100%);
          color: white;
          border-radius: 50%;
          font-weight: bold;
          font-size: 1.4rem;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(30, 144, 255, 0.3);
        }

        .step-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 15px;
          color: #1E90FF;
          position: relative;
          display: inline-block;
        }

        .step-title::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, #1E90FF, transparent);
          border-radius: 2px;
        }

        .step-description {
          font-size: 1rem;
          color: #666;
          margin-bottom: 20px;
          line-height: 1.8;
        }

        .screenshot {
          width: 100%;
          max-width: 300px;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          margin: 20px auto;
          display: block;
          transition: transform 0.3s ease;
        }

        .screenshot:hover {
          transform: translateY(-5px);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }

        .feature-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 25px;
          text-align: center;
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          border: 1px solid rgba(30, 144, 255, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 45px rgba(30, 144, 255, 0.2);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
          display: block;
        }

        .feature-title {
          font-size: 1.2rem;
          font-weight: bold;
          color: #1E90FF;
          margin-bottom: 10px;
        }

        .feature-description {
          font-size: 0.95rem;
          color: #666;
          line-height: 1.6;
        }

        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #1E90FF, transparent);
          margin: 50px auto;
          max-width: 300px;
        }

        .highlight-box {
          background: linear-gradient(135deg, #f0f8ff, #e6f3ff);
          border: 2px solid #1E90FF;
          border-radius: 16px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }

        .highlight-text {
          font-size: 1.1rem;
          font-weight: bold;
          color: #1E90FF;
          margin-bottom: 10px;
        }

        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }

          .section-title {
            font-size: 1.3rem;
          }

          .screenshot {
            max-width: 100%;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="container">
        {/* ヘッダー */}
        <section>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#1E90FF',
            marginBottom: '15px',
            background: 'linear-gradient(135deg, #1E90FF, #4169E1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            AIトレーナーヘルシーくん
          </h1>
          <p style={{
            fontSize: '1.2rem',
            textAlign: 'center',
            color: '#666',
            marginBottom: '30px'
          }}>
            使い方ガイド
          </p>
          <div className="highlight-box">
            <div className="highlight-text">🎯 健康管理を始めよう！</div>
            <p style={{ color: '#555', fontSize: '1rem' }}>
              ヘルシーくんと一緒に、楽しく健康的な生活を送りましょう。<br />
              簡単な操作で、あなたの健康データを記録・管理できます。
            </p>
          </div>
        </section>

        <div className="divider"></div>

        {/* カウンセリング */}
        <section>
          <div className="step-container">
            <div className="step-number">1</div>
            <h2 className="step-title">カウンセリング</h2>
            <div className="step-description">
              友達追加後、届いたメッセージの「カウンセリング開始」ボタンをタップして、基本情報を入力します。カウンセリングが完了すると、あなた専用のカロリー目標とPFCバランスが自動で計算されます！
            </div>
            <div className="feature-grid">
              <div className="feature-card">
                <span className="feature-icon">👤</span>
                <div className="feature-title">基本情報入力</div>
                <div className="feature-description">
                  お名前・年齢・性別・身長・体重などの基本的な情報をお伺いします
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🎯</span>
                <div className="feature-title">目標設定</div>
                <div className="feature-description">
                  目標体重や活動レベルを設定して個別プランを作成します
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">📊</span>
                <div className="feature-title">PFC計算</div>
                <div className="feature-description">
                  あなた専用の目安カロリーとPFCバランスを自動計算
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* 記録する */}
        <section>
          <h2 className="section-title">記録する</h2>

          <div className="step-container">
            <div className="step-number">2</div>
            <h2 className="step-title">食事を記録</h2>
            <div className="step-description">
              LINEのリッチメニューから「記録」ボタンをタップして、記録モードを開始します。写真撮影による食事記録と、テキストでの記録が可能です。
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#1E90FF',
                marginBottom: '15px'
              }}>食事の記録例</h3>
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>単品で:</strong> 「朝にバナナ食べた」「昼にパスタ」
                </div>
                <div>
                  <strong>複数まとめて:</strong> 「朝に目玉焼きとご飯100g、昼に唐揚げ定食、夜にサラダと豚汁、おやつにクッキー2枚」
                </div>
              </div>
            </div>
            
            <div className="feature-grid">
              <div className="feature-card">
                <span className="feature-icon">📱</span>
                <div className="feature-title">写真で記録</div>
                <div className="feature-description">
                  食事の写真を撮って送信するだけ。AIが自動で内容を認識します。
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">💬</span>
                <div className="feature-title">テキストで記録</div>
                <div className="feature-description">
                  「朝食：ご飯、味噌汁、卵焼き」のように、チャットで簡単に入力できます。
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🔍</span>
                <div className="feature-title">詳細分析</div>
                <div className="feature-description">
                  カロリー、タンパク質、脂質、炭水化物を自動で分析・計算
                </div>
              </div>
            </div>
          </div>

          <div className="step-container">
            <div className="step-number">3</div>
            <h2 className="step-title">運動・体重を記録</h2>
            <div className="step-description">
              運動や体重も同じ記録モードで簡単に記録できます。
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#1E90FF',
                marginBottom: '15px'
              }}>体重・運動の記録例</h3>
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>体重:</strong> 「体重68.5kg」「68.5」
                </div>
                <div>
                  <strong>運動:</strong> 「ランニング30分」「ベンチプレス90kg10回」「野球した」
                </div>
              </div>
            </div>
            
            <div className="feature-grid">
              <div className="feature-card">
                <span className="feature-icon">🏃</span>
                <div className="feature-title">有酸素運動</div>
                <div className="feature-description">
                  ランニング、ウォーキング、サイクリングなどの記録
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">💪</span>
                <div className="feature-title">筋力トレーニング</div>
                <div className="feature-description">
                  ベンチプレス、スクワットなど詳細なトレーニング記録
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">⚖️</span>
                <div className="feature-title">体重記録</div>
                <div className="feature-description">
                  日々の体重変化を記録してグラフで推移を確認
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* 確認・編集 */}
        <section>
          <div className="step-container">
            <div className="step-number">4</div>
            <h2 className="step-title">確認・編集</h2>
            <div className="step-description">
              記録した内容の確認と編集が可能です。リッチメニューやチャットから簡単にアクセスできます。
            </div>
            
            <div className="feature-grid">
              <div className="feature-card">
                <span className="feature-icon">📱</span>
                <div className="feature-title">リッチメニューで確認</div>
                <div className="feature-description">
                  リッチメニューから記録内容をすぐに確認
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">💬</span>
                <div className="feature-title">チャットで確認</div>
                <div className="feature-description">
                  チャット画面でも記録の確認が可能
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">✏️</span>
                <div className="feature-title">編集・追加もカンタン</div>
                <div className="feature-description">
                  記録の修正や追加が簡単に行えます
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* フィードバックを受ける */}
        <section>
          <div className="step-container">
            <div className="step-number">5</div>
            <h2 className="step-title">フィードバックを受ける</h2>
            <div className="step-description">
              リッチメニューの「フィードバック」ボタンから、今日の記録に対するAIのアドバイスを確認できます。
            </div>
            <div className="highlight-box">
              <div className="highlight-text">💡 AI分析によるパーソナライズされたアドバイス</div>
              <p style={{ color: '#555', fontSize: '0.95rem' }}>
                栄養バランス、運動量、体重変化などを総合的に分析し、<br />
                あなたに最適な健康管理のアドバイスをお届けします。
              </p>
            </div>
            
            <div className="feature-grid">
              <div className="feature-card">
                <span className="feature-icon">🍎</span>
                <div className="feature-title">栄養バランスの分析</div>
                <div className="feature-description">
                  食事バランスの分析と改善点のアドバイス
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🎯</span>
                <div className="feature-title">カロリー目標達成状況</div>
                <div className="feature-description">
                  目標に対する達成度を確認できます
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">📋</span>
                <div className="feature-title">改善点のアドバイス</div>
                <div className="feature-description">
                  個人に合わせた具体的な改善提案
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* その他の便利な機能 */}
        <section>
          <h2 className="section-title">💬 その他の便利な機能</h2>
          
          <div className="step-container">
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#1E90FF',
              marginBottom: '15px'
            }}>通常モード（記録以外の会話）</h3>
            <div className="step-description">
              記録モード以外では、ヘルシーくんに何でも質問できます！
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#1E90FF',
                marginBottom: '10px'
              }}>質問例</h4>
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '0.9rem',
                lineHeight: '1.8'
              }}>
                <div style={{ marginBottom: '8px' }}>「バナナのカロリーってどのくらい?」</div>
                <div style={{ marginBottom: '8px' }}>「胸筋のトレーニング教えて」</div>
                <div>「栄養がある食べ物何個か教えて欲しい!」</div>
              </div>
            </div>
          </div>
          
          <div className="step-container">
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#1E90FF',
              marginBottom: '15px'
            }}>体重グラフで変化を実感</h3>
            <div className="step-description">
              マイページでは、体重の推移をグラフで確認できます。1ヶ月、3ヶ月、全期間と期間を切り替えて、あなたの頑張りを視覚化！
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* ダッシュボードで確認 */}
        <section>
          <div className="step-container">
            <div className="step-number">6</div>
            <h2 className="step-title">ダッシュボードで確認</h2>
            <div className="step-description">
              記録した内容やAIからのフィードバックは、ダッシュボードでいつでも確認できます。
            </div>
            <div className="feature-grid">
              <div className="feature-card">
                <span className="feature-icon">📊</span>
                <div className="feature-title">データ分析</div>
                <div className="feature-description">
                  食事・運動・体重の推移をグラフで可視化
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">📈</span>
                <div className="feature-title">進捗確認</div>
                <div className="feature-description">
                  目標に向けた進捗状況を一目で確認
                </div>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🎯</span>
                <div className="feature-title">目標管理</div>
                <div className="feature-description">
                  カロリー目標やPFCバランスとの比較表示
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* よくある質問 */}
        <section>
          <h2 className="section-title">よくある質問</h2>
          
          <div className="step-container">
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#1E90FF',
              marginBottom: '10px'
            }}>
              Q. 記録を忘れた日があります。どうすればよいですか？
            </h3>
            <p style={{ color: '#666', lineHeight: '1.8', marginBottom: '20px' }}>
              A. 大丈夫です！思い出したときに記録してください。継続することが一番大切です。完璧を目指さず、できる範囲で続けることを心がけましょう。
            </p>
          </div>
          
          <div className="step-container">
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#1E90FF',
              marginBottom: '10px'
            }}>
              Q. フィードバックが表示されません。
            </h3>
            <p style={{ color: '#666', lineHeight: '1.8', marginBottom: '20px' }}>
              A. フィードバック機能は記録データに基づいて生成されます。まずは食事・運動・体重を記録してみてください。データが蓄積されると、より精度の高いアドバイスが受けられます。
            </p>
          </div>
          
          <div className="step-container">
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#1E90FF',
              marginBottom: '10px'
            }}>
              Q. 写真が上手く認識されません。
            </h3>
            <p style={{ color: '#666', lineHeight: '1.8', marginBottom: '20px' }}>
              A. 明るい場所で、食べ物全体が写るように撮影してください。また、テキストでの記録も併用可能です。画角を変えたり、複数枚撮影することで認識精度が向上します。
            </p>
          </div>
        </section>

        <div className="divider"></div>

        {/* サポート */}
        <section>
          <h2 className="section-title">サポート</h2>
          
          <div className="highlight-box">
            <div className="highlight-text">📱 いつでもサポート</div>
            <p style={{ color: '#555', fontSize: '1rem', marginBottom: '15px' }}>
              ご不明な点やお困りのことがございましたら、<br />
              いつでもお気軽にヘルシーくんにメッセージをお送りください！
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              color: '#1E90FF' 
            }}>
              チャットでサポート対応いたします
            </p>
          </div>
        </section>

        {/* フッター */}
        <footer style={{
          textAlign: 'center',
          padding: '30px 0',
          borderTop: '1px solid #ddd',
          marginTop: '40px'
        }}>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            © 2024 AIトレーナーヘルシーくん. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}