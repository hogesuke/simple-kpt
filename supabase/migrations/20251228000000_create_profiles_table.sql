CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'ユーザープロフィール情報';
COMMENT ON COLUMN public.profiles.id IS 'auth.users.idへの参照';
COMMENT ON COLUMN public.profiles.nickname IS 'ユーザーニックネーム（表示名）';

-- インデックスを作成
CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON public.profiles(nickname);

-- Row Level Securityを有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
-- すべてのユーザーがプロフィールを閲覧可能（他のユーザーのニックネーム表示のため）
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- ユーザーは自分のプロフィールのみ作成可能
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ削除可能
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- updated_atを自動更新する関数を作成
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at用のトリガーを作成
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
