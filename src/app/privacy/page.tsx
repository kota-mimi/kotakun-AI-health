export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ヘルシーくんは、ユーザーの個人情報を適切に保護し、安全に管理いたします。
            </p>
          </div>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">収集する情報</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">基本情報</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>LINEユーザーID、ディスプレイ名、プロフィール画像</li>
                    <li>氏名、性別、年齢、身長</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">健康データ</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>体重、目標体重</li>
                    <li>食事記録（摂取カロリー、栄養素等）</li>
                    <li>AIチャットでの会話内容</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">決済情報</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>サブスクリプションプラン情報</li>
                    <li>決済履歴（Stripeを通じて処理）</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">利用目的</h2>
              <ul className="list-disc ml-6 space-y-1">
                <li>健康管理サポートサービスの提供</li>
                <li>AIによるパーソナライズされた健康アドバイス</li>
                <li>食事記録の管理および分析</li>
                <li>サービスの改善および新機能開発</li>
                <li>決済処理およびサブスクリプション管理</li>
                <li>カスタマーサポートの提供</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第三者への提供</h2>
              <p className="mb-3">
                以下の外部サービスとのみ連携し、サービス提供に必要な範囲で情報を提供します：
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">LINE株式会社</p>
                  <p className="text-sm">LINE公式アカウントを通じたサービス提供</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Stripe, Inc.</p>
                  <p className="text-sm">クレジットカード決済処理</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">OpenAI, L.L.C.</p>
                  <p className="text-sm">AI分析による健康アドバイス生成</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">データの安全管理</h2>
              <ul className="list-disc ml-6 space-y-1">
                <li>SSL/TLS暗号化による通信の保護</li>
                <li>データベースの暗号化およびアクセス制御</li>
                <li>定期的なセキュリティアップデート</li>
                <li>従業員への個人情報保護教育</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">お客様の権利</h2>
              <p className="mb-3">
                お客様はいつでも以下を請求できます：
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>個人情報の開示</li>
                <li>個人情報の訂正・削除</li>
                <li>個人情報の利用停止</li>
              </ul>
              <p className="mt-3 text-sm">
                ご請求は下記のお問い合わせ先までご連絡ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">お問い合わせ</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>メール: <a href="mailto:healthy.contact.line@gmail.com" className="text-blue-600 hover:text-blue-800 underline">healthy.contact.line@gmail.com</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">プライバシーポリシーの変更</h2>
              <p>
                本プライバシーポリシーは、法令の変更やサービス内容の変更に応じて変更することがあります。
                重要な変更の場合は、事前にウェブサイトまたはアプリ内でお知らせいたします。
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  制定日: 2025年10月20日<br />
                  最終更新日: 2025年10月26日
                </p>
                <p className="font-medium text-gray-800">ヘルシーくん</p>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}