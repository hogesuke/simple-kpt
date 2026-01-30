import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

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
  const { handleError } = useErrorHandler();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<BoardNameFormData>({
    resolver: zodResolver(boardNameSchema),
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
      handleError(error, 'ボードの作成に失敗しました');
    }
  };

  const defaultTrigger = (
    <Button type="button">
      <Plus className="h-4 w-4" />
      ボードを作成
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいボードを作成</DialogTitle>
          <DialogDescription>ボードの名前を入力してください。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="boardName" className="block text-sm font-medium">
                ボード名
                <span className="text-red-500"> *</span>
              </label>
              <CharacterCounter current={name.length} max={BOARD_NAME_MAX_LENGTH} />
            </div>
            <Input
              id="boardName"
              // NOTE: 本来はautoFocusの使用は極力避けるべきだが、モーダルを開いた際の利便性を重視し例外として許容する
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              {...register('name')}
              placeholder="アルファチーム振り返り"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              キャンセル
            </Button>
            <LoadingButton type="submit" disabled={!name.trim() || name.length > BOARD_NAME_MAX_LENGTH} loading={isSubmitting}>
              作成
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
