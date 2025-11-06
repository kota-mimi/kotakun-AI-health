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
      <div style={{
        maxWidth: '750px',
        margin: '0 auto'
      }}>
        {/* ヘッダー */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1E90FF',
            marginBottom: '10px'
          }}>
            AIトレーナーこたくん
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#666'
          }}>
            使い方ガイド
          </p>
        </header>

        {/* 基本的な使い方 */}
        <section style={{ padding: '40px 0' }}>
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 'bold',
            marginBottom: '30px',
            textAlign: 'center',
            color: '#1E90FF',
            position: 'relative',
            paddingBottom: '15px'
          }}>
            基本的な使い方
          </h2>
          
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '15px',
              padding: '10px',
              background: 'linear-gradient(135deg, #e3f2fd, #f0f8ff)',
              borderLeft: '4px solid #1E90FF'
            }}>
              1. 記録する
            </h3>
            <p style={{ marginBottom: '15px', color: '#555' }}>
              毎日の食事、運動、体重を記録しましょう。記録方法は簡単です：
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
              <li style={{ marginBottom: '8px' }}>📱 <strong>画像で記録</strong>：食事や運動の写真を撮って送信</li>
              <li style={{ marginBottom: '8px' }}>💬 <strong>テキストで記録</strong>：「朝食：ご飯、味噌汁、卵焼き」のように入力</li>
              <li style={{ marginBottom: '8px' }}>⚖️ <strong>体重記録</strong>：「体重 65kg」のように入力</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '15px',
              padding: '10px',
              background: 'linear-gradient(135deg, #e8f5e8, #f0fff0)',
              borderLeft: '4px solid #4CAF50'
            }}>
              2. フィードバックを受ける
            </h3>
            <p style={{ marginBottom: '15px', color: '#555' }}>
              記録したデータに基づいて、AIがあなたの健康状態を分析し、個人に合わせたアドバイスを提供します。
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '15px',
              padding: '10px',
              background: 'linear-gradient(135deg, #fff3e0, #fef7e0)',
              borderLeft: '4px solid #FF9800'
            }}>
              3. ダッシュボードで確認
            </h3>
            <p style={{ marginBottom: '15px', color: '#555' }}>
              記録した内容やAIからのフィードバックは、ダッシュボードでいつでも確認できます。
            </p>
          </div>
        </section>

        {/* リッチメニューの使い方 */}
        <section style={{ padding: '40px 0' }}>
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 'bold',
            marginBottom: '30px',
            textAlign: 'center',
            color: '#1E90FF',
            position: 'relative',
            paddingBottom: '15px'
          }}>
            リッチメニューの使い方
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #e3f2fd, #f0f8ff)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '2px solid #1E90FF'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1E90FF' }}>ダッシュボード</h4>
              <p style={{ fontSize: '0.9rem', color: '#555' }}>記録データとフィードバックの確認</p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e8, #f0fff0)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '2px solid #4CAF50'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#4CAF50' }}>記録</h4>
              <p style={{ fontSize: '0.9rem', color: '#555' }}>食事・運動・体重の記録</p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #fff3e0, #fef7e0)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '2px solid #FF9800'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💡</div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#FF9800' }}>フィードバック</h4>
              <p style={{ fontSize: '0.9rem', color: '#555' }}>AIからの個別アドバイス</p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #fce4ec, #f8f0f8)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              border: '2px solid #E91E63'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>❓</div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#E91E63' }}>使い方</h4>
              <p style={{ fontSize: '0.9rem', color: '#555' }}>このガイドページ</p>
            </div>
          </div>
        </section>

        {/* よくある質問 */}
        <section style={{ padding: '40px 0' }}>
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 'bold',
            marginBottom: '30px',
            textAlign: 'center',
            color: '#1E90FF',
            position: 'relative',
            paddingBottom: '15px'
          }}>
            よくある質問
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px',
              padding: '10px',
              background: '#f5f5f5',
              borderRadius: '5px'
            }}>
              Q. 記録を忘れた日があります。どうすればよいですか？
            </h3>
            <p style={{ marginLeft: '15px', color: '#555' }}>
              A. 大丈夫です！思い出したときに記録してください。継続することが一番大切です。
            </p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px',
              padding: '10px',
              background: '#f5f5f5',
              borderRadius: '5px'
            }}>
              Q. フィードバックが表示されません。
            </h3>
            <p style={{ marginLeft: '15px', color: '#555' }}>
              A. フィードバック機能は記録データに基づいて生成されます。まずは食事・運動・体重を記録してみてください。
            </p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px',
              padding: '10px',
              background: '#f5f5f5',
              borderRadius: '5px'
            }}>
              Q. 写真が上手く認識されません。
            </h3>
            <p style={{ marginLeft: '15px', color: '#555' }}>
              A. 明るい場所で、食べ物全体が写るように撮影してください。また、テキストでの記録も併用可能です。
            </p>
          </div>
        </section>

        {/* サポート */}
        <section style={{ padding: '40px 0' }}>
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 'bold',
            marginBottom: '30px',
            textAlign: 'center',
            color: '#1E90FF',
            position: 'relative',
            paddingBottom: '15px'
          }}>
            サポート
          </h2>
          
          <div style={{
            background: 'linear-gradient(135deg, #f0f8ff, #e6f3ff)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            border: '2px solid #1E90FF'
          }}>
            <p style={{ marginBottom: '15px', color: '#333' }}>
              ご不明な点やお困りのことがございましたら、
              <br />
              いつでもお気軽にこたくんにメッセージをお送りください！
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              color: '#1E90FF' 
            }}>
              📱 チャットでサポート対応いたします
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