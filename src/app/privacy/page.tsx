export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 個人情報の定義</h2>
              <p>
                本プライバシーポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項に定義される、
                生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により
                特定の個人を識別することができるもの（他の情報と容易に照合することができ、
                それにより特定の個人を識別することができることとなるものを含む）を指します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 収集する情報</h2>
              <div className="ml-4">
                <h3 className="font-medium mb-2">2.1 直接提供いただく情報</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>氏名、性別、年齢</li>
                  <li>身長、体重等の身体情報</li>
                  <li>食事記録、運動記録</li>
                  <li>健康に関する自己申告情報</li>
                  <li>LINEユーザーID</li>
                </ul>
                
                <h3 className="font-medium mb-2 mt-4">2.2 自動的に収集される情報</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>アクセスログ、IPアドレス</li>
                  <li>ブラウザ情報、デバイス情報</li>
                  <li>サービス利用状況</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 利用目的</h2>
              <ul className="list-disc ml-6 space-y-1">
                <li>健康管理サポートサービスの提供</li>
                <li>パーソナライズされたアドバイスの生成</li>
                <li>サービスの改善・機能開発</li>
                <li>カスタマーサポートの提供</li>
                <li>統計データの作成（個人を特定できない形式）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 第三者提供</h2>
              <p className="mb-3">
                当社は、以下の場合を除き、あらかじめご本人の同意を得ることなく、
                個人情報を第三者に提供することはありません：
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 安全管理措置</h2>
              <ul className="list-disc ml-6 space-y-1">
                <li>SSL/TLS暗号化による通信の保護</li>
                <li>アクセス制御による不正アクセスの防止</li>
                <li>定期的なセキュリティ監査の実施</li>
                <li>従業員への個人情報保護に関する教育</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 保存期間</h2>
              <p>
                個人情報は、利用目的の達成に必要な期間に限り保存し、
                目的達成後は適切に削除または匿名化いたします。
                ただし、法令により保存が義務付けられている場合はその限りではありません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. ご本人の権利</h2>
              <p className="mb-3">ご本人は、当社に対して以下の権利を行使することができます：</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>個人情報の開示請求</li>
                <li>個人情報の訂正・追加・削除請求</li>
                <li>個人情報の利用停止・消去請求</li>
                <li>個人情報の第三者提供停止請求</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. お問い合わせ</h2>
              <p>
                個人情報の取扱いに関するお問い合わせは、以下までご連絡ください：<br />
                <strong>kotakun ヘルスケアサービス 個人情報保護担当</strong><br />
                メール: privacy@kotakun-health.jp<br />
                受付時間: 平日 9:00-18:00
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. プライバシーポリシーの変更</h2>
              <p>
                当社は、法令の変更やサービス内容の変更に伴い、本プライバシーポリシーを変更することがあります。
                変更後のプライバシーポリシーは、本ウェブサイトに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                制定日: 2025年10月20日<br />
                最終更新日: 2025年10月20日
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}