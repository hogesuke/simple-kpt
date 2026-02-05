import { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface SkipLinkProps {
  href?: string;
  children?: ReactNode;
}

export function SkipLink({ href = '#main-content', children }: SkipLinkProps): ReactElement {
  const { t } = useTranslation('ui');

  return (
    <a
      href={href}
      className="border-border bg-background text-foreground focus:ring-ring sr-only rounded border px-3 py-1.5 text-sm shadow-sm focus:not-sr-only focus:ring-2 focus:outline-none"
    >
      {children ?? t('メインコンテンツへスキップ')}
    </a>
  );
}
