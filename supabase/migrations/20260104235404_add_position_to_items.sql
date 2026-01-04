-- itemsテーブルにpositionカラムを追加
-- カード順序のリアルタイム同期を可能にする

BEGIN;

-- positionカラムを追加（浮動小数点方式）
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION;

-- 既存データの初期化: 各ボード・カラムごとにcreated_at順でpositionを設定
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY board_id, column_name
      ORDER BY created_at ASC
    ) * 1000.0 AS new_position
  FROM public.items
)
UPDATE public.items
SET position = ranked.new_position
FROM ranked
WHERE public.items.id = ranked.id;

-- デフォルト値を設定（新規作成時は0、トリガーで適切な値に更新）
ALTER TABLE public.items
ALTER COLUMN position SET DEFAULT 0;

-- NOT NULL制約を追加
ALTER TABLE public.items
ALTER COLUMN position SET NOT NULL;

-- positionでのソートを高速化するためのインデックス
CREATE INDEX IF NOT EXISTS idx_items_board_column_position
ON public.items (board_id, column_name, position);

COMMIT;
