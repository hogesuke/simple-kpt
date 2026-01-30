import { zodResolver } from '@hookform/resolvers/zod';
import { SendHorizonal } from 'lucide-react';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Input } from '@/components/shadcn/input';
import { cn } from '@/lib/cn';
import { itemTextSchema, ItemTextFormData } from '@/lib/schemas';
import { ITEM_TEXT_MAX_LENGTH } from '@shared/constants';

import { CharacterCounter } from './CharacterCounter';

export interface ItemInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmitText: (value: string) => void | Promise<void>;
}

export function ItemInput({ onSubmitText, className, disabled, ...props }: ItemInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isValid },
  } = useForm<ItemTextFormData>({
    resolver: zodResolver(itemTextSchema),
    defaultValues: { text: '' },
    mode: 'onChange',
  });

  const text = useWatch({ control, name: 'text', defaultValue: '' });

  const submitAndFocus = (data: ItemTextFormData) => {
    void Promise.resolve(onSubmitText(data.text)).then(() => {
      inputRef.current?.focus();
    });
    reset();
  };

  const handleButtonClick = () => {
    handleSubmit(submitAndFocus)();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 日本語入力中のEnterキーの入力は無視する
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (isValid) {
        handleButtonClick();
      }
    }
  };

  const { ref: formRef, ...registerProps } = register('text');

  const canSubmit = isValid && !disabled;

  return (
    <div className="relative">
      <CharacterCounter current={text.length} max={ITEM_TEXT_MAX_LENGTH} className="absolute -top-7 right-0" />
      <Input
        ref={(e) => {
          formRef(e);
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
        }}
        {...registerProps}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn('text-md px-4 py-5 pr-12', className)}
        {...props}
      />
      <button
        type="button"
        onClick={handleButtonClick}
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
