import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { MAX_MEMBERS_PER_BOARD } from '../../../shared/constants.ts';
import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  isValidUUID,
  parseRequestBody,
  PG_ERROR_CODE,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'POST');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const { boardId } = await parseRequestBody<{ boardId?: string }>(req);

  if (!boardId) {
    return generateErrorResponse('boardIdは必須です', 400);
  }

  if (!isValidUUID(boardId)) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // ボードが存在するか確認
  const { data: board, error: boardError } = await client.from('boards').select('id').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse('ボード情報の取得に失敗しました', 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // すでにメンバーかチェック
  const { data: existingMember, error: memberCheckError } = await client
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberCheckError) {
    return generateErrorResponse('ボードへの参加に失敗しました', 500);
  }

  if (existingMember) {
    return generateJsonResponse({ success: true, alreadyMember: true });
  }

  // ボードのメンバー数をチェック
  const { count, error: countError } = await client
    .from('board_members')
    .select('*', { count: 'exact', head: true })
    .eq('board_id', boardId);

  if (countError) {
    return generateErrorResponse('ボードへの参加に失敗しました', 500);
  }

  if (count !== null && count >= MAX_MEMBERS_PER_BOARD) {
    return generateErrorResponse(`ボードのメンバー数が上限(${MAX_MEMBERS_PER_BOARD}人)に達しているため、ボードに参加できませんでした`, 400);
  }

  // メンバーとして追加
  const { error: insertError } = await client.from('board_members').insert({ board_id: boardId, user_id: user.id, role: 'member' });

  if (insertError) {
    // 重複キーエラーの場合は既にメンバーとして扱う（レースコンディション対策）
    if (insertError.code === PG_ERROR_CODE.UNIQUE_VIOLATION) {
      return generateJsonResponse({ success: true, alreadyMember: true });
    }
    return generateErrorResponse('ボードへの参加に失敗しました', 500);
  }

  return generateJsonResponse({ success: true, alreadyMember: false });
});
