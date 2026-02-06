import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import Anthropic from 'npm:@anthropic-ai/sdk';

import { generateErrorResponse, generateJsonResponse, getLanguage, handleCorsPreflightIfNeeded } from '../_shared/helpers.ts';
import { getSummarySystemPrompt } from '../_shared/prompts.ts';

const MIN_ITEMS_REQUIRED = 3;

interface KptItem {
  column: string;
  text: string;
}

interface RequestBody {
  items: KptItem[];
}

Deno.serve(async (req) => {
  // CORSプリフライトの処理
  const corsResponse = handleCorsPreflightIfNeeded(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return generateErrorResponse('Method Not Allowed', 405);
  }

  const language = getLanguage(req);

  // リクエストボディをパース
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return generateErrorResponse('Invalid request body', 400);
  }

  const { items } = body;

  if (!items || !Array.isArray(items)) {
    return generateErrorResponse('itemsは必須です', 400);
  }

  if (items.length < MIN_ITEMS_REQUIRED) {
    return generateErrorResponse(
      `サマリーを生成するには${MIN_ITEMS_REQUIRED}個以上のアイテムが必要です。アイテムを追加してください。`,
      400
    );
  }

  // KPTアイテムをフォーマット
  const keepItems = items.filter((i) => i.column === 'keep');
  const problemItems = items.filter((i) => i.column === 'problem');
  const tryItems = items.filter((i) => i.column === 'try');

  const formatItems = (itemList: KptItem[]) => (itemList.length > 0 ? itemList.map((i) => `- ${i.text}`).join('\n') : '（なし）');

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

    return generateJsonResponse({ summary });
  } catch (error) {
    console.error('Anthropic API error:', error);
    return generateErrorResponse('サマリーの生成に失敗しました。しばらく経ってからお試しください。', 500);
  }
});
