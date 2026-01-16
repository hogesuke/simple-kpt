import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { Input } from '@/components/ui/shadcn/input';

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ error, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="relative">
        <Input ref={ref} type={showPassword ? 'text' : 'password'} className="pr-10" {...props} />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </>
  );
});

PasswordInput.displayName = 'PasswordInput';
