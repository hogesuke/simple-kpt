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
          本プライバシーポリシーは、本サービスがどのような情報を収集し、どのように利用・保護するかを説明するものです。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第1条（収集する情報）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">本サービスは、以下の情報を収集することがあります。</p>
        <ol className="text-muted-foreground list-decimal space-y-3 pl-6 leading-relaxed">
          <li>
            <strong>アカウント情報</strong>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>メールアドレス</li>
              <li>ニックネーム</li>
              <li>認証に関する情報</li>
            </ul>
          </li>
          <li>
            <strong>利用データ</strong>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>作成したボード、アイテムの内容</li>
              <li>サービスの利用履歴</li>
            </ul>
          </li>
          <li>
            <strong>技術情報</strong>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>IPアドレス</li>
              <li>ブラウザの種類</li>
              <li>アクセス日時</li>
              <li>Cookie情報</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第2条（情報の利用目的）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">収集した情報は、以下の目的で利用します。</p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>本サービスの提供・運営</li>
          <li>ユーザー認証およびアカウント管理</li>
          <li>本サービスの改善・新機能の開発</li>
          <li>不正利用の防止</li>
          <li>お問い合わせへの対応</li>
          <li>利用規約に違反する行為への対応</li>
          <li>本サービスに関するお知らせの送信</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第3条（情報の共有・第三者提供）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく場合</li>
          <li>人の生命、身体または財産の保護のために必要がある場合であって、ユーザーの同意を得ることが困難である場合</li>
          <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第4条（外部サービスの利用）</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          本サービスは、以下の外部サービスを利用しています。これらのサービスにおける情報の取り扱いについては、各サービスのプライバシーポリシーをご確認ください。
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>
            <strong>Supabase</strong>: 認証・データベースサービスとして利用
          </li>
          <li>
            <strong>Resend</strong>: メール送信サービスとして利用
          </li>
          <li>
            <strong>Vercel</strong>: ホスティングサービスとして利用
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第5条（Cookieの使用）</h2>
        <p className="text-muted-foreground leading-relaxed">
          本サービスは、ユーザー認証およびサービス提供のためにCookieを使用します。
          ユーザーはブラウザの設定によりCookieを無効にすることができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第6条（データの保管）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>ユーザーのデータは、本サービスの提供に必要な期間保管されます。</li>
          <li>ユーザーがアカウントを削除した場合、関連するデータは合理的な期間内に削除されます。</li>
          <li>法令に基づく保管義務がある場合は、その期間保管することがあります。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第7条（セキュリティ）</h2>
        <p className="text-muted-foreground leading-relaxed">
          本サービスは、ユーザーの情報を保護するために、適切なセキュリティ対策を講じています。
          ただし、インターネット上での通信は完全に安全であることを保証することはできません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第8条（プライバシーポリシーの変更）</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>本プライバシーポリシーは、必要に応じて、ユーザーへの事前の告知なく変更されることがあります。</li>
          <li>変更後のプライバシーポリシーは、本ページに掲載された時点で効力を生じるものとします。</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">第9条（お問い合わせ）</h2>
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
          information. This Privacy Policy explains what information the Service collects and how it is used and protected.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 1 (Information We Collect)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">The Service may collect the following information:</p>
        <ol className="text-muted-foreground list-decimal space-y-3 pl-6 leading-relaxed">
          <li>
            <strong>Account Information</strong>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Email address</li>
              <li>Nickname</li>
              <li>Authentication-related information</li>
            </ul>
          </li>
          <li>
            <strong>Usage Data</strong>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Content of boards and items you create</li>
              <li>Service usage history</li>
            </ul>
          </li>
          <li>
            <strong>Technical Information</strong>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Access date and time</li>
              <li>Cookie information</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 2 (Purpose of Use)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">The collected information is used for the following purposes:</p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>Provision and operation of the Service</li>
          <li>User authentication and account management</li>
          <li>Improvement of the Service and development of new features</li>
          <li>Prevention of unauthorized use</li>
          <li>Responding to inquiries</li>
          <li>Addressing violations of the Terms of Service</li>
          <li>Sending notifications related to the Service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 3 (Information Sharing and Third-Party Disclosure)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          The Service will not provide users&apos; personal information to third parties except in the following cases:
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>When user consent is obtained</li>
          <li>When required by law</li>
          <li>When necessary to protect life, body, or property, and obtaining user consent is difficult</li>
          <li>When cooperation is necessary for national or local government agencies to perform their duties as prescribed by law</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 4 (Use of External Services)</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          The Service uses the following external services. Please refer to each service&apos;s privacy policy for information on how they
          handle data.
        </p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-6 leading-relaxed">
          <li>
            <strong>Supabase</strong>: Used for authentication and database services
          </li>
          <li>
            <strong>Resend</strong>: Used for email delivery services
          </li>
          <li>
            <strong>Vercel</strong>: Used for hosting services
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 5 (Use of Cookies)</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Service uses cookies for user authentication and service provision. Users can disable cookies through browser settings, but
          doing so may limit access to some features of the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 6 (Data Retention)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>User data is retained for the period necessary to provide the Service.</li>
          <li>When a user deletes their account, related data will be deleted within a reasonable period.</li>
          <li>Data may be retained for the required period if there is a legal obligation to do so.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 7 (Security)</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Service implements appropriate security measures to protect user information. However, we cannot guarantee that internet
          communications are completely secure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 8 (Changes to Privacy Policy)</h2>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-6 leading-relaxed">
          <li>This Privacy Policy may be changed without prior notice to users as necessary.</li>
          <li>The revised Privacy Policy takes effect upon publication on this page.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Article 9 (Contact)</h2>
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
      <title>{t('プライバシーポリシー')} - Simple KPT</title>
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
          <p className="text-muted-foreground mb-8">{t('最終更新日: {{date}}', { date: '2026-01-17' })}</p>
          {isJapanese ? <PrivacyJa /> : <PrivacyEn />}
        </div>
      </div>
    </>
  );
}
