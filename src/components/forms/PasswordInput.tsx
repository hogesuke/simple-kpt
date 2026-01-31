import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { FieldError } from '@/components/forms/FieldError';
import { Input } from '@/components/shadcn/input';

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  error?: string;
}

export function PasswordInput({ error, ref, id, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = id ? `${id}-error` : undefined;

  return (
    <>
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          className="pr-10"
          aria-invalid={!!error}
          aria-describedby={error && errorId ? errorId : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded"
          aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
        >
          {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </>
  );
}
