import { ArrowRight, CheckCircle, Download, RefreshCw, Timer } from 'lucide-react';
import { ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { Button } from '@/components/shadcn/button';
import { useAuthStore } from '@/stores/useAuthStore';

export function Landing(): ReactElement {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  // ログイン済みユーザーは/boardsにリダイレクト
  useEffect(() => {
    if (initialized && user) {
      navigate('/boards', { replace: true });
    }
  }, [initialized, user, navigate]);

  // 認証状態の確認中、またはログイン済みの場合は何も表示しない
  if (!initialized || user) {
    return <></>;
  }

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
                    {t('準備も操作も最小限。ツールの使い方ではなく、\n振り返りそのものに集中できるKPTツールです。')}
                  </p>
                  <div className="flex flex-wrap gap-3.5">
                    <Button className="h-[54px] rounded-xl px-7 text-base" asChild>
                      <Link to="/demo">
                        {t('デモを試す')}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-[54px] rounded-xl px-6.5 text-base" asChild>
                      <Link to="/signup">{t('今すぐ始める')}</Link>
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
              <div className="grid gap-5.5 md:grid-cols-2 lg:grid-cols-4">
                <FeatureCard
                  icon={<RefreshCw className="h-6 w-6" />}
                  title={t('KPTフレームワーク')}
                  description={t('Keep・Problem・Tryの3つで整理')}
                />
                <FeatureCard
                  icon={<Timer className="h-6 w-6" />}
                  title={t('タイマー機能')}
                  description={t('時間を決めて集中して振り返り')}
                />
                <FeatureCard
                  icon={<CheckCircle className="h-6 w-6" />}
                  title={t('Tryの進捗管理')}
                  description={t('誰が何をやるか、チームで管理')}
                />
                <FeatureCard
                  icon={<Download className="h-6 w-6" />}
                  title={t('board:エクスポート')}
                  description={t('MarkdownやCSVで書き出し')}
                />
              </div>
            </div>
          </section>

          {/* デモ誘導 */}
          <section className="py-20">
            <div className="mx-auto max-w-3xl px-4 text-center">
              <h2 className="mb-4 text-[32px] font-black">{t('まずはデモから')}</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">{t('登録なしで、実際の使い心地をそのまま試せます。')}</p>
              <Button className="h-[54px] rounded-xl px-7 text-base" asChild>
                <Link to="/demo">
                  {t('デモを試す')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
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
