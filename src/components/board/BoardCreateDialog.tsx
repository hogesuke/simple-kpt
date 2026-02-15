import { Plus } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { CharacterCounter } from '@/components/forms/CharacterCounter';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createBoard } from '@/lib/kpt-api';
import { boardNameSchema, BoardNameFormData } from '@/lib/schemas';
import { zodResolverWithI18n } from '@/lib/zodResolverWithI18n';
import { BOARD_NAME_MAX_LENGTH } from '@shared/constants';

import type { KptBoard } from '@/types/kpt';

interface BoardCreateDialogProps {
  onBoardCreated: (board: KptBoard) => void;
  trigger?: ReactElement;
}

/**
 * ボード作成ダイアログ
 */
export function BoardCreateDialog({ onBoardCreated, trigger }: BoardCreateDialogProps): ReactElement {
  const { t } = useTranslation('board');
  const { handleError } = useErrorHandler();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<BoardNameFormData>({
    resolver: zodResolverWithI18n(boardNameSchema),
    defaultValues: { name: '' },
  });

  const name = useWatch({ control, name: 'name', defaultValue: '' });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
    }
  };

  const onSubmit = async (data: BoardNameFormData) => {
    try {
      const board = await createBoard(data.name);
      setIsOpen(false);
      reset();
      onBoardCreated(board);
    } catch (error) {
      handleError(error, t('error:ボードの作成に失敗しました'));
    }
  };

  const defaultTrigger = (
    <Button type="button">
      <Plus className="h-4 w-4" />
      {t('ボードを作成')}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('新しいボードを作成')}</DialogTitle>
          <DialogDescription>{t('ボードの名前を入力してください。')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="boardName" className="block text-sm font-medium">
                {t('ボード名')}
              </label>
              <CharacterCounter current={name.length} max={BOARD_NAME_MAX_LENGTH} />
            </div>
            <Input
              id="boardName"
              // NOTE: 本来はautoFocusの使用は極力避けるべきだが、モーダルを開いた際の利便性を重視し例外として許容する
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'boardname-error' : undefined}
              {...register('name')}
              placeholder={t('アルファチーム振り返り')}
            />
            {errors.name?.message && (
              <span id="boardname-error" role="alert" className="sr-only">
                {errors.name.message}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              {t('ui:キャンセル')}
            </Button>
            <LoadingButton type="submit" disabled={!name.trim() || name.length > BOARD_NAME_MAX_LENGTH} loading={isSubmitting}>
              {t('ui:作成')}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
