import { ArrowRight, Download, Link2, ShieldCheck } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/shadcn/button';

export function Landing(): ReactElement {
  const { t } = useTranslation('landing');

  return (
    <>
      <title>Simple KPT</title>
      <div className="flex h-full flex-col">
        <main className="flex-1">
          {/* ヒーロー（背景はLayoutのグラデーションをそのまま使う） */}
          <section>
            <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
              <div className="grid items-center gap-12 lg:grid-cols-2">
                {/* 左側: テキスト */}
                <div className="flex flex-col items-start">
                  {(() => {
                    const [line1, line2] = t('チームの振り返りを\nもっとシンプルに').split('\n');
                    return (
                      <h1 className="mb-5 text-4xl leading-[1.22] font-black tracking-tight whitespace-pre-line sm:text-[52px]">
                        {line1}
                        {'\n'}
                        <span className="text-primary">{line2}</span>
                      </h1>
                    );
                  })()}
                  <p className="text-muted-foreground mb-8 max-w-[420px] text-[17px] leading-[1.85] whitespace-pre-line">
                    {t('登録不要。URLを共有するだけ。\nすぐにチームで振り返りを始められます。')}
                  </p>
                  <div className="flex flex-wrap gap-3.5">
                    <Button className="h-[54px] rounded-xl px-7 text-base" asChild>
                      <Link to="/new">
                        {t('今すぐ始める')}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-[54px] rounded-xl px-6.5 text-base" asChild>
                      <Link to="/demo">{t('デモを試す')}</Link>
                    </Button>
                  </div>
                </div>

                {/* 右側: ヒーローイメージ */}
                <div className="relative">
                  <img
                    src="/hero.webp"
                    alt={t('Simple KPTでチームが振り返りを行っている様子')}
                    width={1536}
                    height={1024}
                    className="w-full rounded-[20px] shadow-[0_30px_60px_-30px_rgb(60_80_140_/_0.5)]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 機能紹介 */}
          <section className="bg-card py-20">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-12 text-center">
                {/* 英字のセクションラベル（13px / letter-spacing .14em） */}
                <div className="text-primary mb-2.5 text-[13px] font-bold tracking-[0.14em]">FEATURES</div>
                <h2 className="text-[32px] font-black">{t('主な機能')}</h2>
              </div>
              <div className="grid gap-5.5 md:grid-cols-3">
                <FeatureCard
                  icon={<Link2 className="h-6 w-6" />}
                  title={t('登録不要')}
                  description={t('URLを共有するだけで、すぐに参加')}
                />
                <FeatureCard
                  icon={<ShieldCheck className="h-6 w-6" />}
                  title={t('サーバー保存なし')}
                  description={t('ボードの内容は参加者の端末にだけ保存')}
                />
                <FeatureCard
                  icon={<Download className="h-6 w-6" />}
                  title={t('board:エクスポート')}
                  description={t('Markdown・CSVで記録、ファイルで続きから再開')}
                />
              </div>
            </div>
          </section>

          {/* 利用開始の誘導 */}
          <section className="py-20">
            <div className="mx-auto max-w-3xl px-4 text-center">
              <h2 className="mb-4 text-[32px] font-black">{t('さっそく始めましょう')}</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {t('登録は不要です。ボードを作ってURLを共有すれば、すぐにチームで振り返りを始められます。')}
              </p>
              <div className="flex flex-wrap justify-center gap-3.5">
                <Button className="h-[54px] rounded-xl px-7 text-base" asChild>
                  <Link to="/new">
                    {t('今すぐ始める')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="h-[54px] rounded-xl px-6.5 text-base" asChild>
                  <Link to="/demo">{t('デモを試す')}</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        {/* フッター */}
        <footer className="border-border-subtle bg-card border-t py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-muted-foreground text-sm">© Simple KPT</p>
              <nav className="flex gap-6">
                <Link to="/terms" className="text-muted-foreground hover:text-foreground rounded text-sm transition-colors">
                  {t('利用規約')}
                </Link>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground rounded text-sm transition-colors">
                  {t('プライバシーポリシー')}
                </Link>
                <a
                  href="https://forms.gle/Fo9pQw125S5mcQx79"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground rounded text-sm transition-colors"
                >
                  {t('お問い合わせ')}
                </a>
                <a
                  href="/licenses.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground rounded text-sm transition-colors"
                >
                  {t('ライセンス')}
                </a>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

interface FeatureCardProps {
  icon: ReactElement;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="border-border-subtle bg-card rounded-column shadow-card border px-6 py-7">
      <div className="bg-surface-muted text-primary mb-4.5 inline-flex size-12 items-center justify-center rounded-xl">{icon}</div>
      <h3 className="mb-2 text-base font-bold">{title}</h3>
      <p className="text-muted-foreground-subtle text-[13.5px] leading-[1.7]">{description}</p>
    </div>
  );
}
