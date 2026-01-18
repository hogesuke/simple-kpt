import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

function Checkbox({ className, ref, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground grid h-4 w-4 shrink-0 place-content-center rounded-sm border shadow disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('grid place-content-center text-current')}>
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
