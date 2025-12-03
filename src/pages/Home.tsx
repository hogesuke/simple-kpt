import { ReactElement } from 'react';

import { Button } from '@/components/ui/button';

export function Home(): ReactElement {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">KPT APP</h1>
      <Button>Button</Button>
    </section>
  );
}
