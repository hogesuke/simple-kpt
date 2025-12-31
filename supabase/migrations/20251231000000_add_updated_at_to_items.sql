-- itemsテーブルにupdated_atカラムを追加
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 既存のレコードのupdated_atをcreated_atと同じ値に設定
UPDATE public.items
SET updated_at = created_at
WHERE updated_at = now();

-- updated_atを自動更新するための関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- itemsテーブルにトリガーを追加
DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- インデックスを追加
CREATE INDEX IF NOT EXISTS items_updated_at_idx ON public.items(updated_at);