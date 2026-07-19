import { cn } from '@/lib/cn';

function Table({
  className,
  containerClassName,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & { ref?: React.Ref<HTMLTableElement>; containerClassName?: string }) {
  return (
    <div className={cn('border-border-subtle bg-card shadow-card relative w-full overflow-auto rounded-[14px] border', containerClassName)}>
      <table ref={ref} className={cn('w-full table-fixed caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

function TableHeader({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { ref?: React.Ref<HTMLTableSectionElement> }) {
  return <thead ref={ref} className={cn('bg-surface-subtle [&_tr]:border-border-subtle [&_tr]:border-b', className)} {...props} />;
}

function TableBody({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { ref?: React.Ref<HTMLTableSectionElement> }) {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { ref?: React.Ref<HTMLTableSectionElement> }) {
  return <tfoot ref={ref} className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)} {...props} />;
}

function TableRow({ className, ref, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { ref?: React.Ref<HTMLTableRowElement> }) {
  return (
    <tr
      ref={ref}
      className={cn('hover:bg-surface-subtle data-[state=selected]:bg-muted border-border-subtle border-b transition-colors', className)}
      {...props}
    />
  );
}

function TableHead({
  className,
  ref,
  scope = 'col',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <th
      ref={ref}
      scope={scope}
      className={cn(
        'text-muted-foreground px-5 py-3.5 text-left align-middle text-[12.5px] font-bold [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5',
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ref, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <td
      ref={ref}
      className={cn('px-5 py-[18px] align-middle [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5', className)}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement> & { ref?: React.Ref<HTMLTableCaptionElement> }) {
  return <caption ref={ref} className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
