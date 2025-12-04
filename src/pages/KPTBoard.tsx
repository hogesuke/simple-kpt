import { ReactElement } from 'react';

import { BoardColumn } from '@/components/ui/BoardColumn';

export function KPTBoard(): ReactElement {
  return (
    <section className="flex h-screen gap-x-4 p-8">
      <BoardColumn title="Keep" type="keep" />
      <BoardColumn title="Problem" type="problem" />
      <BoardColumn title="Try" type="try" />
    </section>
  );
}
