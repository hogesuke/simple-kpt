import { Send } from 'lucide-react';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { itemTextSchema, ItemTextFormData } from '@/lib/schemas';
import { zodResolverWithI18n } from '@/lib/zodResolverWithI18n';
import { ITEM_TEXT_MAX_LENGTH } from '@shared/constants';

import { CharacterCounter } from './CharacterCounter';

export interface ItemInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmitText: (value: string) => void | Promise<void>;
  /** ヘッダー行の左側に並べる要素（カラム選択など） */
  headerLeft?: React.ReactNode;
}

export function ItemInput({ onSubmitText, className, disabled, headerLeft, ...props }: ItemInputProps) {
  const { t } = useTranslation('board');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isValid, errors },
  } = useForm<ItemTextFormData>({
    resolver: zodResolverWithI18n(itemTextSchema),
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
    <div className="flex flex-col gap-2.5">
      {/* ヘッダー行: 左に任意の要素（カラム選択）、右に文字数カウンター */}
      <div className="flex items-end justify-between gap-3">
        {headerLeft}
        <CharacterCounter current={text.length} max={ITEM_TEXT_MAX_LENGTH} showProgress className="ml-auto" />
      </div>

      {/* 入力欄は外枠側にボーダー・影を持たせ、input自体は枠なしにする */}
      <div className="border-border bg-card shadow-card focus-within:border-ring flex items-center gap-2.5 rounded-[14px] border py-1.5 pr-1.5 pl-[18px] transition-colors">
        <input
          type="text"
          ref={(e) => {
            formRef(e);
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
          }}
          {...registerProps}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-invalid={!!errors.text}
          aria-describedby={errors.text ? 'item-text-error' : undefined}
          aria-label={props.placeholder}
          className={cn(
            'placeholder:text-placeholder min-w-0 flex-1 bg-transparent text-[14.5px] outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!canSubmit}
          className="bg-primary text-primary-foreground shadow-cta hover:bg-primary-dark disabled:bg-primary/50 flex size-[42px] shrink-0 items-center justify-center rounded-[11px] transition-colors disabled:cursor-not-allowed disabled:shadow-none"
          aria-label={t('ui:送信')}
        >
          <Send className="h-[18px] w-[18px]" />
        </button>
      </div>
      {errors.text?.message && (
        <span id="item-text-error" role="alert" className="sr-only">
          {errors.text.message}
        </span>
      )}
    </div>
  );
}
