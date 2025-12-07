import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Input } from './Input';

export const boardColumnVariants = cva(['bg-white', 'rounded-md', 'focus-visible:ring-1 focus-visible:ring-ring'], {
  variants: {},
  defaultVariants: {},
});

export interface CardInputProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof boardColumnVariants> {}

export function CardInput({ ...props }: CardInputProps) {
  return <Input className="text-md p-4" {...props} />;
}
