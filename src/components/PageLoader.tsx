import { ReactElement } from 'react';

/**
 * ページ全体の読み込み中に表示するローダー
 */
export function PageLoader(): ReactElement {
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="animate-wave h-6 w-2 rounded-[3px] bg-[#c2c9d4]" style={{ animationDelay: '0s' }} />
      <span className="animate-wave h-6 w-2 rounded-[3px] bg-[#a5adb9]" style={{ animationDelay: '0.15s' }} />
      <span className="animate-wave h-6 w-2 rounded-[3px] bg-[#8890a0]" style={{ animationDelay: '0.3s' }} />
    </div>
  );
}
