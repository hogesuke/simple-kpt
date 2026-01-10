import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { ITEM_TEXT_MAX_LENGTH, MAX_ITEMS_PER_BOARD, VALID_COLUMNS } from '../../../shared/constants.ts';
import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  isValidUUID,
  parseRequestBody,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'POST');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { boardId, column, text } = await parseRequestBody<{
    boardId?: string;
    column?: string;
    text?: string;
  }>(req);

  if (!boardId || !column) {
    return generateErrorResponse('boardId, column は必須です', 400);
  }

  if (!isValidUUID(boardId)) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  if (!VALID_COLUMNS.includes(column as (typeof VALID_COLUMNS)[number])) {
    return generateErrorResponse('無効なカラムが指定されました', 400);
  }

  const trimmedText = text?.trim();
  if (!trimmedText) {
    return generateErrorResponse('text は必須です', 400);
  }

  if (trimmedText.length > ITEM_TEXT_MAX_LENGTH) {
    return generateErrorResponse(`テキストは${ITEM_TEXT_MAX_LENGTH}文字以内で入力してください`, 400);
  }

  // boardが存在するか確認
  const { data: board, error: boardError } = await client.from('boards').select('id').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse('ボード情報の取得に失敗しました', 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // ユーザーがboard_membersに含まれているかチェック
  const { data: member } = await client.from('board_members').select('id').eq('board_id', boardId).eq('user_id', user.id).maybeSingle();

  if (!member) {
    return generateErrorResponse('このボードへのアクセス権限がありません', 403);
  }

  // ボード内のアイテム数をチェック
  const { count, error: countError } = await client.from('items').select('*', { count: 'exact', head: true }).eq('board_id', boardId);

  if (countError) {
    return generateErrorResponse('アイテムの作成に失敗しました', 500);
  }

  if (count !== null && count >= MAX_ITEMS_PER_BOARD) {
    return generateErrorResponse(`アイテム数上限を超えました。1ボードあたり最大${MAX_ITEMS_PER_BOARD}個まで作成できます`, 400);
  }

  // 同じカラム内の最大positionを取得して、その後ろに配置する
  const { data: maxPositionData } = await client
    .from('items')
    .select('position')
    .eq('board_id', boardId)
    .eq('column_name', column)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const newPosition = (maxPositionData?.position ?? 0) + 1000;

  // Tryカラムの場合はデフォルトでstatusを'pending'にする
  const insertData: Record<string, unknown> = {
    board_id: boardId,
    column_name: column,
    text: trimmedText,
    author_id: user.id,
    position: newPosition,
  };

  if (column === 'try') {
    insertData.status = 'pending';
  }

  const { data, error } = await client
    .from('items')
    .insert(insertData)
    .select(
      `
      id,
      board_id,
      column_name,
      text,
      position,
      author_id,
      created_at,
      updated_at,
      status,
      assignee_id,
      due_date,
      profiles!items_author_id_profiles_fkey (
        nickname
      ),
      assignee:profiles!items_assignee_id_fkey (
        nickname
      )
    `
    )
    .maybeSingle();

  if (error || !data) {
    return generateErrorResponse('アイテムの作成に失敗しました', 500);
  }

  return generateJsonResponse({
    id: data.id,
    boardId: data.board_id,
    column: data.column_name,
    text: data.text,
    position: data.position,
    authorId: data.author_id,
    authorNickname: (data.profiles as any)?.nickname ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    status: data.status,
    assigneeId: data.assignee_id,
    assigneeNickname: (data.assignee as any)?.nickname ?? null,
    dueDate: data.due_date,
  });
});
