import { ArrowLeft } from 'lucide-react';
import { ReactElement } from 'react';
import { Link } from 'react-router';

export function Privacy(): ReactElement {
  return (
    <>
      <title>プライバシーポリシー - Simple KPT</title>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <nav className="mb-8">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            トップページに戻る
          </Link>
        </nav>

        <h1 className="mb-8 text-3xl font-semibold">プライバシーポリシー</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground mb-8">最終更新日: 2026年1月17日</p>

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
        </div>
      </div>
    </>
  );
}
