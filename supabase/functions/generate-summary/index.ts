import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import Anthropic from 'npm:@anthropic-ai/sdk';
import { formatInTimeZone } from 'npm:date-fns-tz';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  getLanguage,
  isValidUUID,
  parseRequestBody,
  requireMethod,
} from '../_shared/helpers.ts';
import { getSummarySystemPrompt } from '../_shared/prompts.ts';

const DAILY_LIMIT = 5;
const MIN_ITEMS_REQUIRED = 3;

interface RequestBody {
  boardId: string;
}

interface KptItem {
  column_name: string;
  text: string;
}

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'POST');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const language = getLanguage(req);
  const client = createServiceClient();

  const body = await parseRequestBody<RequestBody>(req);
  const { boardId } = body;

  if (!boardId) {
    return generateErrorResponse('boardIdは必須です', 400);
  }

  if (!isValidUUID(boardId)) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // ボードの存在確認
  const { data: board, error: boardError } = await client.from('boards').select('id').eq('id', boardId).maybeSingle();

  if (boardError) {
    return generateErrorResponse('ボード情報の取得に失敗しました', 500);
  }

  if (!board) {
    return generateErrorResponse('ボードが見つかりません', 404);
  }

  // メンバーシップ確認
  const { data: member } = await client.from('board_members').select('id').eq('board_id', boardId).eq('user_id', user.id).maybeSingle();

  if (!member) {
    return generateErrorResponse('このボードのメンバーではありません', 403);
  }

  // レート制限チェック（今日の利用回数）
  const todayJST = formatInTimeZone(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  const todayIso = new Date(`${todayJST}T00:00:00+09:00`).toISOString();

  const { count, error: countError } = await client
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('feature', 'summary')
    .gte('created_at', todayIso);

  if (countError) {
    return generateErrorResponse('利用状況の確認に失敗しました', 500);
  }

  if ((count ?? 0) >= DAILY_LIMIT) {
    return generateErrorResponse(`1日の利用上限（${DAILY_LIMIT}回）に達しました。明日またお試しください。`, 429);
  }

  // アイテムの取得
  const { data: items, error: itemsError } = await client
    .from('items')
    .select('column_name, text')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (itemsError) {
    return generateErrorResponse('アイテムの取得に失敗しました', 500);
  }

  if (!items || items.length < MIN_ITEMS_REQUIRED) {
    return generateErrorResponse(
      `サマリーを生成するには${MIN_ITEMS_REQUIRED}個以上のアイテムが必要です。アイテムを追加してください。`,
      400
    );
  }

  const keepItems = items.filter((i: KptItem) => i.column_name === 'keep');
  const problemItems = items.filter((i: KptItem) => i.column_name === 'problem');
  const tryItems = items.filter((i: KptItem) => i.column_name === 'try');

  const formatItems = (itemList: KptItem[]) => (itemList.length > 0 ? itemList.map((i: KptItem) => `- ${i.text}`).join('\n') : '（なし）');

  const userMessage = `## Keep
${formatItems(keepItems)}

## Problem
${formatItems(problemItems)}

## Try
${formatItems(tryItems)}`;

  // Anthropic APIキーの確認
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    console.error('ANTHROPIC_API_KEY is not configured');
    return generateErrorResponse('AI機能が設定されていません', 500);
  }

  // Claude APIを呼び出し
  try {
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: getSummarySystemPrompt(language),
      messages: [{ role: 'user', content: userMessage }],
    });

    const summary = message.content[0].type === 'text' ? message.content[0].text : '';

    // 利用ログを記録
    const { error: logError } = await client.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'summary',
    });

    if (logError) {
      console.error('Failed to log AI usage:', logError);
      // ログの記録に失敗しても、サマリーは返す
    }

    const remainingCount = DAILY_LIMIT - (count ?? 0) - 1;

    return generateJsonResponse({
      summary,
      remainingCount,
    });
  } catch (error) {
    console.error('Anthropic API error:', error);
    return generateErrorResponse('サマリーの生成に失敗しました。しばらく経ってからお試しください。', 500);
  }
});
