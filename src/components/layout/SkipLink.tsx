import { ReactElement, ReactNode } from 'react';

interface SkipLinkProps {
  href?: string;
  children?: ReactNode;
}

export function SkipLink({ href = '#main-content', children = 'メインコンテンツへスキップ' }: SkipLinkProps): ReactElement {
  return (
    <a
      href={href}
      className="border-border bg-background text-foreground focus:ring-ring sr-only rounded border px-3 py-1.5 text-sm shadow-sm focus:not-sr-only focus:ring-2 focus:outline-none"
    >
      {children}
    </a>
  );
}
