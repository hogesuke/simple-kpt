import { Moon, Sun } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';

/**
 * ダークモード切り替えボタン
 *
 * デザイン仕様に合わせてアイコン1つのトグルとし、現在のモードと逆のアイコンを表示する。
 */
export function ThemeToggle(): ReactElement {
  const { t } = useTranslation('ui');
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-pressed={isDark}
      aria-label={isDark ? t('ライトモードに切り替え') : t('ダークモードに切り替え')}
      className="hover:text-foreground inline-flex items-center rounded transition-colors"
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
    </button>
  );
}
