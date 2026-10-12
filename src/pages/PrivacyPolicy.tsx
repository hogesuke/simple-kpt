import { ArrowLeft } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

function PrivacyJa(): ReactElement {
  return (
    <>
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">はじめに</h2>
        <p className="text-muted-foreground leading-relaxed">
          Simple KPT（以下「本サービス」といいます）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
          本プライバシーポリシーは、本サービスがどのような情報を取り扱い、どのように利用・保護するかを説明するものです。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第1条（運営者が取得する情報）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          本サービスはアカウント登録を必要とせず、ボードの内容やニックネームを運営者のサーバーに保存しません。運営者が取得する情報は、以下の技術情報に限られます。
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>IPアドレス</li>
          <li>ブラウザの種類</li>
          <li>アクセス日時</li>
          <li>Cookie情報</li>
          <li>エラー発生時の技術情報（エラーメッセージ、ブラウザの情報など）</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第2条（ボードの内容の取り扱い）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            ボードの内容（ボード名、カード、投票、担当者、期日、タイマーなど）およびニックネームは、同じボードの参加者の端末間で直接送受信され、運営者のサーバーを経由しません。
          </li>
          <li>
            参加者同士が接続する際の接続情報（参加者のIPアドレスを含みます）は、招待URLに含まれる鍵で暗号化されたうえで、運営者が提供する接続の仲介サーバーを経由して他の参加者に送られます。運営者は、暗号化された接続情報の内容を読むことはできません。
          </li>
          <li>端末間の直接通信の性質上、同じボードの参加者には、互いのIPアドレスが伝わります。</li>
          <li>
            ボードの内容、招待URL（鍵を含みます）、ニックネーム、および端末を識別するためのランダムなIDは、ユーザーの端末のブラウザ内の保存領域に保存されます。参加したボードの情報は、最後に開いてから30日を過ぎたもの、または保存数が20件を超えた場合は古いものから自動的に削除されます。また、ボードを始める画面の「最近参加したボード」からいつでも削除できます。
          </li>
          <li>招待URLを知っている人は誰でもボードに参加し、内容を閲覧・編集できます。招待URLの取り扱いにはご注意ください。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第3条（情報の利用目的）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">運営者が取得した情報は、以下の目的で利用します。</p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>本サービスの提供・運営（参加者同士の接続の仲介を含みます）</li>
          <li>本サービスの改善・新機能の開発</li>
          <li>不正利用の防止</li>
          <li>お問い合わせへの対応</li>
          <li>利用規約に違反する行為への対応</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第4条（情報の共有・第三者提供）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。</p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく場合</li>
          <li>人の生命、身体または財産の保護のために必要がある場合であって、ユーザーの同意を得ることが困難である場合</li>
          <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第5条（外部サービスの利用）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          本サービスは、以下の外部サービスを利用しています。これらのサービスにおける情報の取り扱いについては、各サービスのプライバシーポリシーをご確認ください。
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>
            <strong>Cloudflare</strong>:
            参加者同士の接続を仲介するサーバーとして利用。暗号化された接続情報を中継するのみで、ボードの内容は経由しません。運営者は、接続元のIPアドレスなどをログとして保存しない設定で運用しています。なお、Cloudflare社による情報の取り扱いについては、同社の
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              プライバシーポリシー
            </a>
            をご確認ください。
          </li>
          <li>
            <strong>Vercel</strong>: ホスティングサービスとして利用
          </li>
          <li>
            <strong>Sentry</strong>:
            エラー監視サービスとして利用。個人を特定できる情報は収集しません。招待URLに含まれるルームIDや鍵は送信しません。
          </li>
          <li>
            <strong>Google Analytics</strong>:
            アクセス解析サービスとして利用。ユーザーのサービス利用状況を匿名で収集し、サービスの改善に活用します。招待URLに含まれるルームIDや鍵は送信しません。Google
            Analyticsは、データ収集のためにCookieを使用します。詳細はGoogleの
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              プライバシーポリシー
            </a>
            をご確認ください。
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第6条（Cookieおよびブラウザの保存領域の使用）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>本サービスは、Google Analyticsによるアクセス解析のためにCookieを使用します。</li>
          <li>本サービスは、第2条に定める情報を保存するために、ブラウザの保存領域（localStorage、IndexedDB）を使用します。</li>
          <li>
            ユーザーはブラウザの設定によりCookieやブラウザの保存領域を無効にすることができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第7条（データの保管）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>運営者のサーバーには、ボードの内容は保存されません。</li>
          <li>
            ユーザーの端末に保存されたデータは、ユーザー自身が管理するものとし、ブラウザのデータの削除、または「最近参加したボード」からの削除により削除できます。
          </li>
          <li>外部サービスにおける情報は、各サービスの定める期間保管されます。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第8条（セキュリティ）</h2>
        <p className="text-muted-foreground leading-relaxed">
          本サービスは、ユーザーの情報を保護するために、適切なセキュリティ対策を講じています。
          ただし、インターネット上での通信は完全に安全であることを保証することはできません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第9条（プライバシーポリシーの変更）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>本プライバシーポリシーは、必要に応じて、ユーザーへの事前の告知なく変更されることがあります。</li>
          <li>変更後のプライバシーポリシーは、本ページに掲載された時点で効力を生じるものとします。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第10条（お問い合わせ）</h2>
        <p className="text-muted-foreground leading-relaxed">
          本プライバシーポリシーに関するお問い合わせは、本サービス内のお問い合わせフォームよりご連絡ください。
        </p>
      </section>
    </>
  );
}

function PrivacyEn(): ReactElement {
  return (
    <>
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Introduction</h2>
        <p className="text-muted-foreground leading-relaxed">
          Simple KPT (hereinafter referred to as &quot;the Service&quot;) respects user privacy and is committed to protecting personal
          information. This Privacy Policy explains what information the Service handles and how it is used and protected.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 1 (Information Collected by the Operator)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          The Service does not require account registration and does not store board contents or nicknames on the operator&apos;s servers.
          The information collected by the operator is limited to the following technical information:
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>IP address</li>
          <li>Browser type</li>
          <li>Access date and time</li>
          <li>Cookie information</li>
          <li>Technical information when errors occur (error messages, browser information, etc.)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 2 (Handling of Board Contents)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>
            Board contents (board name, cards, votes, assignees, due dates, timers, etc.) and nicknames are sent and received directly
            between the devices of participants on the same board and do not pass through the operator&apos;s servers.
          </li>
          <li>
            Connection information exchanged when participants connect to each other (including participants&apos; IP addresses) is
            encrypted with the key included in the invite URL and sent to other participants via a connection relay server provided by the
            operator. The operator cannot read the contents of the encrypted connection information.
          </li>
          <li>
            Due to the nature of direct communication between devices, participants on the same board can see each other&apos;s IP
            addresses.
          </li>
          <li>
            Board contents, invite URLs (including keys), nicknames, and a random ID that identifies the device are stored in the browser
            storage of the user&apos;s device. Information about boards you have joined is automatically deleted 30 days after it was last
            opened, or starting with the oldest when more than 20 boards are stored. You can also delete it at any time from &quot;Recent
            boards&quot; on the board start screen.
          </li>
          <li>Anyone with the invite URL can join the board and view or edit its contents. Please handle invite URLs with care.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 3 (Purpose of Use)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          The information collected by the operator is used for the following purposes:
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>Provision and operation of the Service (including relaying connections between participants)</li>
          <li>Improvement of the Service and development of new features</li>
          <li>Prevention of unauthorized use</li>
          <li>Responding to inquiries</li>
          <li>Addressing violations of the Terms of Service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 4 (Information Sharing and Third-Party Disclosure)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          The operator will not provide users&apos; personal information to third parties except in the following cases:
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>When user consent is obtained</li>
          <li>When required by law</li>
          <li>When necessary to protect life, body, or property, and obtaining user consent is difficult</li>
          <li>When cooperation is necessary for national or local government agencies to perform their duties as prescribed by law</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 5 (Use of External Services)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          The Service uses the following external services. Please refer to each service&apos;s privacy policy for information on how they
          handle data.
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>
            <strong>Cloudflare</strong>: Used as the server that relays connections between participants. It only relays encrypted
            connection information, and board contents do not pass through it. The operator runs it with settings that do not store logs
            such as client IP addresses. For how Cloudflare itself handles information, please refer to Cloudflare&apos;s{' '}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Vercel</strong>: Used for hosting services
          </li>
          <li>
            <strong>Sentry</strong>: Used for error monitoring services. To improve service stability, we collect technical information when
            errors occur (error messages, stack traces, browser information, etc.). We do not collect personally identifiable information
            such as IP addresses, and we do not send the room ID or key included in invite URLs.
          </li>
          <li>
            <strong>Google Analytics</strong>: Used for web analytics services. We anonymously collect information about how users interact
            with the Service (page views, devices used, geographic region, etc.) to improve the Service. We do not send the room ID or key
            included in invite URLs. Google Analytics uses cookies for data collection. For details, please refer to Google&apos;s{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 6 (Use of Cookies and Browser Storage)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>The Service uses cookies for web analytics via Google Analytics.</li>
          <li>The Service uses browser storage (localStorage, IndexedDB) to store the information described in Article 2.</li>
          <li>
            Users can disable cookies and browser storage through browser settings, but doing so may limit access to some features of the
            Service.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 7 (Data Retention)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>Board contents are not stored on the operator&apos;s servers.</li>
          <li>
            Data stored on the user&apos;s device is managed by the user and can be deleted by clearing browser data or by deleting it from
            &quot;Recent boards&quot;.
          </li>
          <li>Information held by external services is retained for the period specified by each service.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 8 (Security)</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Service implements appropriate security measures to protect user information. However, we cannot guarantee that internet
          communications are completely secure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 9 (Changes to Privacy Policy)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>This Privacy Policy may be changed without prior notice to users as necessary.</li>
          <li>The revised Privacy Policy takes effect upon publication on this page.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 10 (Contact)</h2>
        <p className="text-muted-foreground leading-relaxed">
          For inquiries regarding this Privacy Policy, please contact us through the contact form within the Service.
        </p>
      </section>
    </>
  );
}

export function Privacy(): ReactElement {
  const { t, i18n } = useTranslation('landing');
  const isJapanese = i18n.language === 'ja';

  return (
    <>
      <title>{t('プライバシーポリシー - Simple KPT')}</title>
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

        <h1 className="mb-8 text-3xl font-semibold">{t('プライバシーポリシー')}</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground mb-8">{t('最終更新日: {{date}}', { date: '2026-10-11' })}</p>
          {isJapanese ? <PrivacyJa /> : <PrivacyEn />}
        </div>
      </div>
    </>
  );
}
