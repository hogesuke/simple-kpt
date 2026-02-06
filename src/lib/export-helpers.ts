import { getStatusLabels } from '@/types/kpt';

import type { KptColumnType, KptItem } from '@/types/kpt';

/**
 * カラム名のラベル定義
 */
const COLUMN_LABELS: Record<KptColumnType, string> = {
  keep: 'Keep',
  problem: 'Problem',
  try: 'Try',
};

/**
 * アイテムをカラム順（Keep, Problem, Try）とposition順でソートする
 */
function sortItems(items: KptItem[]): KptItem[] {
  const columnOrder: Record<KptColumnType, number> = { keep: 0, problem: 1, try: 2 };
  return [...items].sort((a, b) => {
    const columnDiff = columnOrder[a.column] - columnOrder[b.column];
    if (columnDiff !== 0) return columnDiff;
    return a.position - b.position;
  });
}

/**
 * 日時を読みやすい形式にフォーマットする
 */
function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 日付を読みやすい形式にフォーマットする
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Markdownテーブルのセルをエスケープする
 */
function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Markdown形式（テーブル）でエクスポートデータを生成する
 */
export function generateMarkdown(boardName: string, items: KptItem[]): string {
  const lines: string[] = [];

  lines.push(`# ${boardName}`);
  lines.push('');

  // テーブルヘッダー
  lines.push('| カラム | テキスト | 作成者 | 作成日時 | 更新日時 | 投票数 | ステータス | 担当者 | 期日 |');
  lines.push('|--------|----------|--------|----------|----------|--------|------------|--------|------|');

  for (const item of sortItems(items)) {
    const row = [
      COLUMN_LABELS[item.column],
      escapeMarkdownCell(item.text),
      item.authorNickname ?? '',
      formatDateTime(item.createdAt),
      formatDateTime(item.updatedAt),
      String(item.voteCount ?? 0),
      item.status ? getStatusLabels()[item.status] : '',
      item.assigneeNickname ?? '',
      formatDate(item.dueDate),
    ];
    lines.push(`| ${row.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * CSVのフィールドをエスケープする
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * CSV形式でエクスポートデータを生成する
 */
export function generateCSV(items: KptItem[]): string {
  const headers = ['カラム', 'テキスト', '作成者', '作成日時', '更新日時', '投票数', 'ステータス', '担当者', '期日'];
  const lines: string[] = [];

  lines.push(headers.join(','));

  for (const item of sortItems(items)) {
    const row = [
      COLUMN_LABELS[item.column],
      escapeCsvField(item.text),
      item.authorNickname ?? '',
      formatDateTime(item.createdAt),
      formatDateTime(item.updatedAt),
      String(item.voteCount ?? 0),
      item.status ? getStatusLabels()[item.status] : '',
      item.assigneeNickname ?? '',
      formatDate(item.dueDate),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * ファイルをダウンロードする
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * クリップボードにコピーする
 */
export async function copyToClipboard(content: string): Promise<void> {
  await navigator.clipboard.writeText(content);
}
