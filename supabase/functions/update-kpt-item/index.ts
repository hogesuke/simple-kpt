import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { ITEM_TEXT_MAX_LENGTH, VALID_COLUMNS, VALID_STATUSES } from '../../../shared/constants.ts';
import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  parseRequestBody,
  requireMethod,
} from '../_shared/helpers.ts';

type UpdateKptItemBody = {
  id?: string;
  boardId?: string;
  column?: string;
  text?: string;
  position?: number;
  status?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
};

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'PATCH');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { id, boardId, column, text, position, status, assigneeId, dueDate } = await parseRequestBody<UpdateKptItemBody>(req);

  if (!id || !boardId) {
    return generateErrorResponse('id, boardIdは必須です。', 400);
  }

  const trimmedText = text?.trim();
  if (trimmedText !== undefined) {
    if (trimmedText.length === 0) {
      return generateErrorResponse('text は空にできません', 400);
    }
    if (trimmedText.length > ITEM_TEXT_MAX_LENGTH) {
      return generateErrorResponse(`テキストは${ITEM_TEXT_MAX_LENGTH}文字以内で入力してください`, 400);
    }
  }

  if (column !== undefined && !VALID_COLUMNS.includes(column as (typeof VALID_COLUMNS)[number])) {
    return generateErrorResponse('無効なカラムが指定されました', 400);
  }

  if (status !== undefined && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return generateErrorResponse('無効なステータスが指定されました', 400);
  }

  // boardが存在するか確認
  const { data: board, error: boardError } = await client.from('boards').select('id').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse(boardError.message, 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // ユーザーがboard_membersに含まれているかチェック
  const { data: member } = await client.from('board_members').select('id').eq('board_id', boardId).eq('user_id', user.id).maybeSingle();

  if (!member) {
    return generateErrorResponse('このボードへのアクセス権限がありません', 403);
  }

  // undefinedのプロパティを除外する
  const omitUndefined = <T extends Record<string, unknown>>(obj: T) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

  const updates = omitUndefined({
    column_name: column,
    text: trimmedText,
    position: position,
    status: status,
    assignee_id: assigneeId,
    due_date: dueDate,
  });

  if (Object.keys(updates).length === 0) {
    return generateErrorResponse('更新内容が指定されていません。', 400);
  }

  const { data, error } = await client
    .from('items')
    .update(updates)
    .eq('id', id)
    .eq('board_id', boardId)
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
      assignee:profiles!items_assignee_id_fkey (
        nickname
      )
    `
    )
    .maybeSingle();

  if (error || !data) {
    return generateErrorResponse(error?.message ?? 'Unknown error', 500);
  }

  return generateJsonResponse({
    id: data.id,
    board_id: data.board_id,
    column_name: data.column_name,
    text: data.text,
    position: data.position,
    author_id: data.author_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    status: data.status,
    assignee_id: data.assignee_id,
    assignee_nickname: (data.assignee as any)?.nickname ?? null,
    due_date: data.due_date,
  });
});
