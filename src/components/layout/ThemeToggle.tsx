import { Moon, Sun } from 'lucide-react';
import { ReactElement } from 'react';

import { Switch } from '@/components/shadcn/switch';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';

/**
 * ダークモード切り替えスイッチ
 */
export function ThemeToggle(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="flex items-center gap-2">
      <Sun className={cn('h-4 w-4 transition-colors', isDark ? 'text-muted-foreground' : 'text-foreground')} aria-hidden="true" />
      <Switch checked={isDark} onCheckedChange={handleChange} aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'} />
      <Moon className={cn('h-4 w-4 transition-colors', isDark ? 'text-foreground' : 'text-muted-foreground')} aria-hidden="true" />
    </div>
  );
}
