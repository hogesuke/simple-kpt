import { TFunction } from 'i18next';

import { getStatusLabels } from '@/types/kpt';

import type { KptColumnType, KptItem } from '@/types/kpt';

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
 * カラム名のラベルを取得する
 */
function getColumnLabels(t: TFunction): Record<KptColumnType, string> {
  return {
    keep: t('board:Keep'),
    problem: t('board:Problem'),
    try: t('board:Try'),
  };
}

/**
 * エクスポート用ヘッダーを取得する
 */
function getExportHeaders(t: TFunction): string[] {
  return [
    t('board:カラム'),
    t('board:テキスト'),
    t('board:作成者'),
    t('board:作成日時'),
    t('board:更新日時'),
    t('board:投票数'),
    t('board:ステータス'),
    t('board:担当者'),
    t('board:期日'),
  ];
}

/**
 * Markdown形式（テーブル）でエクスポートデータを生成する
 */
export function generateMarkdown(boardName: string, items: KptItem[], t: TFunction): string {
  const lines: string[] = [];
  const columnLabels = getColumnLabels(t);
  const headers = getExportHeaders(t);

  lines.push(`# ${boardName}`);
  lines.push('');

  // テーブルヘッダー
  lines.push(`| ${headers.join(' | ')} |`);
  lines.push('|--------|----------|--------|----------|----------|--------|------------|--------|------|');

  for (const item of sortItems(items)) {
    const row = [
      columnLabels[item.column],
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
export function generateCSV(items: KptItem[], t: TFunction): string {
  const columnLabels = getColumnLabels(t);
  const headers = getExportHeaders(t);
  const lines: string[] = [];

  lines.push(headers.join(','));

  for (const item of sortItems(items)) {
    const row = [
      columnLabels[item.column],
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
