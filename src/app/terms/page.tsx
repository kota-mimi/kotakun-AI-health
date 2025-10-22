export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第1条（適用）</h2>
              <p>
                本利用規約（以下「本規約」）は、kotakun ヘルスケアサービス（以下「当社」）が提供する
                健康管理サポートサービス「kotakun」（以下「本サービス」）の利用条件を定めるものです。
                利用者（以下「ユーザー」）は、本サービスを利用することにより、本規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第2条（定義）</h2>
              <div className="ml-4">
                <p className="mb-2">本規約において、次の各号に掲げる用語の意義は、当該各号に定めるところによります：</p>
                <ol className="list-decimal ml-6 space-y-1">
                  <li>「本サービス」とは、当社が提供する健康管理サポートサービスをいいます</li>
                  <li>「ユーザー」とは、本サービスを利用する個人をいいます</li>
                  <li>「登録情報」とは、ユーザーが本サービス利用時に登録する情報をいいます</li>
                  <li>「コンテンツ」とは、文章、画像、動画、音声、データ等の情報をいいます</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第3条（サービス内容）</h2>
              <div className="ml-4">
                <p className="mb-2">本サービスは、以下の機能を提供します：</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>体重、食事、運動等の健康データの記録・管理</li>
                  <li>AI技術を活用した健康アドバイスの提供</li>
                  <li>健康状態の可視化・分析</li>
                  <li>定期的な健康状態のフィードバック</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第4条（利用上の注意事項）</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2">重要な免責事項</h3>
                <ul className="list-disc ml-6 space-y-1 text-yellow-700">
                  <li>本サービスは健康管理のサポートを目的としており、医療行為ではありません</li>
                  <li>本サービスの情報は診断、治療、医学的助言を意図したものではありません</li>
                  <li>健康上の問題がある場合は、必ず医師にご相談ください</li>
                  <li>本サービスの利用により生じた健康上の問題について、当社は責任を負いません</li>
                </ul>
              </div>
              
              <div className="ml-4">
                <p className="mb-2">ユーザーは以下の事項を理解し、同意するものとします：</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>提供される情報は一般的な健康管理のための参考情報です</li>
                  <li>個人の医学的状況に応じた具体的な指導ではありません</li>
                  <li>緊急時や体調不良時は、医療機関にご相談ください</li>
                  <li>薬事法に基づき、効果効能を保証するものではありません</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第5条（禁止行為）</h2>
              <div className="ml-4">
                <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません：</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>虚偽の情報を登録すること</li>
                  <li>他人の個人情報を無断で登録すること</li>
                  <li>本サービスの運営を妨害すること</li>
                  <li>不正アクセスやデータの改ざんを行うこと</li>
                  <li>法令や公序良俗に反する行為</li>
                  <li>商用目的での無断利用</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第6条（知的財産権）</h2>
              <p>
                本サービスに関する知的財産権は、当社または正当な権利者に帰属します。
                ユーザーは、本サービスを利用することにより、これらの知的財産権についていかなる権利も取得しません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第7条（免責事項）</h2>
              <div className="ml-4">
                <p className="mb-2">当社は、以下の事項について一切の責任を負いません：</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>本サービスの利用により生じた健康上の問題</li>
                  <li>提供情報の正確性、完全性、有用性</li>
                  <li>システムの一時的な停止やデータの消失</li>
                  <li>第三者による不正アクセスやデータ漏洩</li>
                  <li>ユーザー間のトラブル</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第8条（サービスの変更・終了）</h2>
              <p>
                当社は、ユーザーに事前に通知することにより、本サービスの内容を変更し、
                または本サービスの提供を終了することができます。
                これによりユーザーに生じた損害について、当社は責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第9条（準拠法・管轄裁判所）</h2>
              <p>
                本規約の解釈にあたっては、日本法を準拠法とします。
                本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第10条（規約の変更）</h2>
              <p>
                当社は、必要に応じて本規約を変更することができます。
                変更後の規約は、本ウェブサイトに掲載した時点から効力を生じます。
                変更後もサービスを継続利用された場合、変更後の規約に同意したものとみなします。
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                制定日: 2025年10月20日<br />
                最終更新日: 2025年10月20日<br />
                kotakun ヘルスケアサービス
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}