import { ArrowLeft } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

function TermsJa(): ReactElement {
  return (
    <>
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第1条（適用）</h2>
        <p className="text-muted-foreground leading-relaxed">
          本規約は、Simple KPT（以下「本サービス」といいます）の利用条件を定めるものです。
          ユーザーの皆様には、本規約に従って本サービスをご利用いただきます。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第2条（本サービスの利用）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>本サービスは、アカウント登録をせずに利用できます。</li>
          <li>ユーザーは、本規約に同意のうえ本サービスを利用するものとし、本サービスを利用した時点で本規約に同意したものとみなします。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第3条（招待URLの管理）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            招待URLを知っている人は誰でもボードに参加し、内容を閲覧・編集できます。ユーザーは、自己の責任において招待URLを管理し、意図しない第三者に共有しないものとします。
          </li>
          <li>
            運営者は、招待URLが第三者に知られたことによりユーザーに生じた損害について、運営者の故意又は重過失による場合を除き、一切の責任を負いません。
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第4条（データの保存）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            ボードの内容は運営者のサーバーに保存されず、参加者の端末に保存されます。運営者はボードの内容を保持しておらず、復元または提供することはできません。
          </li>
          <li>
            すべての参加者の端末から保存データが削除された場合、ボードの内容は失われます。ユーザーは、必要なデータをエクスポートにより自己の責任で保存するものとします。
          </li>
          <li>
            共用の端末で本サービスを利用する場合、ユーザーは、利用後に端末に保存されたデータを削除するなど、自己の責任において適切に管理するものとします。
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第5条（禁止事項）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為に関連する行為</li>
          <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
          <li>運営者、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
          <li>本サービスによって得られた情報を商業的に利用する行為</li>
          <li>運営者のサービスの運営を妨害するおそれのある行為</li>
          <li>不正アクセスをし、またはこれを試みる行為</li>
          <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
          <li>不正な目的を持って本サービスを利用する行為</li>
          <li>本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</li>
          <li>他のユーザーに成りすます行為</li>
          <li>運営者が許諾しない本サービス上での宣伝、広告、勧誘、または営業行為</li>
          <li>反社会的勢力に対して直接または間接に利益を供与する行為</li>
          <li>本サービスの接続の仲介サーバーを、本サービスの利用以外の目的で利用する行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第6条（本サービスの提供の停止等）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
            </ul>
          </li>
          <li>
            運営者は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第7条（利用制限）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            運営者は、ユーザーが本規約のいずれかの条項に違反した場合、その他運営者が本サービスの利用を適当でないと判断した場合には、事前の通知なく、当該ユーザーによる本サービスの全部または一部の利用を制限することができるものとします。
          </li>
          <li>運営者は、本条に基づき運営者が行った行為によりユーザーに生じた損害について、一切の責任を負いません。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第8条（免責事項）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            運営者は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しておりません。
          </li>
          <li>
            運営者は、本サービスに起因してユーザーに生じたあらゆる損害について、運営者の故意又は重過失による場合を除き、一切の責任を負いません。
          </li>
          <li>
            運営者は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
          </li>
          <li>
            本サービスは現状有姿で提供されるものであり、運営者はデータの保全について一切の責任を負いません。ユーザーは、エクスポートなどにより自己の責任においてデータを保存するものとします。
          </li>
          <li>
            本サービスは参加者の端末間の直接通信を利用するため、ユーザーのネットワーク環境によっては参加者同士が接続できない場合があります。運営者は、これによって生じたいかなる損害についても、一切責任を負いません。
          </li>
          <li>運営者は、本サービスの内容変更、中断、終了によって生じたいかなる損害についても、一切責任を負いません。</li>
          <li>運営者は、ユーザーが本サービスを利用する際に使用するいかなる機器、ソフトウェアについても、その動作保証を一切行いません。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第9条（サービス内容の変更等）</h2>
        <p className="text-muted-foreground leading-relaxed">
          運営者は、ユーザーへの事前の告知なく、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第10条（利用規約の変更）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>運営者は、必要と判断した場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。</li>
          <li>変更後の利用規約は、本ページに掲載された時点で効力を生じるものとします。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第11条（個人情報の取扱い）</h2>
        <p className="text-muted-foreground leading-relaxed">
          運営者は、本サービスの利用によって取得する個人情報については、「プライバシーポリシー」に従い適切に取り扱うものとします。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第12条（準拠法・裁判管轄）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
          <li>本サービスに関して紛争が生じた場合には、運営者の住所地を管轄する裁判所を専属的合意管轄とします。</li>
        </ol>
      </section>
    </>
  );
}

function TermsEn(): ReactElement {
  return (
    <>
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 1 (Application)</h2>
        <p className="text-muted-foreground leading-relaxed">
          These Terms of Service define the conditions for using Simple KPT (hereinafter referred to as &quot;the Service&quot;). Users are
          required to use the Service in accordance with these Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 2 (Use of the Service)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>The Service can be used without account registration.</li>
          <li>
            Users shall use the Service after agreeing to these Terms, and shall be deemed to have agreed to these Terms when they use the
            Service.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 3 (Management of Invite URLs)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            Anyone with the invite URL can join the board and view or edit its contents. Users shall manage invite URLs at their own
            responsibility and shall not share them with unintended third parties.
          </li>
          <li>
            The operator shall not be liable for any damage caused to users because an invite URL became known to a third party, except in
            cases of intentional or gross negligence by the operator.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 4 (Data Storage)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            Board contents are not stored on the operator&apos;s servers but on participants&apos; devices. The operator does not hold board
            contents and cannot restore or provide them.
          </li>
          <li>
            If the stored data is deleted from all participants&apos; devices, the board contents will be lost. Users shall save necessary
            data at their own responsibility by exporting it.
          </li>
          <li>
            When using the Service on a shared device, users shall appropriately manage the data stored on the device at their own
            responsibility, such as by deleting it after use.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 5 (Prohibited Acts)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          Users shall not engage in any of the following acts when using the Service:
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>Acts that violate laws or public order and morals</li>
          <li>Acts related to criminal activities</li>
          <li>Acts that infringe on copyrights, trademarks, and other intellectual property rights contained in the Service</li>
          <li>Acts that destroy or interfere with the functions of servers or networks of the operator, other users, or third parties</li>
          <li>Acts of commercially using information obtained through the Service</li>
          <li>Acts that may interfere with the operation of the operator&apos;s services</li>
          <li>Unauthorized access or attempts thereof</li>
          <li>Acts of collecting or accumulating personal information about other users</li>
          <li>Acts of using the Service for improper purposes</li>
          <li>Acts that cause disadvantage, damage, or discomfort to other users or third parties</li>
          <li>Acts of impersonating other users</li>
          <li>Advertising, solicitation, or business activities on the Service without the operator&apos;s permission</li>
          <li>Acts of providing benefits directly or indirectly to antisocial forces</li>
          <li>Acts of using the Service&apos;s connection relay server for purposes other than using the Service</li>
          <li>Other acts that the operator deems inappropriate</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 6 (Suspension of Service)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            The operator may suspend or interrupt all or part of the Service without prior notice to users if it determines that any of the
            following applies:
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Maintenance or update of the computer system for the Service</li>
              <li>
                The Service becomes difficult to provide due to force majeure such as earthquakes, lightning, fire, power outages, or
                natural disasters
              </li>
              <li>Computers or communication lines are stopped due to accidents</li>
              <li>The operator otherwise determines that the provision of the Service is difficult</li>
            </ul>
          </li>
          <li>
            The operator shall not be liable for any disadvantage or damage incurred by users or third parties due to the suspension or
            interruption of the Service.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 7 (Usage Restrictions)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            If a user violates any provision of these Terms, or the operator otherwise deems the user&apos;s use of the Service
            inappropriate, the operator may restrict all or part of that user&apos;s use of the Service without prior notice.
          </li>
          <li>The operator shall not be liable for any damage caused to users by actions taken based on this article.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 8 (Disclaimer)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            The operator does not expressly or implicitly warrant that the Service is free from defects in fact or law (including defects
            related to safety, reliability, accuracy, completeness, validity, fitness for a particular purpose, security, errors or bugs,
            and infringement of rights).
          </li>
          <li>
            The operator shall not be liable for any damage caused to users arising from the Service, except in cases of intentional or
            gross negligence by the operator.
          </li>
          <li>
            The operator shall not be liable for any transactions, communications, or disputes between users and other users or third
            parties regarding the Service.
          </li>
          <li>
            The Service is provided &quot;as is,&quot; and the operator shall not be liable for data preservation. Users shall save data at
            their own responsibility, such as by exporting it.
          </li>
          <li>
            Because the Service uses direct communication between participants&apos; devices, participants may be unable to connect to each
            other depending on their network environment. The operator shall not be liable for any damage caused by this.
          </li>
          <li>The operator shall not be liable for any damage caused by changes to, interruption of, or termination of the Service.</li>
          <li>The operator does not guarantee the operation of any equipment or software used by users when using the Service.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 9 (Changes to Service Content)</h2>
        <p className="text-muted-foreground leading-relaxed">
          The operator may change, add, or abolish the content of the Service without prior notice to users, and users shall accept this.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 10 (Changes to Terms of Service)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>The operator may change these Terms without obtaining individual consent from users if deemed necessary.</li>
          <li>The revised Terms of Service shall take effect when posted on this page.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 11 (Handling of Personal Information)</h2>
        <p className="text-muted-foreground leading-relaxed">
          The operator shall appropriately handle personal information obtained through the use of the Service in accordance with the
          Privacy Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 12 (Governing Law and Jurisdiction)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>Japanese law shall be the governing law for the interpretation of these Terms.</li>
          <li>
            In the event of any dispute regarding the Service, the court having jurisdiction over the operator&apos;s location shall have
            exclusive agreed jurisdiction.
          </li>
        </ol>
      </section>
    </>
  );
}

export function Terms(): ReactElement {
  const { t, i18n } = useTranslation('landing');
  const isJapanese = i18n.language === 'ja';

  return (
    <>
      <title>{t('利用規約 - Simple KPT')}</title>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <nav className="mb-8">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded text-sm transition-colors hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('トップページに戻る')}
          </Link>
        </nav>

        <h1 className="mb-8 text-3xl font-semibold">{t('利用規約')}</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground mb-8">{t('最終更新日: {{date}}', { date: '2026-10-11' })}</p>
          {isJapanese ? <TermsJa /> : <TermsEn />}
        </div>
      </div>
    </>
  );
}
