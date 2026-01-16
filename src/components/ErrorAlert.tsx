import { ReactElement, ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/shadcn/alert';

interface ErrorAlertProps {
  message: string;
  children?: ReactNode;
}

/**
 * 操作を継続できないエラーが発生した場合に表示するアラートコンポーネント
 */
export function ErrorAlert({ message, children }: ErrorAlertProps): ReactElement {
  return (
    <Alert variant="destructive">
      <div className="flex items-center justify-between gap-4">
        <AlertDescription>{message}</AlertDescription>
        {children}
      </div>
    </Alert>
  );
}

interface ErrorAlertActionProps {
  children: ReactNode;
}

/**
 * ErrorAlert内に配置するアクションボタンのラッパー
 */
export function ErrorAlertAction({ children }: ErrorAlertActionProps): ReactElement {
  return <div className="shrink-0">{children}</div>;
}
