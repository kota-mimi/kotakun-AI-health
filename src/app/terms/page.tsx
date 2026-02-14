export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第1条（適用）</h2>
              <p>
                本利用規約（以下「本規約」）は、ヘルシーくん（以下「当社」または「運営者」）が提供する健康管理AIサポートサービス「ヘルシーくん」（以下「本サービス」）の利用条件を定めるものです。利用者（以下「ユーザー」）は、本サービスを利用することにより、本規約の全条項に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第2条（定義）</h2>
              <p className="mb-3">本規約において、次の各号に掲げる用語の意義は、当該各号に定めるところによります：</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>「本サービス」とは、当社がLINE公式アカウント及びWebアプリケーションを通じて提供する健康管理AIサポートサービスをいいます</li>
                <li>「ユーザー」とは、本サービスを利用する個人をいいます</li>
                <li>「登録情報」とは、ユーザーがLINEアカウント連携時及び本サービス利用時に登録・提供する一切の情報をいいます</li>
                <li>「健康データ」とは、体重、身長、食事記録、体調記録等の健康に関する一切のデータをいいます</li>
                <li>「AIサービス」とは、機械学習やその他のAI技術を用いた分析・アドバイス機能をいいます</li>
                <li>「有料プラン」とは、月額課金制のプレミアムサービスをいいます</li>
                <li>「コンテンツ」とは、文章、画像、動画、音声、データ等の情報をいいます</li>
                <li>「第三者サービス」とは、LINE、Stripe等の外部サービスをいいます</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第3条（サービス内容）</h2>
              <p className="mb-3">本サービスは、以下の機能を提供します：</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">3.1 基本機能（無料プラン）</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>LINE公式アカウントを通じた健康相談（1日3通まで）</li>
                    <li>LINEを通じた食事記録（1日1通まで）</li>
                    <li>基本的なデータ記録・閲覧機能</li>
                    <li>体重・体調の簡易記録</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">3.2 プレミアム機能（有料プラン）</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>AI技術を活用した無制限の健康アドバイス・相談</li>
                    <li>Webアプリケーションからの詳細な健康データ記録</li>
                    <li>食事写真のAI解析による栄養成分自動算出</li>
                    <li>個人の健康データに基づくパーソナライズされた分析</li>
                    <li>1日の健康状態総合フィードバック機能</li>
                    <li>健康データの可視化・グラフ表示</li>
                    <li>過去データとの比較・トレンド分析</li>
                    <li>目標設定・達成度管理</li>
                    <li>健康データのエクスポート機能</li>
                    <li>プッシュ通知によるリマインダー機能</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">3.3 技術仕様</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>LINE LIFF（LINE Front-end Framework）を使用したWebアプリ</li>
                    <li>SSL/TLS暗号化による安全な通信</li>
                    <li>クラウドベースのデータストレージ</li>
                    <li>機械学習・AI技術による健康データ分析</li>
                    <li>Stripe決済システムによる安全な課金処理</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第4条（ユーザー登録・認証）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">4.1 アカウント登録</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>本サービスの利用にはLINEアカウントとの連携が必要です</li>
                    <li>ユーザーは正確かつ最新の情報を登録する義務を負います</li>
                    <li>他人のアカウントや個人情報を無断で使用することは禁止されています</li>
                    <li>アカウントの管理責任はユーザーに帰属し、第三者による不正利用について当社は責任を負いません</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">4.2 年齢制限</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>本サービスは13歳以上の方を対象としています</li>
                    <li>18歳未満の方の利用には保護者の同意が必要です</li>
                    <li>未成年者の有料プラン利用には保護者の明示的な同意が必要です</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">4.3 利用資格の停止・削除</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>当社は、ユーザーが本規約に違反した場合、事前通告なくアカウントを停止または削除することができます</li>
                    <li>アカウント削除時には、健康データを含むすべてのユーザーデータが削除されます</li>
                    <li>ユーザーはいつでもアカウント削除をリクエストできます</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第5条（健康管理サービスに関する重要な注意事項）</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-red-600">❗ 重要な免責事項</p>
                <ul className="list-disc ml-6 space-y-1 mt-2">
                  <li>本サービスは健康管理のサポートを目的としており、医療行為ではありません</li>
                  <li>本サービスの情報は診断、治療、医学的助言を意図したものではありません</li>
                  <li>健康上の問題や症状がある場合は、必ず医師や医療機関にご相談ください</li>
                  <li>本サービスの利用により生じた健康上の問題、損害、不利益について、当社は一切の責任を負いません</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">5.1 サービスの性質に関する理解</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>提供される情報は一般的な健康管理のための参考情報であり、個別の医学的助言ではありません</li>
                    <li>AIによる分析結果は統計的なデータに基づくものであり、個人の特異な状況を反映しない場合があります</li>
                    <li>緊急時、体調不良時、症状がある場合は、本サービスではなく医療機関にご相談ください</li>
                    <li>薬事法に基づき、効果効能を保証するものではありません</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">5.2 ユーザーの責任</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>本サービスの利用はユーザー自身の判断と責任において行うものとします</li>
                    <li>健康状態に関する重要な判断は、必ず医療専門家に相談してください</li>
                    <li>持病、アレルギー、服薬中の薬物がある場合は、事前に医師に相談の上で本サービスを利用してください</li>
                    <li>妊娠中、授乳中の方は、医師の指導の下で利用してください</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第6条（有料プラン・決済）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">6.1 料金体系</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>月額プラン：790円（税込）</li>
                    <li>半年プラン：3,000円（税込）【月額換算500円・37%OFF】</li>
                    <li>年間プラン：4,500円（税込）【月額換算375円・52%OFF】</li>
                    <li>料金は事前通知により変更される場合があります</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">6.2 決済方法・自動更新</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>決済はStripe決済システムを通じて処理されます</li>
                    <li>クレジットカード決済のみ対応しています</li>
                    <li>有料プランは自動更新され、更新日に料金が課金されます</li>
                    <li>初回課金はサブスクリプション開始時、更新料金は各プランの更新日に課金されます</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">6.3 キャンセル・返金ポリシー</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>ユーザーはいつでもサブスクリプションをキャンセルできます</li>
                    <li>キャンセルは次回更新日前日までに手続きを行ってください</li>
                    <li>キャンセル後も、次回更新日までは有料機能を利用できます</li>
                    <li>既に支払い済みの料金の返金は原則として行いません</li>
                    <li>システム不具合等、当社の責めに帰すべき理由による場合は、個別に対応いたします</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">6.4 料金の未払い・遅延</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>料金の未払いが発生した場合、サービスの利用が制限される場合があります</li>
                    <li>連続して決済が失敗した場合、アカウントが自動的に無料プランに変更されます</li>
                    <li>悪意ある料金未払いやチャージバックの場合、アカウントが停止される場合があります</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第7条（禁止行為）</h2>
              <p className="mb-3">ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません：</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">7.1 アカウント・情報に関する禁止行為</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>虚偽の個人情報や健康データを登録すること</li>
                    <li>他人のアカウントや個人情報を無断で使用・登録すること</li>
                    <li>アカウントを第三者に譲渡、貸与、共有すること</li>
                    <li>自分以外の人物の健康データを登録すること</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">7.2 システム・セキュリティに関する禁止行為</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>不正アクセス、ハッキング、クラッキング行為</li>
                    <li>システムやデータの改ざん、破壊、削除行為</li>
                    <li>サーバーやネットワークに過度な負荷をかける行為</li>
                    <li>リバースエンジニアリング、デコンパイル、解析行為</li>
                    <li>ボット、スクレイピング、自動化ツールの使用</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">7.3 コンテンツ・情報に関する禁止行為</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>犯罪行為、暴力、脅迫、ハラスメントに関する情報の登録</li>
                    <li>差別的、侮蔑的、中傷的な内容の登録</li>
                    <li>アダルトコンテンツ、わいせつな内容の登録</li>
                    <li>著作権、商標権、その他の知的財産権を侵害する行為</li>
                    <li>スパム、チェーンメール、迷惑メールの送信</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">7.4 その他の禁止行為</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>法令、公序良俗、社会通念に反する行為</li>
                    <li>本サービスの運営を妨害し、信用を失墜させる行為</li>
                    <li>他のユーザーや第三者に迷惑、不利益、損害を与える行為</li>
                    <li>その他、当社が不適切と判断する一切の行為</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第8条（知的財産権・ユーザーデータの扱い）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">8.1 サービスの知的財産権</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>本サービスに関する知的財産権（著作権、商標権、特許権等）は、当社または正当な権利者に帰属します</li>
                    <li>ユーザーは、本サービスを利用することにより、これらの知的財産権についていかなる権利も取得しません</li>
                    <li>ユーザーは、本サービスのコンテンツを無断で複製、配布、改変、商用利用することを禁止します</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">8.2 ユーザーが登録するデータの扱い</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>ユーザーが本サービスに登録した健康データの所有権はユーザーに維持されます</li>
                    <li>当社は、ユーザーから提供されたデータをサービス提供の目的で使用する権利を有します</li>
                    <li>当社は、個人を特定できない形で統計情報やサービス改善の目的でデータを利用する場合があります</li>
                    <li>ユーザーはいつでも自分のデータの削除をリクエストできます</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">8.3 AI技術の利用に関する同意</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>ユーザーは、登録した健康データがAI技術により分析・処理されることに同意します</li>
                    <li>AIによる分析結果は参考情報であり、医学的精度や完全性を保証するものではありません</li>
                    <li>当社は、AI技術の改善のために、匿名化されたデータを機械学習のトレーニングに使用する場合があります</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第9条（サービスの変更・中断・終了）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">9.1 サービスの変更</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>当社は、ユーザーに事前通知することにより、本サービスの内容を変更できます</li>
                    <li>機能の追加、改善、一部機能の廃止等を含みます</li>
                    <li>重大な変更の場合は、1ヶ月前に通知いたします</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">9.2 サービスの一時中断</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>メンテナンス、システム障害、緊急事態等により、サービスを一時中断する場合があります</li>
                    <li>定期メンテナンスの場合は事前に通知いたします</li>
                    <li>緊急メンテナンスの場合は、事前通知なく中断する場合があります</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">9.3 サービスの終了</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>当社は、ユーザーに3ヶ月前に通知することにより、本サービスの提供を終了できます</li>
                    <li>サービス終了時は、ユーザーデータのエクスポート機能を一定期間提供いたします</li>
                    <li>サービス終了によりユーザーに生じた損害について、当社は責任を負いません</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第10条（免責事項・損害責任の制限）</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">10.1 当社の免責事項</h3>
                  <p className="mb-2">当社は、以下の事項について一切の責任を負いません：</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>本サービスの利用により生じた健康上の問題、病気、ケガ、死亡等</li>
                    <li>AI分析結果や提供情報の正確性、完全性、有用性、信頼性</li>
                    <li>システムの一時的な停止、ダウンタイム、データの消失や破損</li>
                    <li>第三者による不正アクセス、ハッキング、データ漏洩、サイバー攻撃</li>
                    <li>LINE、Stripe等の第三者サービスの障害やサービス停止</li>
                    <li>ユーザー間のトラブル、紛争、損害</li>
                    <li>アカウントの不正利用、パスワード漏洩等による損害</li>
                    <li>自然災害、戦争、テロ、政府の規制等の不可抗力による損害</li>
                    <li>本サービスの利用に関連して発生した、直接、間接、付随的、特別、結果的損害</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">10.2 損害責任の制限</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>万一、当社に法的責任が発生した場合でも、その損害責任は直接かつ通常の損害に限定されます</li>
                    <li>損害賠償金の上限は、ユーザーが当社に支払った料金の直近3ヶ月分の合計金額を上限とします</li>
                    <li>無料プラン利用者に対する損害賠償責任は一切負いません</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">10.3 ユーザーの損害賠償責任</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>ユーザーが本規約に違反し、当社または第三者に損害を与えた場合、ユーザーがその損害を賠償するものとします</li>
                    <li>ユーザーの禁止行為により当社が被った損害（弁護士費用、人件費等を含む）は、ユーザーが負担するものとします</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第11条（分離可能性）</h2>
              <p>
                本規約のいずれかの条項が無効、違法または執行不能と判断された場合でも、本規約の他の条項の有効性は影響を受けません。無効と判断された条項については、本規約の目的を達成するために必要な範囲で有効な条項に修正されるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第12条（権利の譲渡禁止）</h2>
              <p>
                ユーザーは、当社の事前の書面による同意なく、本規約に基づく権利または義務の全部または一部を第三者に譲渡、移転、担保設定その他の処分をすることはできません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第13条（準拠法・管轄裁判所）</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">13.1 準拠法</h3>
                  <p>
                    本規約およびサービスの利用に関しては、日本法を準拠法とし、日本法に従って解釈されるものとします。
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">13.2 管轄裁判所</h3>
                  <p>
                    本サービスまたは本規約に関連して生じた紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第14条（規約の変更）</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">14.1 変更の権利</h3>
                  <p>当社は、以下の場合に本規約を変更することができます：</p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>法令の改正、制定、廃止等により変更が必要な場合</li>
                    <li>サービス内容の追加、変更、廃止に伴い変更が必要な場合</li>
                    <li>その他、ユーザーの一般の利益に適合する場合</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">14.2 変更の通知</h3>
                  <p>
                    規約の変更については、変更内容および効力発生日を、効力発生日の30日前までに本ウェブサイトまたはアプリ内にて告知いたします。ユーザーが変更後の規約に同意いただけない場合は、効力発生日前にサービスの利用を停止してください。
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">14.3 変更への同意</h3>
                  <p>
                    変更後の規約の効力発生日以降もサービスを継続してご利用いただいた場合、変更後の規約にご同意いただいたものとみなします。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">第15条（お問い合わせ）</h2>
              <div className="space-y-3">
                <p>
                  本サービスまたは本規約に関するお問い合わせは、以下までご連絡ください：
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>メール: <a href="mailto:healthy.contact.line@gmail.com" className="text-blue-600 hover:text-blue-800 underline">healthy.contact.line@gmail.com</a></p>
                </div>
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