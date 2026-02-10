import { ReactElement, ReactNode } from 'react';

interface AuthPageLayoutProps {
  title: string;
  children: ReactNode;
}

export function AuthPageLayout({ title, children }: AuthPageLayoutProps): ReactElement {
  return (
    <div className="bg-muted flex h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-2xl font-bold">{title}</h2>
        </div>
        <div className="bg-card rounded-lg px-8 py-8 shadow">{children}</div>
      </div>
    </div>
  );
}
