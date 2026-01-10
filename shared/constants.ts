/** アイテムのテキストの最大文字数 */
export const ITEM_TEXT_MAX_LENGTH = 140;

/** ボード名の最大文字数 */
export const BOARD_NAME_MAX_LENGTH = 50;

/** ニックネームの最大文字数 */
export const NICKNAME_MAX_LENGTH = 15;

/** 有効なカラム名 */
export const VALID_COLUMNS = ['keep', 'problem', 'try'] as const;

/** 有効なTryのステータス */
export const VALID_TRY_STATUSES = ['pending', 'in_progress', 'done', 'wont_fix'] as const;

/** ユーザーあたりのボード作成上限数 */
export const MAX_BOARDS_PER_USER = 100;

/** ボードあたりのアイテム上限数 */
export const MAX_ITEMS_PER_BOARD = 200;

/** ボードあたりのメンバー上限数 */
export const MAX_MEMBERS_PER_BOARD = 2;

/** 一覧の1ページあたりの表示件数 */
export const ITEMS_PER_PAGE = 20;
