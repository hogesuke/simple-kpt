-- 関数のsearch_pathを固定してセキュリティを強化
-- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- 1. handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- 2. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- 3. set_item_allowed_users_on_insert
CREATE OR REPLACE FUNCTION public.set_item_allowed_users_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.allowed_user_ids := (
    SELECT COALESCE(array_agg(user_id), '{}')
    FROM public.board_members
    WHERE board_id = NEW.board_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 4. sync_item_allowed_users_optimized
CREATE OR REPLACE FUNCTION public.sync_item_allowed_users_optimized()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.items
    SET allowed_user_ids = array_append(
      COALESCE(allowed_user_ids, '{}'),
      NEW.user_id
    )
    WHERE board_id = NEW.board_id
    AND NOT (NEW.user_id = ANY(COALESCE(allowed_user_ids, '{}')));

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.items
    SET allowed_user_ids = array_remove(allowed_user_ids, OLD.user_id)
    WHERE board_id = OLD.board_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 5. create_board_with_owner
CREATE OR REPLACE FUNCTION public.create_board_with_owner(
  p_name text,
  p_user_id uuid
) RETURNS json AS $$
DECLARE
  v_board_id uuid;
  v_result json;
BEGIN
  INSERT INTO public.boards (name, owner_id)
  VALUES (p_name, p_user_id)
  RETURNING id INTO v_board_id;

  INSERT INTO public.board_members (board_id, user_id, role)
  VALUES (v_board_id, p_user_id, 'owner');

  SELECT json_build_object('id', id, 'name', name, 'owner_id', owner_id, 'created_at', created_at)
  INTO v_result
  FROM public.boards
  WHERE id = v_board_id;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create board with owner: %', SQLERRM;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
