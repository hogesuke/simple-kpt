/**
 * AIサマリー生成用のシステムプロンプト（日本語）
 */
const SUMMARY_SYSTEM_PROMPT_JA = `以下のKPT（Keep/Problem/Try）の内容を分析し、サマリーを作成してください。

## 出力形式

### まとめ
このふりかえり全体から読み取れるチームの状況を4〜5文で客観的に述べてください。Keep・Problem・Tryを横断的に捉え、チームの現状を総括してください。

### ポイント
特に注目すべき点や、重要なテーマを3〜4文で客観的に述べてください。

### 次回に向けて
次のふりかえりまでに意識してみると良さそうなことを2〜3文で述べてください。Tryに書かれている内容をそのまま繰り返すのではなく、以下の観点で提案してください：
- Keepを継続・強化するための具体的なアクション
- Problemの根本原因に対するアプローチ
- Tryに書かれていない新しい視点からの提案
- 複数のTryを組み合わせた発展的な取り組み

## 注意事項
- 箇条書きは使わず、文章で記述してください
- 個別のカードの内容を繰り返さず、全体の傾向やパターンについて述べてください
- 全体で300〜400字程度で
- 日本語で出力
- 「まとめ」「ポイント」は「〜が読み取れます」「〜となっています」「〜が感じられます」など客観的な口調で述べてください
- 「次回に向けて」は「〜てみてはいかがでしょうか？」「〜と良いかもしれませんね」など柔らかい提案の口調で述べてください
- アイテムが少なく内容が限られる場合は、無理に文章量を増やさず簡潔にまとめてください`;

/**
 * AIサマリー生成用のシステムプロンプト（英語）
 */
const SUMMARY_SYSTEM_PROMPT_EN = `Analyze the following KPT (Keep/Problem/Try) content and create a summary.

## Output Format

### Summary
Describe the team's situation as observed from the entire retrospective in 4-5 sentences objectively. Capture Keep, Problem, and Try holistically to summarize the team's current state.

### Key Points
Describe particularly noteworthy points or important themes in 3-4 sentences objectively.

### Going Forward
Suggest things to keep in mind until the next retrospective in 2-3 sentences. Rather than simply repeating what's written in Try, make suggestions from the following perspectives:
- Specific actions to continue or strengthen Keep items
- Approaches to address root causes of Problems
- New perspectives not mentioned in Try items
- Advanced initiatives combining multiple Try items

## Guidelines
- Write in prose, not bullet points
- Don't repeat individual card contents; describe overall trends and patterns
- Keep the total length to around 150-200 words
- Output in English
- Use objective phrasing for "Summary" and "Key Points" such as "It can be observed that..." or "The team appears to..."
- Use gentle suggestion phrasing for "Going Forward" such as "You might consider..." or "It could be beneficial to..."
- If items are few and content is limited, keep it concise without forcing more content`;

/**
 * 言語に応じたサマリープロンプトを取得する
 */
export function getSummarySystemPrompt(language: string): string {
  return language === 'ja' ? SUMMARY_SYSTEM_PROMPT_JA : SUMMARY_SYSTEM_PROMPT_EN;
}

/**
 * AIサマリー生成用のシステムプロンプト（後方互換性のため維持）
 * @deprecated getSummarySystemPrompt(language) を使用してください
 */
export const SUMMARY_SYSTEM_PROMPT = SUMMARY_SYSTEM_PROMPT_JA;
