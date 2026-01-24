import { ReactElement } from 'react';
import { Link } from 'react-router';

export function NotFound(): ReactElement {
  return (
    <>
      <title>ページが見つかりません - Simple KPT</title>
      <div className="flex h-full flex-col items-center justify-center px-4">
        <h1 className="text-muted-foreground text-6xl font-bold">404</h1>
        <p className="text-muted-foreground mt-4 text-lg">ページが見つかりません</p>
        <Link to="/" className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 rounded-md px-4 py-2 text-sm font-medium">
          ホームに戻る
        </Link>
      </div>
    </>
  );
}
