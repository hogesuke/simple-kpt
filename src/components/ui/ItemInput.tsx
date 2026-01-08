import { SendHorizonal } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { ITEM_TEXT_MAX_LENGTH } from '@shared/constants';

import { CharacterCounter } from './CharacterCounter';
import { Input } from './shadcn/input';

export interface ItemInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSubmitText: (value: string) => void | Promise<void>;
}

export function ItemInput({ onSubmitText, className, disabled, ...props }: ItemInputProps) {
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    void Promise.resolve(onSubmitText(trimmed)).then(() => {
      inputRef.current?.focus();
    });
    setValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 日本語入力中のEnterキーの入力は無視する
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const isOverLimit = value.length > ITEM_TEXT_MAX_LENGTH;
  const canSubmit = value.trim().length > 0 && !isOverLimit && !disabled;

  return (
    <div className="relative">
      <CharacterCounter current={value.length} max={ITEM_TEXT_MAX_LENGTH} className="absolute -top-7 right-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn('text-md px-4 py-5 pr-12', className)}
        {...props}
      />
      <button
        type="button"
        onClick={handleSubmit}
        onMouseDown={(e) => e.preventDefault()}
        disabled={!canSubmit}
        className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/50 absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors disabled:cursor-not-allowed"
        aria-label="送信"
      >
        <SendHorizonal className="h-4 w-4" />
      </button>
    </div>
  );
}
