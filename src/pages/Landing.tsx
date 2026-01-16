/* eslint-disable jsx-a11y/anchor-is-valid -- FIXME: 利用規約等を作成してちゃんとリンクを張ったら削除する */
import { ArrowRight, CheckCircle, Download, RefreshCw, Timer } from 'lucide-react';
import { ReactElement, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

import { Button } from '@/components/ui/shadcn/button';
import { useAuthStore } from '@/stores/useAuthStore';

export function Landing(): ReactElement {
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
    <div className="flex h-full flex-col">
      <main className="bg-primary/5 flex-1">
        {/* ヒーロー */}
        <section className="from-primary/5 bg-linear-to-b to-transparent">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* 左側: テキスト */}
              <div className="flex flex-col items-start">
                <h1 className="mb-8 text-4xl font-semibold tracking-tight sm:text-5xl">
                  チームの振り返りを
                  <br />
                  <span className="text-primary">もっとシンプルに</span>
                </h1>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="rounded-full px-6" asChild>
                    <Link to="/demo">
                      デモを試す
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-6" asChild>
                    <Link to="/login">ログインして始める</Link>
                  </Button>
                </div>
              </div>

              {/* 右側: ヒーローイメージ */}
              <div className="relative">
                <img
                  src="/hero.webp"
                  alt="Simple KPTでチームが振り返りを行っている様子"
                  className="shadow-primary/10 w-full rounded-3xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 機能紹介 */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-12 text-center text-3xl font-semibold">主な機能</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard icon={<RefreshCw className="h-6 w-6" />} title="KPTフレームワーク" description="Keep・Problem・Tryの3つで整理" />
              <FeatureCard icon={<Timer className="h-6 w-6" />} title="タイマー機能" description="時間を決めて集中して振り返り" />
              <FeatureCard icon={<CheckCircle className="h-6 w-6" />} title="Tryの進捗管理" description="誰が何をやるか、チームで管理" />
              <FeatureCard icon={<Download className="h-6 w-6" />} title="エクスポート" description="MarkdownやCSVで書き出し" />
            </div>
          </div>
        </section>

        {/* デモ誘導 */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-semibold">まずはデモから</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">登録なしで試せます</p>
            <Button size="lg" className="rounded-full px-6" asChild>
              <Link to="/demo">
                デモを試す
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-muted-foreground text-sm">© Simple KPT</p>
            <nav className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                利用規約
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                プライバシーポリシー
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                お問い合わせ
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: ReactElement;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md">
      <div className="bg-primary/10 text-primary mb-4 inline-flex rounded-full p-3">{icon}</div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
