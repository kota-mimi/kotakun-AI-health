export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              こたくんヘルスケアサービス（以下「当社」）は、ユーザーの個人情報保護を重要事項と位置づけ、
              個人情報保護法その他の関連法令を遵守し、適切な取り扱いに努めます。
            </p>
          </div>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第1条（個人情報の定義）</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">1.1 個人情報</h3>
                  <p>
                    本プライバシーポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項に定義される、
                    生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により
                    特定の個人を識別することができるもの（他の情報と容易に照合することができ、
                    それにより特定の個人を識別することができることとなるものを含む）を指します。
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">1.2 要配慮個人情報</h3>
                  <p>
                    本プライバシーポリシーにおいて「要配慮個人情報」とは、個人情報保護法第2条第3項に定義される、
                    人種、信条、社会的身分、病歴、犯罪の経歴、犯罪により害を被った事実その他本人に対する
                    不当な差別、偏見その他の不利益が生じないようにその取扱いに特に配慮を要するものとして
                    政令で定める記述等が含まれる個人情報を指します。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第2条（収集する情報）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">2.1 直接提供いただく情報</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1">基本情報</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>LINEユーザーID、ディスプレイ名、プロフィール画像</li>
                        <li>氏名、性別、年齢、生年月日</li>
                        <li>連絡先情報（メールアドレス等）</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1">身体・健康情報（要配慮個人情報）</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>身長、体重、BMI、体脂肪率</li>
                        <li>目標体重、目標カロリー支出</li>
                        <li>食事記録（摂取カロリー、栄養素等）</li>
                        <li>運動記録（消費カロリー、運動種目等）</li>
                        <li>健康状態、病歴、アレルギー情報</li>
                        <li>服薬情報、医療機関受診履歴</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1">サービス利用情報</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>AIチャットでの会話内容および履歴</li>
                        <li>ユーザーの質問、相談内容</li>
                        <li>サービスへのフィードバック、評価</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1">決済情報</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>サブスクリプションプラン情報</li>
                        <li>決済履歴、課金情報</li>
                        <li>クレジットカード情報（最後の4桁のみ）</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">2.2 自動的に収集される情報</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1">アクセス情報</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>IPアドレス、アクセスログ</li>
                        <li>リファラーURL、アクセス日時</li>
                        <li>ユーザーエージェント、ブラウザ情報</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1">デバイス情報</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>デバイスタイプ、OS情報</li>
                        <li>画面サイズ、解像度</li>
                        <li>アプリバージョン、言語設定</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1">サービス利用状況</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li>ページ閲覧履歴、滞在時間</li>
                        <li>クリック、タップ操作履歴</li>
                        <li>機能利用頻度、エラーログ</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">2.3 Cookieおよび類似技術</h3>
                  <p className="text-sm">
                    当社は、サービスの改善およびユーザー体験の向上のために、
                    Cookie、Webビーコン、ローカルストレージ等の技術を使用します。
                    これらの技術は、ブラウザ設定により無効化することが可能ですが、
                    一部機能が制限される場合があります。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第3条（利用目的）</h2>
              <div className="space-y-4">
                <p>
                  当社は、収集した個人情報を以下の目的のために利用します：
                </p>
                
                <div>
                  <h3 className="font-medium mb-2">3.1 サービス提供関連</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>健康管理サポートサービスの提供</li>
                    <li>パーソナライズされた健康アドバイスの生成</li>
                    <li>AIチャットによる相談対応および回答生成</li>
                    <li>食事・運動記録の管理および分析</li>
                    <li>目標達成状況の追跡およびフィードバック</li>
                    <li>ユーザー認証およびアカウント管理</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">3.2 サービス改善関連</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>サービスの改善および新機能開発</li>
                    <li>ユーザー体験の向上およびパーソナライゼーション</li>
                    <li>システムの保守・運用およびセキュリティ向上</li>
                    <li>サービス利用状況の分析および改善</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">3.3 コミュニケーション関連</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>カスタマーサポートの提供</li>
                    <li>お問い合わせへの対応</li>
                    <li>重要なお知らせやアップデート情報の通知</li>
                    <li>ユーザーアンケートやフィードバックの依頼</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">3.4 決済・課金関連</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>料金の課金および決済処理</li>
                    <li>サブスクリプションの管理</li>
                    <li>決済トラブルの調査および解決</li>
                    <li>課金明細の発行および送付</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">3.5 法令遵守関連</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>本人確認および年齢確認</li>
                    <li>法令に基づく開示要求への対応</li>
                    <li>不正利用の発生防止および対応</li>
                    <li>統計データの作成（個人を特定できない形式）</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第4条（個人情報の第三者提供）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">4.1 原則</h3>
                  <p>
                    当社は、以下の場合を除き、あらかじめご本人の同意を得ることなく、
                    個人情報を第三者に提供することはありません。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">4.2 同意なく提供できる場合</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>法令に基づく場合</li>
                    <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                    <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                    <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">4.3 外部サービスとの連携</h3>
                  <p className="text-sm mb-2">
                    本サービスは、以下の外部サービスと連携し、サービス提供のために必要な範囲で個人情報を提供します：
                  </p>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium">LINE株式会社（LINEプラットフォーム）</p>
                      <p>提供する情報: LINEユーザーID、メッセージ内容、利用履歴</p>
                      <p>利用目的: LINE公式アカウントを通じたサービス提供、メッセージ配信</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium">Stripe, Inc.（決済サービス）</p>
                      <p>提供する情報: 決済情報、サブスクリプション情報</p>
                      <p>利用目的: クレジットカード決済処理、課金管理</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium">OpenAI, L.L.C.（AI技術サービス）</p>
                      <p>提供する情報: 健康データ、相談内容、会話履歴</p>
                      <p>利用目的: AI分析による健康アドバイス生成、パーソナライズされた提案</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    ※上記外部サービスは、各社のプライバシーポリシーに基づき個人情報を管理します。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">4.4 共同利用</h3>
                  <p className="text-sm mb-2">
                    以下の範囲内で、個人情報を第三者と共同利用する場合があります：
                  </p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>共同利用する個人情報の項目：</strong>ユーザーID、サービス利用状況、技術的ログ情報</p>
                    <p><strong>共同利用する者の範囲：</strong>当社の業務委託先（システム開発・保守業者、カスタマーサポート業者等）</p>
                    <p><strong>共同利用の目的：</strong>サービスの安定運用およびカスタマーサポート</p>
                    <p><strong>管理責任者：</strong>こたくん ヘルスケアサービス 個人情報保護管理者</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">4.5 業務委託</h3>
                  <p className="text-sm">
                    当社は、下記の業務を第三者に委託する場合があり、
                    その場合に限り業務遂行に必要な範囲で個人情報を提供します：
                  </p>
                  <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                    <li>システム開発・保守業務</li>
                    <li>カスタマーサポート業務</li>
                    <li>データバックアップ・セキュリティ業務</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第5条（安全管理措置）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">5.1 技術的安全管理措置</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>SSL/TLS暗号化による通信の保護</li>
                    <li>ファイアウォールおよび侵入検知システムの導入</li>
                    <li>データベースの暗号化およびアクセス制御</li>
                    <li>定期的なセキュリティアップデートおよび脆弱性対応</li>
                    <li>バックアップデータの暗号化保存</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">5.2 物理的安全管理措置</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>サーバールームへの物理的アクセス制御</li>
                    <li>監視カメラおよびセキュリティシステムの設置</li>
                    <li>クラウドサービスプロバイダーのセキュリティ認証取得確認</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">5.3 人的安全管理措置</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>従業員への個人情報保護教育の定期的実施</li>
                    <li>秘密保持契約の締結および遵守状況の管理</li>
                    <li>個人情報へのアクセス権限の最小化および管理</li>
                    <li>離職時のアクセス権限削除手続き</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">5.4 組織的安全管理措置</h3>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>個人情報保護管理責任者の選任および専任</li>
                    <li>個人情報取扱いに関する社内ルールの策定および遵守</li>
                    <li>定期的なリスクアセスメントの実施</li>
                    <li>インシデント対応手順の策定および訓練</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第6条（保存期間）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">6.1 一般的な保存期間</h3>
                  <p className="text-sm">
                    個人情報は、利用目的の達成に必要な期間に限り保存し、
                    目的達成後は適切に削除または匿名化いたします。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">6.2 具体的な保存期間</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">アカウント情報</p>
                        <p className="text-xs">サービス利用終了から5年間</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">健康データ</p>
                        <p className="text-xs">サービス利用終了から3年間</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">決済情報</p>
                        <p className="text-xs">法令に定める期間（最長7年間）</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">アクセスログ</p>
                        <p className="text-xs">最大90日間</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">6.3 法令による保存義務</h3>
                  <p className="text-sm">
                    法令により保存が義務付けられている情報については、
                    当該法令に定める期間保存いたします。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">6.4 保存期間終了後の処理</h3>
                  <p className="text-sm">
                    保存期間が終了した個人情報は、以下のいずれかの方法で処理いたします：
                  </p>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>完全な削除（復旧不可能な形での消去）</li>
                    <li>匿名化処理（個人を特定できない形での統計データ化）</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第7条（ご本人の権利）</h2>
              <div className="space-y-4">
                <p className="text-sm">
                  ご本人は、当社に対して以下の権利を行使することができます：
                </p>
                
                <div>
                  <h3 className="font-medium mb-2">7.1 開示要求権</h3>
                  <p className="text-sm mb-2">
                    当社が保有するご自身の個人情報の利用目的、取扱い状況等の開示を求めることができます。
                  </p>
                  <ul className="list-disc ml-6 space-y-1 text-xs">
                    <li>保有している個人情報の項目および内容</li>
                    <li>個人情報の取得方法および取得源</li>
                    <li>個人情報の利用目的および利用方法</li>
                    <li>第三者への提供状況</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">7.2 訂正・追加・削除要求権</h3>
                  <p className="text-sm">
                    保有している個人情報の内容に誤りがある場合、
                    訂正、追加または削除を求めることができます。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">7.3 利用停止・消去要求権</h3>
                  <p className="text-sm">
                    個人情報の利用停止または消去を求めることができます。
                    ただし、法令に基づく保存義務がある情報については、
                    当該義務が終了するまで対応できない場合があります。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">7.4 第三者提供停止要求権</h3>
                  <p className="text-sm">
                    個人情報の第三者への提供停止を求めることができます。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">7.5 権利行使の手続き</h3>
                  <p className="text-sm mb-2">
                    上記権利を行使される場合は、以下の方法でご連絡ください：
                  </p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>連絡先：</strong>kotakun.health@gmail.com</p>
                    <p><strong>必要書類：</strong>本人確認書類（運転免許証等）の写し</p>
                    <p><strong>回答期限：</strong>要求受付後30日以内（土日祝日を除く）</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第8条（お問い合わせ）</h2>
              <div className="space-y-3">
                <p>
                  個人情報の取扱いに関するお問い合わせは、以下までご連絡ください：
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>メール: kotakun.health@gmail.com</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第9条（プライバシーポリシーの変更）</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">9.1 変更の権利</h3>
                  <p className="text-sm">
                    当社は、法令の変更、サービス内容の変更、その他必要な場合に、
                    本プライバシーポリシーを変更することがあります。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">9.2 変更の通知</h3>
                  <p className="text-sm">
                    重要な変更の場合は、変更内容および効力発生日を、
                    効力発生日の30日前までに本ウェブサイトまたはアプリ内にて告知いたします。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">9.3 変更の効力</h3>
                  <p className="text-sm">
                    変更後のプライバシーポリシーは、本ウェブサイトに掲載した時点から効力を生じるものとします。
                    変更後もサービスを継続してご利用いただいた場合、
                    変更後のプライバシーポリシーにご同意いただいたものとみなします。
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  制定日: 2025年10月20日<br />
                  最終更新日: 2025年10月26日
                </p>
                <p className="font-medium text-gray-800">こたくん</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}