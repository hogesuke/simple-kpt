import { AlertTriangle, Loader2 } from 'lucide-react';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { LoadingButton } from '@/components/forms/LoadingButton';
import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { deleteAccount, fetchOwnedBoards, OwnedBoard } from '@/lib/kpt-api';
import { useAuthStore } from '@/stores/useAuthStore';

type DialogStep = 'loading' | 'transfer' | 'confirm' | 'deleting';

interface TransferSelection {
  [boardId: string]: string; // boardId -> newOwnerId
}

interface AccountDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * アカウント削除ダイアログ
 */
export function AccountDeleteDialog({ isOpen, onOpenChange }: AccountDeleteDialogProps): ReactElement {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const clearSession = useAuthStore((state) => state.clearSession);

  const [step, setStep] = useState<DialogStep>('loading');
  const [ownedBoards, setOwnedBoards] = useState<OwnedBoard[]>([]);
  const [transfers, setTransfers] = useState<TransferSelection>({});
  const [error, setError] = useState<string | null>(null);
  const [bulkApplyUserId, setBulkApplyUserId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  /** 前回のOpen状態の追跡用（開いたときだけ処理を実行させるため） */
  const prevOpenRef = useRef(isOpen);
  /** 譲渡が必要なボード（他のメンバーがいるボード） */
  const boardsNeedingTransfer = useMemo(() => ownedBoards.filter((b) => b.hasOtherMembers), [ownedBoards]);
  /** 削除されるボード（他のメンバーがいないボード） */
  const boardsToDelete = useMemo(() => ownedBoards.filter((b) => !b.hasOtherMembers), [ownedBoards]);
  /** 全ての譲渡先が選択されているか */
  const isAllTransfersSelected = boardsNeedingTransfer.every((board) => transfers[board.id]);

  // 全ボードのメンバーを集約したユニークなユーザーリスト
  const allMembers = useMemo(() => {
    const memberMap = new Map<string, string | null>();
    for (const board of boardsNeedingTransfer) {
      for (const member of board.members) {
        if (!memberMap.has(member.userId)) {
          memberMap.set(member.userId, member.nickname);
        }
      }
    }
    return Array.from(memberMap.entries()).map(([userId, nickname]) => ({ userId, nickname }));
  }, [boardsNeedingTransfer]);

  // 未選択のボード数（一括適用対象）
  const unselectedCount = boardsNeedingTransfer.filter((board) => !transfers[board.id]).length;

  // 選択したユーザーが一括適用できるボード数
  const applicableBoardsCount = useMemo(() => {
    if (!bulkApplyUserId) return 0;
    return boardsNeedingTransfer.filter((board) => !transfers[board.id] && board.members.some((m) => m.userId === bulkApplyUserId)).length;
  }, [bulkApplyUserId, boardsNeedingTransfer, transfers]);

  // ダイアログを開いた際に所有ボードを取得
  useEffect(() => {
    const wasOpened = !prevOpenRef.current && isOpen;
    prevOpenRef.current = isOpen;

    if (!wasOpened) return;

    const load = async () => {
      try {
        const boards = await fetchOwnedBoards();
        setOwnedBoards(boards);

        // 所有ボードがない場合、または全て他のメンバーがいない場合は直接確認画面を表示する
        const needsTransfer = boards.some((b) => b.hasOtherMembers);
        if (needsTransfer) {
          setStep('transfer');
        } else {
          setStep('confirm');
        }
      } catch (err) {
        handleError(err, t('error:所有ボードの取得に失敗しました'));
        onOpenChange(false);
      }
    };

    void load();
  }, [isOpen, handleError, onOpenChange, t]);

  // onOpenChangeをラップして状態リセットを行う
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setStep('loading');
        setOwnedBoards([]);
        setTransfers({});
        setError(null);
        setBulkApplyUserId('');
        setIsProcessing(false);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // 未選択ボードへの一括適用
  const handleBulkApply = useCallback(() => {
    if (!bulkApplyUserId) return;

    setTransfers((prev) => {
      const newTransfers = { ...prev };
      for (const board of boardsNeedingTransfer) {
        // 未選択かつ選択したユーザーがメンバーの場合のみ適用する
        if (!newTransfers[board.id] && board.members.some((m) => m.userId === bulkApplyUserId)) {
          newTransfers[board.id] = bulkApplyUserId;
        }
      }
      return newTransfers;
    });

    setBulkApplyUserId('');
  }, [bulkApplyUserId, boardsNeedingTransfer]);

  const handleTransferChange = useCallback((boardId: string, newOwnerId: string) => {
    setTransfers((prev) => ({ ...prev, [boardId]: newOwnerId }));
  }, []);

  const handleGoToConfirm = useCallback(() => {
    setStep('confirm');
  }, []);

  const handleGoBack = useCallback(() => {
    setStep('transfer');
  }, []);

  const handleDelete = useCallback(async () => {
    setIsProcessing(true);
    setStep('deleting');
    setError(null);

    try {
      // 譲渡先選択を配列形式に変換
      const transfersArray = Object.entries(transfers).map(([boardId, newOwnerId]) => ({
        boardId,
        newOwnerId,
      }));

      await deleteAccount(transfersArray);
      toast.success(t('アカウントを削除しました'));

      onOpenChange(false);

      clearSession();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(t('error:アカウントの削除に失敗しました'));
      setStep('confirm');
      setIsProcessing(false);
      handleError(err, t('error:アカウントの削除に失敗しました'));
    }
  }, [transfers, onOpenChange, clearSession, navigate, handleError, t]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            {t('アカウントの削除')}
          </DialogTitle>
          <DialogDescription>{t('この操作は取り消すことができません。')}</DialogDescription>
        </DialogHeader>

        {step === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">{t('所有ボードを確認中...')}</span>
          </div>
        )}

        {/* ボード譲渡ステップ */}
        {step === 'transfer' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm">{t('以下のボードの所有権を他のメンバーに譲渡してください。')}</p>

            {/* 一括適用 */}
            {unselectedCount > 0 && allMembers.length > 0 && (
              <>
                <div className="flex flex-col gap-2 py-1">
                  <p className="text-muted-foreground text-xs">{t('未選択のボードに一括適用')}</p>
                  <div className="flex gap-2">
                    <Select value={bulkApplyUserId} onValueChange={setBulkApplyUserId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t('ユーザーを選択')} />
                      </SelectTrigger>
                      <SelectContent>
                        {allMembers.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.nickname ?? t('名前未設定')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkApply}
                      disabled={!bulkApplyUserId || applicableBoardsCount === 0}
                    >
                      {t('ui:適用')}
                      {applicableBoardsCount > 0 && t('ui:（{{count}}件）', { count: applicableBoardsCount })}
                    </Button>
                  </div>
                  {bulkApplyUserId && applicableBoardsCount === 0 && (
                    <p className="text-muted-foreground text-xs">{t('このユーザーがメンバーの未選択ボードはありません')}</p>
                  )}
                </div>
                <hr className="border-border" />
              </>
            )}

            <div className="max-h-60 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('board:ボード名')}</TableHead>
                    <TableHead className="w-40">{t('譲渡先')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boardsNeedingTransfer.map((board) => (
                    <TableRow key={board.id}>
                      <TableCell className="font-medium">{board.name}</TableCell>
                      <TableCell>
                        <Select value={transfers[board.id] ?? ''} onValueChange={(value) => handleTransferChange(board.id, value)}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={t('ui:選択')} />
                          </SelectTrigger>
                          <SelectContent>
                            {board.members.map((member) => (
                              <SelectItem key={member.userId} value={member.userId}>
                                {member.nickname ?? t('名前未設定')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {boardsToDelete.length > 0 && (
              <div className="bg-muted rounded-md p-3">
                <p className="text-muted-foreground text-sm">
                  {t('以下のボードは他にメンバーがいないため、削除されます:')}
                  <br />
                  {boardsToDelete.map((b) => b.name).join('、')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 確認ステップ */}
        {step === 'confirm' && (
          <div className="flex max-h-80 flex-col gap-4 overflow-y-auto">
            {error && <p className="text-destructive text-sm">{error}</p>}

            {boardsNeedingTransfer.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm">{t('以下のボードは所有権が譲渡されます:')}</p>
                <div className="max-h-40 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('board:ボード名')}</TableHead>
                        <TableHead>{t('新オーナー')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boardsNeedingTransfer.map((board) => {
                        const newOwner = board.members.find((m) => m.userId === transfers[board.id]);
                        return (
                          <TableRow key={board.id}>
                            <TableCell className="font-medium">{board.name}</TableCell>
                            <TableCell>{newOwner?.nickname ?? t('名前未設定')}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <p className="text-muted-foreground text-sm">{t('本当にアカウントを削除してもよろしいですか?')}</p>
          </div>
        )}

        {/* 削除中ステップ */}
        {step === 'deleting' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">{t('アカウントを削除中...')}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'transfer' && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('ui:キャンセル')}
              </Button>
              <Button onClick={handleGoToConfirm} disabled={!isAllTransfersSelected}>
                {t('ui:次へ')}
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('ui:キャンセル')}
              </Button>
              {boardsNeedingTransfer.length > 0 && (
                <Button variant="outline" onClick={handleGoBack}>
                  {t('戻る')}
                </Button>
              )}
              <LoadingButton variant="destructive" onClick={handleDelete} loading={isProcessing}>
                {t('アカウントを削除')}
              </LoadingButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
