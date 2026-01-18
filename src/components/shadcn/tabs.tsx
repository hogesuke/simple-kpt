import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/cn';

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ref, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List ref={ref} className={cn('border-border inline-flex h-10 items-center gap-1 border-b', className)} {...props} />
  );
}

function TabsTrigger({ className, ref, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary relative -mb-0.5 inline-flex items-center justify-center border-b-2 border-transparent px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 data-[state=active]:font-bold',
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
