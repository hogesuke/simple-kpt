-- ボード削除時に関連データをカスケード削除するための設定
--
-- このマイグレーションは、boardsテーブルが削除された際に
-- 関連するitemsとboard_membersも自動的に削除されるように
-- 外部キー制約を更新します。

BEGIN;

-- ============================================================
-- ステップ1: itemsテーブルの外部キー制約を更新
-- ============================================================

-- 既存の外部キー制約を削除
ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_board_id_fkey;

-- ON DELETE CASCADEを追加した新しい外部キー制約を作成
ALTER TABLE public.items
  ADD CONSTRAINT items_board_id_fkey
  FOREIGN KEY (board_id)
  REFERENCES public.boards(id)
  ON DELETE CASCADE;

-- ============================================================
-- ステップ2: board_membersテーブルの外部キー制約を確認
-- （既にON DELETE CASCADEが設定されているはずだが、念のため再設定）
-- ============================================================

-- 既存の外部キー制約を削除
ALTER TABLE public.board_members
  DROP CONSTRAINT IF EXISTS board_members_board_id_fkey;

-- ON DELETE CASCADEを追加した新しい外部キー制約を作成
ALTER TABLE public.board_members
  ADD CONSTRAINT board_members_board_id_fkey
  FOREIGN KEY (board_id)
  REFERENCES public.boards(id)
  ON DELETE CASCADE;

COMMIT;

-- 注記:
-- - boards削除時、関連するitemsとboard_membersが自動的に削除されます
-- - これによりデータ整合性が保たれます
-- - Edge Functionsでのボード削除処理がシンプルになります