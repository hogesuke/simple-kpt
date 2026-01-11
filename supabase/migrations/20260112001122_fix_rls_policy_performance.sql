-- RLSポリシーのパフォーマンス改善
-- auth.uid()を(select auth.uid())でラップして、行ごとの再評価を防ぐ

DROP POLICY IF EXISTS "users_can_read_allowed_items" ON public.items;

CREATE POLICY "users_can_read_allowed_items"
  ON public.items
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = ANY(allowed_user_ids));
