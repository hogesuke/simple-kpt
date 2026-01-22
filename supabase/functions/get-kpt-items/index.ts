import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  getQueryParam,
  isValidUUID,
  requireMethod,
} from '../_shared/helpers.ts';

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'GET');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  const boardId = getQueryParam(req, 'boardId');

  if (!boardId) {
    return generateErrorResponse('boardIdは必須です', 400);
  }

  if (!isValidUUID(boardId)) {
    return generateErrorResponse('ボードが見つかりません', 404);
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

  // メンバーでない場合は空配列を返す
  if (!member) {
    return generateJsonResponse([]);
  }

  const { data, error } = await client
    .from('items')
    .select(
      `
      id,
      board_id,
      column_name,
      text,
      position,
      created_at,
      updated_at,
      author_id,
      status,
      assignee_id,
      due_date,
      profiles!items_author_id_profiles_fkey (
        nickname
      ),
      assignee:profiles!items_assignee_id_fkey (
        nickname
      ),
      item_votes (
        user_id
      )
    `
    )
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) {
    return generateErrorResponse('アイテムの取得に失敗しました', 500);
  }

  // 投票者のuser_idを収集
  const voterUserIds = new Set<string>();
  for (const item of data ?? []) {
    for (const vote of item.item_votes ?? []) {
      voterUserIds.add(vote.user_id);
    }
  }

  // 投票者のプロフィールを取得
  const voterProfiles: Record<string, string | null> = {};
  if (voterUserIds.size > 0) {
    const { data: profiles } = await client
      .from('profiles')
      .select('id, nickname')
      .in('id', Array.from(voterUserIds));

    for (const profile of profiles ?? []) {
      voterProfiles[profile.id] = profile.nickname;
    }
  }

  // ニックネーム情報をフラットな構造に変換, 投票情報を追加
  const items = (data ?? []).map((item: any) => {
    const votes = item.item_votes ?? [];
    return {
      id: item.id,
      board_id: item.board_id,
      column_name: item.column_name,
      text: item.text,
      position: item.position,
      created_at: item.created_at,
      updated_at: item.updated_at,
      author_id: item.author_id,
      author_nickname: item.profiles?.nickname ?? null,
      status: item.status,
      assignee_id: item.assignee_id,
      assignee_nickname: item.assignee?.nickname ?? null,
      due_date: item.due_date,
      vote_count: votes.length,
      has_voted: votes.some((v: { user_id: string }) => v.user_id === user.id),
      voters: votes.map((v: { user_id: string }) => ({
        id: v.user_id,
        nickname: voterProfiles[v.user_id] ?? null,
      })),
    };
  });

  return generateJsonResponse(items);
});
