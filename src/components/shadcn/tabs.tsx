import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/cn';

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ref, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List ref={ref} className={cn('inline-flex items-end gap-6', className)} {...props} />;
}

function TabsTrigger({ className, ref, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'text-muted-foreground hover:text-foreground data-[state=active]:border-primary-dark data-[state=active]:text-primary-dark relative -mb-px inline-flex items-center justify-center border-b-[2.5px] border-transparent px-0.5 pb-3 text-[15px] font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 data-[state=active]:font-black',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ref, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content ref={ref} className={cn('mt-2', className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
