import { ReactElement } from 'react';

import { BoardColumn } from '@/components/ui/BoardColumn';
import { CardInput } from '@/components/ui/CardInput';

export function KPTBoard(): ReactElement {
  return (
    <section className="mx-auto grid h-screen w-full max-w-[1920px] grid-rows-[1fr_auto] gap-y-4 p-8">
      <div className="flex flex-col items-stretch gap-x-4 gap-y-4 lg:flex-row">
        <BoardColumn title="Keep" type="keep" />
        <BoardColumn title="Problem" type="problem" />
        <BoardColumn title="Try" type="try" />
      </div>
      <div>
        <CardInput />
      </div>
    </section>
  );
}
