// src/components/ui/CardInput.tsx
import * as React from 'react';

import { cn } from '@/lib/utils';

import { Input } from './Input';

export interface CardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSubmitText: (value: string) => void | Promise<void>;
}

export function CardInput({ onSubmitText, className, ...props }: CardInputProps) {
  const [value, setValue] = React.useState('');

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 日本語入力中のEnterキーの入力は無視する
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();

      const trimmed = value.trim();
      if (!trimmed) return;

      void Promise.resolve(onSubmitText(trimmed));
      setValue('');
    }
  };

  return (
    <Input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={handleKeyDown}
      className={cn('text-md p-4', className)}
      {...props}
    />
  );
}
