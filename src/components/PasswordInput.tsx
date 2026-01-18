import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

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
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded text-gray-500 hover:text-gray-700"
          aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
