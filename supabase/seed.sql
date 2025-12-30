-- ============================================================
-- テストユーザーの作成
-- ============================================================

-- テストユーザー1: test1@example.com (パスワード: password)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test1@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

-- テストユーザー2: test2@example.com (パスワード: password)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test2@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

-- ============================================================
-- プロフィールの作成
-- ============================================================

INSERT INTO public.profiles (id, nickname, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'テストユーザー1', now(), now()),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'テストユーザー2', now(), now());

-- ============================================================
-- テストボードの作成
-- ============================================================

INSERT INTO public.boards (id, name, owner_id, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '開発テストボード', '11111111-1111-1111-1111-111111111111'::uuid, now());

-- ============================================================
-- ボードメンバーシップの作成
-- ============================================================

INSERT INTO public.board_members (board_id, user_id, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, now());

-- ============================================================
-- テストアイテムの作成
-- ============================================================

INSERT INTO public.items (id, board_id, column_name, text, author_id, created_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'keep', 'チームワークが良い', '11111111-1111-1111-1111-111111111111'::uuid, now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'problem', 'コミュニケーション不足', '22222222-2222-2222-2222-222222222222'::uuid, now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'try', '定期的なミーティングを開催する', '11111111-1111-1111-1111-111111111111'::uuid, now());
