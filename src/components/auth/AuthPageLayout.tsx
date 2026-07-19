import { ReactElement, ReactNode } from 'react';

interface AuthPageLayoutProps {
  title: string;
  children: ReactNode;
}

export function AuthPageLayout({ title, children }: AuthPageLayoutProps): ReactElement {
  return (
    <div className="flex h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* カード幅はデザインの528px（枠640px − 左右56px）に合わせる */}
      <div className="w-full max-w-[528px]">
        <h1 className="mb-7 text-center text-2xl font-black">{title}</h1>
        <div className="border-border-subtle bg-card rounded-column shadow-card border px-[30px] pt-[30px] pb-8">{children}</div>
      </div>
    </div>
  );
}
