import { ReactElement } from 'react';

/**
 * ページ全体の読み込み中に表示するローダー
 *
 * ロゴマークと同じKPT3色・同じ比率（幅:高さ = 7:22 / 角丸・間隔は幅の約0.43倍）の
 * 3本バーが波打つ。
 */
export function PageLoader(): ReactElement {
  return (
    <div className="flex h-full items-center justify-center gap-[3.5px]">
      <span className="animate-wave bg-kpt-keep/65 h-[25px] w-2 rounded-[3.5px]" style={{ animationDelay: '0s' }} />
      <span className="animate-wave bg-kpt-problem/65 h-[25px] w-2 rounded-[3.5px]" style={{ animationDelay: '0.15s' }} />
      <span className="animate-wave bg-kpt-try/65 h-[25px] w-2 rounded-[3.5px]" style={{ animationDelay: '0.3s' }} />
    </div>
  );
}
