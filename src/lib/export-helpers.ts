import { TFunction } from 'i18next';

import { getStatusLabels } from '@/lib/kpt-helpers';

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
  return escapeMarkdownText(value).replace(/\|/g, '\\|');
}

/**
 * Markdownのテキストをエスケープする
 * 他の参加者が入力した文字列で、画像・リンク・HTMLとして解釈され、描画時に外部への通信が起きないようにする
 */
function escapeMarkdownText(value: string): string {
  return value.replace(/[\\`![\]<>]/g, '\\$&').replace(/\r?\n|\r/g, ' ');
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

  // ボード名は他の参加者も設定できるため、改行で見出しの外に文字列を差し込まれないようにする
  lines.push(`# ${escapeMarkdownText(boardName)}`);
  lines.push('');

  // テーブルヘッダー
  lines.push(`| ${headers.join(' | ')} |`);
  lines.push('|--------|----------|--------|----------|----------|--------|------------|--------|------|');

  for (const item of sortItems(items)) {
    const row = [
      columnLabels[item.column],
      item.text,
      item.authorNickname ?? '',
      formatDateTime(item.createdAt),
      formatDateTime(item.updatedAt),
      String(item.voteCount ?? 0),
      item.status ? getStatusLabels()[item.status] : '',
      item.assigneeNickname ?? '',
      formatDate(item.dueDate),
    ];
    // ニックネームなども他の参加者が自由に設定できるため、すべての列をエスケープする
    lines.push(`| ${row.map(escapeMarkdownCell).join(' | ')} |`);
  }

  return lines.join('\n');
}

/** 表計算ソフトで数式として解釈される先頭文字 */
const CSV_FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * CSVのフィールドをエスケープする
 * 表計算ソフトで開いた際に数式として実行されないよう、数式として解釈される文字で始まる値は先頭に'を付ける（CSVインジェクション対策）
 */
function escapeCsvField(value: string): string {
  const neutralized = CSV_FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix)) ? `'${value}` : value;
  if (neutralized.includes(',') || neutralized.includes('"') || neutralized.includes('\n') || neutralized.includes('\r')) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
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
      item.text,
      item.authorNickname ?? '',
      formatDateTime(item.createdAt),
      formatDateTime(item.updatedAt),
      String(item.voteCount ?? 0),
      item.status ? getStatusLabels()[item.status] : '',
      item.assigneeNickname ?? '',
      formatDate(item.dueDate),
    ];
    // ニックネームなども他の参加者が自由に設定できるため、すべての列をエスケープする
    lines.push(row.map(escapeCsvField).join(','));
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
