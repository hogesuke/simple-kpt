import { cn } from '@/lib/cn';

function Input({ className, type, ref, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn([
        'border-input file:text-foreground placeholder:text-muted-foreground',
        'flex h-10 w-full rounded-md border bg-transparent px-4 py-2 text-base shadow-sm transition-colors',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      ])}
      ref={ref}
      {...props}
    />
  );
}

export { Input };
