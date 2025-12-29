-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view boards they own" ON public.boards;
DROP POLICY IF EXISTS "Users can create boards" ON public.boards;
DROP POLICY IF EXISTS "Owners can update their boards" ON public.boards;
DROP POLICY IF EXISTS "Owners can delete their boards" ON public.boards;

DROP POLICY IF EXISTS "Board owners can view items" ON public.items;
DROP POLICY IF EXISTS "Board owners can create items" ON public.items;
DROP POLICY IF EXISTS "Board owners can update items" ON public.items;
DROP POLICY IF EXISTS "Board owners can delete items" ON public.items;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- anon/authenticated roleからの全権限を剥奪
REVOKE ALL ON public.boards FROM anon, authenticated;
REVOKE ALL ON public.items FROM anon, authenticated;
REVOKE ALL ON public.profiles FROM anon, authenticated;

-- service_roleのみ全権限を付与（Edge Functionsで使用）
GRANT ALL ON public.boards TO service_role;
GRANT ALL ON public.items TO service_role;
GRANT ALL ON public.profiles TO service_role;

-- 念のため、RLSを有効化（多層的に防御するため）
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 念のため、すべてのアクセスを拒否するポリシーを設定（service_roleはRLSをバイパスするため、これらのポリシーは影響しない）
CREATE POLICY "deny_all_access" ON public.boards FOR ALL USING (false);
CREATE POLICY "deny_all_access" ON public.items FOR ALL USING (false);
CREATE POLICY "deny_all_access" ON public.profiles FOR ALL USING (false);
