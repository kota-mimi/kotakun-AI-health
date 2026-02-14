export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">サービス内容</h2>
              <p className="mb-3">
                ヘルシーくんは、LINEおよびWebアプリケーションを通じて健康管理をサポートするサービスです。
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">無料プラン</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>LINE公式アカウントを通じた健康相談（1日3通まで）</li>
                    <li>LINEを通じた食事記録（1日1通まで）</li>
                    <li>基本的なデータ記録・閲覧機能</li>
                    <li>体重の簡易記録</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">有料プラン</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>AI技術を活用した無制限の健康アドバイス・相談</li>
                    <li>Webアプリケーションからの詳細な健康データ記録</li>
                    <li>食事写真のAI解析による栄養成分自動算出</li>
                    <li>個人の健康データに基づくパーソナライズされた分析</li>
                    <li>1日の健康状態総合フィードバック機能</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">重要な注意事項</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-red-600">⚠️ 医療行為ではありません</p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li>本サービスは健康管理のサポートを目的としており、医療行為ではありません</li>
                  <li>健康上の問題や症状がある場合は、必ず医師や医療機関にご相談ください</li>
                  <li>本サービスの利用により生じた健康上の問題について、当社は責任を負いません</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">料金・決済</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">料金体系</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>月額プラン：790円（税込）</li>
                    <li>半年プラン：3,000円（税込）【月額換算500円・37%OFF】</li>
                    <li>年間プラン：4,500円（税込）【月額換算375円・52%OFF】</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">決済・キャンセル</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>決済はStripe決済システムを通じて処理されます</li>
                    <li>有料プランは自動更新されます</li>
                    <li>いつでもキャンセル可能ですが、既に支払い済みの料金の返金は原則として行いません</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">禁止行為</h2>
              <p className="mb-3">以下の行為を禁止します：</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>虚偽の情報を登録すること</li>
                <li>他人のアカウントを不正に使用すること</li>
                <li>システムに不正アクセスすること</li>
                <li>法令や公序良俗に反する行為</li>
                <li>サービスの運営を妨害する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">免責事項</h2>
              <p className="mb-3">当社は以下について責任を負いません：</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>本サービスの利用により生じた健康上の問題</li>
                <li>システムの一時的な停止やデータの消失</li>
                <li>第三者サービス（LINE、Stripe等）の障害</li>
                <li>ユーザー間のトラブル</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                ※ 万一、当社に責任が発生した場合でも、損害賠償の上限はユーザーが支払った料金の直近3ヶ月分までとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">サービスの変更・終了</h2>
              <ul className="list-disc ml-6 space-y-1">
                <li>サービス内容は予告により変更する場合があります</li>
                <li>メンテナンスやシステム障害により一時中断する場合があります</li>
                <li>サービス終了時は3ヶ月前に通知いたします</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">規約の変更</h2>
              <p>
                本規約は、法令の改正やサービス内容の変更により変更することがあります。
                重要な変更の場合は、30日前までにウェブサイトまたはアプリ内でお知らせいたします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">お問い合わせ</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>メール: <a href="mailto:healthy.contact.line@gmail.com" className="text-blue-600 hover:text-blue-800 underline">healthy.contact.line@gmail.com</a></p>
              </div>
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