-- create_board_with_owner関数の戻り値にcreated_atとowner_idを追加
CREATE OR REPLACE FUNCTION create_board_with_owner(
  p_name text,
  p_user_id uuid
) RETURNS json AS $$
DECLARE
  v_board_id uuid;
  v_result json;
BEGIN
  -- トランザクション内でボードを作成
  INSERT INTO boards (name, owner_id)
  VALUES (p_name, p_user_id)
  RETURNING id INTO v_board_id;

  -- オーナーをboard_membersに追加
  INSERT INTO board_members (board_id, user_id, role)
  VALUES (v_board_id, p_user_id, 'owner');

  -- 作成したボード情報を返す
  SELECT json_build_object('id', id, 'name', name, 'owner_id', owner_id, 'created_at', created_at)
  INTO v_result
  FROM boards
  WHERE id = v_board_id;

  RETURN v_result;
EXCEPTION
  -- エラーが発生した場合、トランザクション全体がロールバックされる
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create board with owner: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
