-- allowed_user_idsパターンを使用したセキュアなRealtime実装
--
-- 背景:
-- Supabase Realtimeは複雑なRLSポリシー（EXISTS、INなどのサブクエリ）と互換性がない。
-- そのため、このマイグレーションは、allowed_user_idsパターンを使用してセキュアなRealtimeソリューションを実装する。
--
-- 1. itemsテーブル: RLSにallowed_user_ids配列を使用（Realtime互換）
-- 2. boards、board_members、profiles: service_roleのみに制限（Realtime不要）
-- 3. トリガー: allowed_user_idsをboard_membersと自動同期

BEGIN;

-- ============================================================
-- ステップ1: 全テーブルのRealtime設定
-- ============================================================

-- DELETEイベント用にREPLICA IDENTITYを設定
ALTER TABLE public.items REPLICA IDENTITY FULL;
ALTER TABLE public.boards REPLICA IDENTITY FULL;
ALTER TABLE public.board_members REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- supabase_realtime publicationにテーブルを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'boards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'board_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.board_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- ============================================================
-- ステップ2: itemsテーブルにallowed_user_idsを追加
-- ============================================================

-- allowed_user_idsカラムを追加
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS allowed_user_ids uuid[] DEFAULT '{}';

-- 配列検索を高速化するためのGINインデックスを作成
CREATE INDEX IF NOT EXISTS idx_items_allowed_users
ON public.items USING GIN (allowed_user_ids);

-- ============================================================
-- ステップ3: allowed_user_ids同期用のトリガー関数を作成
-- ============================================================

-- トリガー関数: アイテムINSERT時にallowed_user_idsを設定
CREATE OR REPLACE FUNCTION set_item_allowed_users_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- allowed_user_idsをボードの全メンバーに設定
  NEW.allowed_user_ids := (
    SELECT COALESCE(array_agg(user_id), '{}')
    FROM public.board_members
    WHERE board_id = NEW.board_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー関数: board_members変更時にallowed_user_idsを同期
CREATE OR REPLACE FUNCTION sync_item_allowed_users_optimized()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 新しいメンバーが追加されたとき: allowed_user_idsにuser_idを追加
    UPDATE public.items
    SET allowed_user_ids = array_append(
      COALESCE(allowed_user_ids, '{}'),
      NEW.user_id
    )
    WHERE board_id = NEW.board_id
    AND NOT (NEW.user_id = ANY(COALESCE(allowed_user_ids, '{}')));

  ELSIF TG_OP = 'DELETE' THEN
    -- メンバーが削除されたとき: allowed_user_idsからuser_idを削除
    UPDATE public.items
    SET allowed_user_ids = array_remove(allowed_user_ids, OLD.user_id)
    WHERE board_id = OLD.board_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    -- user_idが変更されたとき（稀なケース）: 旧IDを新IDに置換
    UPDATE public.items
    SET allowed_user_ids = array_replace(
      allowed_user_ids,
      OLD.user_id,
      NEW.user_id
    )
    WHERE board_id = NEW.board_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ステップ4: トリガーをアタッチ
-- ============================================================

-- トリガー: アイテムINSERT時にallowed_user_idsを設定
DROP TRIGGER IF EXISTS trigger_set_allowed_users_on_insert ON public.items;
CREATE TRIGGER trigger_set_allowed_users_on_insert
BEFORE INSERT ON public.items
FOR EACH ROW
EXECUTE FUNCTION set_item_allowed_users_on_insert();

-- トリガー: board_members変更時にallowed_user_idsを同期
DROP TRIGGER IF EXISTS trigger_sync_allowed_users ON public.board_members;
CREATE TRIGGER trigger_sync_allowed_users
AFTER INSERT OR DELETE OR UPDATE ON public.board_members
FOR EACH ROW
EXECUTE FUNCTION sync_item_allowed_users_optimized();

-- ============================================================
-- ステップ5: 既存アイテムのallowed_user_idsを初期化
-- ============================================================

UPDATE public.items i
SET allowed_user_ids = (
  SELECT COALESCE(array_agg(bm.user_id), '{}')
  FROM public.board_members bm
  WHERE bm.board_id = i.board_id
)
WHERE allowed_user_ids IS NULL OR allowed_user_ids = '{}';

-- ============================================================
-- ステップ6: RLSポリシーを更新
-- ============================================================

-- itemsテーブル: ユーザーがアクセス権を持つアイテムの読み取りを許可
DROP POLICY IF EXISTS "realtime_items_select" ON public.items;
DROP POLICY IF EXISTS "authenticated_members_can_select_items" ON public.items;
DROP POLICY IF EXISTS "Members can select items from their boards" ON public.items;
DROP POLICY IF EXISTS "temp_all_authenticated_can_select" ON public.items;
DROP POLICY IF EXISTS "authenticated_can_read_items" ON public.items;
DROP POLICY IF EXISTS "Board owners can view items" ON public.items;
DROP POLICY IF EXISTS "Board owners can create items" ON public.items;
DROP POLICY IF EXISTS "Board owners can update items" ON public.items;
DROP POLICY IF EXISTS "Board owners can delete items" ON public.items;

CREATE POLICY "users_can_read_allowed_items"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(allowed_user_ids));

-- boardsテーブル: service_roleのみに制限
DROP POLICY IF EXISTS "authenticated_can_read_boards" ON public.boards;
DROP POLICY IF EXISTS "authenticated_can_select_their_boards" ON public.boards;
DROP POLICY IF EXISTS "Members can select their boards" ON public.boards;
DROP POLICY IF EXISTS "Users can view boards they own" ON public.boards;
DROP POLICY IF EXISTS "Users can create boards" ON public.boards;
DROP POLICY IF EXISTS "Owners can update their boards" ON public.boards;
DROP POLICY IF EXISTS "Owners can delete their boards" ON public.boards;

REVOKE ALL ON public.boards FROM anon, authenticated;
GRANT ALL ON public.boards TO service_role;

CREATE POLICY "deny_all_access"
  ON public.boards
  FOR ALL
  USING (false);

-- board_membersテーブル: service_roleのみに制限
DROP POLICY IF EXISTS "authenticated_can_read_board_members" ON public.board_members;
DROP POLICY IF EXISTS "authenticated_can_select_board_memberships" ON public.board_members;
DROP POLICY IF EXISTS "Members can select board memberships" ON public.board_members;
DROP POLICY IF EXISTS "Users can view their memberships" ON public.board_members;
DROP POLICY IF EXISTS "Service and authenticated users can insert" ON public.board_members;
DROP POLICY IF EXISTS "Owners can remove members from their boards" ON public.board_members;

REVOKE ALL ON public.board_members FROM anon, authenticated;
GRANT ALL ON public.board_members TO service_role;

CREATE POLICY "deny_all_access"
  ON public.board_members
  FOR ALL
  USING (false);

-- profilesテーブル: service_roleのみに制限
DROP POLICY IF EXISTS "authenticated_can_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_can_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE POLICY "deny_all_access"
  ON public.profiles
  FOR ALL
  USING (false);

COMMIT;

-- 注記:
-- - itemsテーブル: Realtime互換のRLSにallowed_user_idsを使用
-- - boards、board_members、profiles: Edge Functions経由でのみアクセス可能（service_role）
-- - トリガーはボードメンバー変更時にallowed_user_idsを自動的に維持
-- - 直接のPostgRESTアクセスは制限されており、すべてのアクセスはEdge Functions経由で行う必要がある
