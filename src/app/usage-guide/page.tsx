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

        .step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #1E90FF, #4169E1);
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
          border-radius: 50%;
          margin-right: 15px;
          box-shadow: 0 4px 15px rgba(30, 144, 255, 0.3);
        }

        .step-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, #1E90FF, #4169E1);
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
          max-width: 240px;
          height: auto;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          margin: 20px auto;
          display: block;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .screenshot:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(30, 144, 255, 0.2);
        }

        .screenshots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 25px 0;
          justify-items: center;
        }

        .screenshot-small {
          width: 100%;
          max-width: 240px;
          height: auto;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .screenshot-small:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 35px rgba(30, 144, 255, 0.15);
        }

        .step-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          border: 1px solid rgba(30, 144, 255, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .step-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 60px rgba(30, 144, 255, 0.15);
        }

        .step-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .step-title {
          font-size: 1.4rem;
          font-weight: bold;
          color: #1E90FF;
          position: relative;
          padding-bottom: 10px;
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

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
          margin: 30px 0;
        }

        .feature-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 25px;
          text-align: center;
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          border: 2px solid rgba(30, 144, 255, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 45px rgba(30, 144, 255, 0.2);
          border-color: #1E90FF;
        }

        .feature-icon {
          font-size: 3rem;
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

          .step-card {
            padding: 20px;
          }

          .step-header {
            flex-direction: column;
            text-align: center;
          }

          .step-number {
            margin-right: 0;
            margin-bottom: 15px;
          }

          .features-grid {
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
            AIトレーナーこたくん
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
              こたくんと一緒に、楽しく健康的な生活を送りましょう。<br />
              簡単な操作で、あなたの健康データを記録・管理できます。
            </p>
          </div>
        </section>

        <div className="divider"></div>

        {/* 基本的な使い方 */}
        <section>
          <h2 className="section-title">基本的な使い方</h2>

          <div className="step-card">
            <div className="step-header">
              <div className="step-number">1</div>
              <h3 className="step-title">記録する</h3>
            </div>
            <div className="step-description">
              毎日の食事、運動、体重を簡単に記録できます。写真を撮るだけでも、テキストで入力することもできます。
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">📱</span>
                <div className="feature-title">写真で記録</div>
                <div className="feature-description">
                  食事や運動の写真を撮って送信するだけ。AIが自動で内容を認識します。
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
                <span className="feature-icon">⚖️</span>
                <div className="feature-title">体重記録</div>
                <div className="feature-description">
                  「体重 65kg」と入力するだけで、体重データを記録できます。
                </div>
              </div>
            </div>

            <img 
              src="data:image/png;base64,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" 
              alt="記録機能のスクリーンショット" 
              className="screenshot"
            />
          </div>

          <div className="step-card">
            <div className="step-header">
              <div className="step-number">2</div>
              <h3 className="step-title">フィードバックを受ける</h3>
            </div>
            <div className="step-description">
              記録したデータに基づいて、AIがあなたの健康状態を分析し、個人に合わせたアドバイスを提供します。
            </div>
            <div className="highlight-box">
              <div className="highlight-text">💡 AI分析によるパーソナライズされたアドバイス</div>
              <p style={{ color: '#555', fontSize: '0.95rem' }}>
                栄養バランス、運動量、体重変化などを総合的に分析し、<br />
                あなたに最適な健康管理のアドバイスをお届けします。
              </p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-header">
              <div className="step-number">3</div>
              <h3 className="step-title">ダッシュボードで確認</h3>
            </div>
            <div className="step-description">
              記録した内容やAIからのフィードバックは、ダッシュボードでいつでも確認できます。
            </div>
            <div className="features-grid">
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
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* メニューの使い方 */}
        <section>
          <h2 className="section-title">メニューの使い方</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🏠</span>
              <div className="feature-title">マイページ</div>
              <div className="feature-description">
                ダッシュボードで記録データとフィードバックを確認
              </div>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">📝</span>
              <div className="feature-title">記録</div>
              <div className="feature-description">
                食事・運動・体重の記録機能にアクセス
              </div>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">💬</span>
              <div className="feature-title">フィードバック</div>
              <div className="feature-description">
                AIからの個別アドバイスを受ける
              </div>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">❓</span>
              <div className="feature-title">使い方</div>
              <div className="feature-description">
                このガイドページでアプリの使い方を確認
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* よくある質問 */}
        <section>
          <h2 className="section-title">よくある質問</h2>
          
          <div className="step-card">
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#1E90FF',
              marginBottom: '10px'
            }}>
              Q. 記録を忘れた日があります。どうすればよいですか？
            </h3>
            <p style={{ color: '#666', lineHeight: '1.8' }}>
              A. 大丈夫です！思い出したときに記録してください。継続することが一番大切です。完璧を目指さず、できる範囲で続けることを心がけましょう。
            </p>
          </div>
          
          <div className="step-card">
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#1E90FF',
              marginBottom: '10px'
            }}>
              Q. フィードバックが表示されません。
            </h3>
            <p style={{ color: '#666', lineHeight: '1.8' }}>
              A. フィードバック機能は記録データに基づいて生成されます。まずは食事・運動・体重を記録してみてください。データが蓄積されると、より精度の高いアドバイスが受けられます。
            </p>
          </div>
          
          <div className="step-card">
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#1E90FF',
              marginBottom: '10px'
            }}>
              Q. 写真が上手く認識されません。
            </h3>
            <p style={{ color: '#666', lineHeight: '1.8' }}>
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
              いつでもお気軽にこたくんにメッセージをお送りください！
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
            © 2024 AIトレーナーこたくん. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}