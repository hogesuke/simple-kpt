import { zodResolver } from '@hookform/resolvers/zod';
import { ReactElement, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { CharacterCounter } from '@/components/forms/CharacterCounter';
import { LoadingButton } from '@/components/forms/LoadingButton';
import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { boardNameSchema, BoardNameFormData } from '@/lib/schemas';
import { BOARD_NAME_MAX_LENGTH } from '@shared/constants';

interface BoardRenameDialogProps {
  /**
   * 現在のボード名
   */
  boardName: string;
  /**
   * 更新処理中かどうか
   */
  isUpdating: boolean;
  /**
   * 更新処理のコールバック
   */
  onRename: (newName: string) => void | Promise<void>;
  /**
   * ダイアログの開閉状態
   */
  isOpen: boolean;
  /**
   * ダイアログの開閉状態を変更するコールバック
   */
  onOpenChange: (open: boolean) => void;
}

/**
 * ボード名変更ダイアログ
 */
export function BoardRenameDialog({ boardName, isUpdating, onRename, isOpen, onOpenChange }: BoardRenameDialogProps): ReactElement {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isValid },
  } = useForm<BoardNameFormData>({
    resolver: zodResolver(boardNameSchema),
    defaultValues: { name: boardName },
    mode: 'onChange',
  });

  const name = useWatch({ control, name: 'name', defaultValue: boardName });

  // ダイアログが開くときに現在のボード名をセットする
  useEffect(() => {
    if (isOpen) {
      reset({ name: boardName });
    }
  }, [isOpen, boardName, reset]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!isUpdating) {
      onOpenChange(newOpen);
    }
  };

  const onSubmit = async (data: BoardNameFormData) => {
    await onRename(data.name);
  };

  const isUnchanged = name.trim() === boardName;
  const canSubmit = isValid && !isUnchanged && !isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ボード名を変更</DialogTitle>
          <DialogDescription>新しいボード名を入力してください。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="newBoardName" className="block text-sm font-medium">
                ボード名
                <span className="text-red-500"> *</span>
              </label>
              <CharacterCounter current={name.length} max={BOARD_NAME_MAX_LENGTH} />
            </div>
            <Input
              id="newBoardName"
              // NOTE: 本来はautoFocusの使用は極力避けるべきだが、モーダルを開いた際の利便性を重視し例外として許容する
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              {...register('name')}
              disabled={isUpdating}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isUpdating}>
              キャンセル
            </Button>
            <LoadingButton type="submit" disabled={!isValid || isUnchanged} loading={isUpdating}>
              変更
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
