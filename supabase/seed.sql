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

-- テストユーザー3: test3@example.com (パスワード: password)
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
  '33333333-3333-3333-3333-333333333333'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test3@example.com',
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

-- テストユーザー4: test4@example.com (パスワード: password)
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
  '44444444-4444-4444-4444-444444444444'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test4@example.com',
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

-- テストユーザー5: test5@example.com (パスワード: password)
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
  '55555555-5555-5555-5555-555555555555'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test5@example.com',
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

-- テストユーザー6: test6@example.com (パスワード: password)
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
  '66666666-6666-6666-6666-666666666666'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test6@example.com',
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

-- テストユーザー7: test7@example.com (パスワード: password)
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
  '77777777-7777-7777-7777-777777777777'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test7@example.com',
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

-- テストユーザー8: test8@example.com (パスワード: password)
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
  '88888888-8888-8888-8888-888888888888'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test8@example.com',
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

-- テストユーザー9: test9@example.com (パスワード: password)
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
  '99999999-9999-9999-9999-999999999999'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test9@example.com',
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

-- テストユーザー10: test10@example.com (パスワード: password)
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
  'aaaaaaaa-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test10@example.com',
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
  ('22222222-2222-2222-2222-222222222222'::uuid, 'テストユーザー2', now(), now()),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'テストユーザー3', now(), now()),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'テストユーザー4', now(), now()),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'テストユーザー5', now(), now()),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'テストユーザー6', now(), now()),
  ('77777777-7777-7777-7777-777777777777'::uuid, 'テストユーザー7', now(), now()),
  ('88888888-8888-8888-8888-888888888888'::uuid, 'テストユーザー8', now(), now()),
  ('99999999-9999-9999-9999-999999999999'::uuid, 'テストユーザー9', now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 'テストユーザー10', now(), now());

-- ============================================================
-- テストボードの作成
-- ============================================================

INSERT INTO public.boards (id, name, owner_id, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '開発テストボード', '11111111-1111-1111-1111-111111111111'::uuid, now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '10人メンバーボード', '11111111-1111-1111-1111-111111111111'::uuid, now()),
  ('e2e00000-0000-0000-0000-000000000000'::uuid, 'E2Eテスト専用ボード', '11111111-1111-1111-1111-111111111111'::uuid, now());

-- ============================================================
-- ボードメンバーシップの作成
-- ============================================================

INSERT INTO public.board_members (board_id, user_id, role, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'owner', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'member', now());

-- E2Eテスト専用ボード
INSERT INTO public.board_members (board_id, user_id, role, created_at) VALUES
  ('e2e00000-0000-0000-0000-000000000000'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'owner', now());

INSERT INTO public.board_members (board_id, user_id, role, created_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'owner', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'member', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'member', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'member', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'member', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 'member', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '77777777-7777-7777-7777-777777777777'::uuid, 'member', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '88888888-8888-8888-8888-888888888888'::uuid, 'member', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, '99999999-9999-9999-9999-999999999999'::uuid, 'member', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-aaaaaaaaaaaa'::uuid, 'aaaaaaaa-0000-0000-0000-000000000010'::uuid, 'member', now());

-- ============================================================
-- テストアイテムの作成
-- ============================================================

INSERT INTO public.items (id, board_id, column_name, text, position, author_id, created_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'keep', 'チームワークが良い', 1000, '11111111-1111-1111-1111-111111111111'::uuid, now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'problem', 'コミュニケーション不足', 1000, '22222222-2222-2222-2222-222222222222'::uuid, now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'try', '定期的なミーティングを開催する', 1000, '11111111-1111-1111-1111-111111111111'::uuid, now());

-- E2Eテスト専用ボードのアイテム（Keep/Problem）
INSERT INTO public.items (id, board_id, column_name, text, position, author_id, created_at) VALUES
  ('e2e00000-0000-0000-0002-000000000001'::uuid, 'e2e00000-0000-0000-0000-000000000000'::uuid, 'keep', 'E2E編集テスト用Keep', 1000, '11111111-1111-1111-1111-111111111111'::uuid, now()),
  ('e2e00000-0000-0000-0002-000000000002'::uuid, 'e2e00000-0000-0000-0000-000000000000'::uuid, 'problem', 'E2E編集テスト用Problem', 1000, '11111111-1111-1111-1111-111111111111'::uuid, now());

-- E2Eテスト専用ボードのTryアイテム（各テスト用に独立したアイテム）
INSERT INTO public.items (id, board_id, column_name, text, position, author_id, status, created_at) VALUES
  ('e2e00000-0000-0000-0001-000000000001'::uuid, 'e2e00000-0000-0000-0000-000000000000'::uuid, 'try', 'E2E未対応のTry', 1000, '11111111-1111-1111-1111-111111111111'::uuid, 'pending', now()),
  ('e2e00000-0000-0000-0001-000000000002'::uuid, 'e2e00000-0000-0000-0000-000000000000'::uuid, 'try', 'E2E対応中のTry', 2000, '11111111-1111-1111-1111-111111111111'::uuid, 'in_progress', now()),
  ('e2e00000-0000-0000-0001-000000000003'::uuid, 'e2e00000-0000-0000-0000-000000000000'::uuid, 'try', 'E2E完了のTry', 3000, '11111111-1111-1111-1111-111111111111'::uuid, 'done', now()),
  ('e2e00000-0000-0000-0001-000000000004'::uuid, 'e2e00000-0000-0000-0000-000000000000'::uuid, 'try', 'E2Eステータス変更用Try', 4000, '11111111-1111-1111-1111-111111111111'::uuid, 'pending', now()),
  ('e2e00000-0000-0000-0001-000000000005'::uuid, 'e2e00000-0000-0000-0000-000000000000'::uuid, 'try', 'E2E担当者変更用Try', 5000, '11111111-1111-1111-1111-111111111111'::uuid, 'pending', now()),
  ('e2e00000-0000-0000-0001-000000000006'::uuid, 'e2e00000-0000-0000-0000-000000000000'::uuid, 'try', 'E2E対応不要テスト用Try', 6000, '11111111-1111-1111-1111-111111111111'::uuid, 'pending', now());

-- ============================================================
-- ページネーションテスト用ユーザー（100ボード、100 Tryアイテム）
-- ============================================================

-- ページネーションテストユーザー1: pagination1@example.com (パスワード: password)
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
  'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'pagination1@example.com',
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

-- ページネーションテストユーザー2: pagination2@example.com (パスワード: password)
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
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'pagination2@example.com',
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

-- プロフィール
INSERT INTO public.profiles (id, nickname, created_at, updated_at) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 'ページネーションテスト1', now(), now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'ページネーションテスト2', now(), now());

-- 100件のボードを作成（generate_seriesを使用）
INSERT INTO public.boards (id, name, owner_id, created_at)
SELECT
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'テストボード ' || n,
  'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  now() - (n || ' minutes')::interval
FROM generate_series(1, 100) AS n;

-- 100件のボードメンバーシップを作成（pagination1がオーナー）
INSERT INTO public.board_members (board_id, user_id, role, created_at)
SELECT
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  'owner',
  now()
FROM generate_series(1, 100) AS n;

-- pagination2を全100ボードのメンバーとして追加
INSERT INTO public.board_members (board_id, user_id, role, created_at)
SELECT
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
  'member',
  now()
FROM generate_series(1, 100) AS n;

-- ============================================================
-- 統計グラフテスト用データ（最初のボードに追加）
-- ============================================================

-- Keepアイテム: 12週間にわたって20件（週によって件数が異なる）
INSERT INTO public.items (id, board_id, column_name, text, position, author_id, created_at, updated_at)
SELECT
  ('20000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'keep',
  'Keepアイテム ' || n,
  n * 1000,
  'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  now() - ((n * 4) || ' days')::interval,
  now() - ((n * 4) || ' days')::interval
FROM generate_series(1, 20) AS n;

-- Problemアイテム: 12週間にわたって15件
INSERT INTO public.items (id, board_id, column_name, text, position, author_id, created_at, updated_at)
SELECT
  ('30000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'problem',
  'Problemアイテム ' || n,
  n * 1000,
  'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  now() - ((n * 5) || ' days')::interval,
  now() - ((n * 5) || ' days')::interval
FROM generate_series(1, 15) AS n;

-- Tryアイテム: 12週間にわたって30件（約半分が完了済み）
INSERT INTO public.items (id, board_id, column_name, text, position, author_id, status, due_date, created_at, updated_at)
SELECT
  ('10000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'try',
  'Tryアイテム ' || n,
  n * 1000,
  'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  CASE
    WHEN n % 3 = 0 THEN 'done'
    WHEN n % 3 = 1 THEN 'pending'
    ELSE 'in_progress'
  END,
  CASE
    WHEN n % 4 = 0 THEN NULL
    ELSE (now() + (n || ' days')::interval)::date
  END,
  -- created_at: 週ごとに分散（古い順）
  now() - ((n * 3) || ' days')::interval,
  -- updated_at: doneの場合は作成から数日後に完了、それ以外は作成日と同じ
  CASE
    WHEN n % 3 = 0 THEN now() - ((n * 3 - 2) || ' days')::interval
    ELSE now() - ((n * 3) || ' days')::interval
  END
FROM generate_series(1, 30) AS n;

-- ============================================================
-- 英語表示用データ
-- ============================================================

-- 英語ユーザー1: alex@example.com (パスワード: password)
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
  'a1e10000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'alex@example.com',
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

-- 英語ユーザー2: jordan@example.com (パスワード: password)
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
  'a1e10000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'jordan@example.com',
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

-- 英語ユーザー3: sam@example.com (パスワード: password)
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
  'a1e10000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'sam@example.com',
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

-- 英語ユーザーのプロフィール
INSERT INTO public.profiles (id, nickname, created_at, updated_at) VALUES
  ('a1e10000-0000-0000-0000-000000000001'::uuid, 'Alex Chen', now(), now()),
  ('a1e10000-0000-0000-0000-000000000002'::uuid, 'Jordan Lee', now(), now()),
  ('a1e10000-0000-0000-0000-000000000003'::uuid, 'Sam Taylor', now(), now());

-- 英語スクリーンショット用ボード
INSERT INTO public.boards (id, name, owner_id, created_at) VALUES
  ('a1e10000-1111-0000-0000-000000000000'::uuid, 'Sprint 24 Retrospective', 'a1e10000-0000-0000-0000-000000000001'::uuid, now());

-- ボードメンバーシップ
INSERT INTO public.board_members (board_id, user_id, role, created_at) VALUES
  ('a1e10000-1111-0000-0000-000000000000'::uuid, 'a1e10000-0000-0000-0000-000000000001'::uuid, 'owner', now()),
  ('a1e10000-1111-0000-0000-000000000000'::uuid, 'a1e10000-0000-0000-0000-000000000002'::uuid, 'member', now()),
  ('a1e10000-1111-0000-0000-000000000000'::uuid, 'a1e10000-0000-0000-0000-000000000003'::uuid, 'member', now());

-- Keep アイテム
INSERT INTO public.items (id, board_id, column_name, text, position, author_id, created_at) VALUES
  ('a1e10000-2222-0001-0000-000000000001'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'keep', 'Pair programming sessions helped catch bugs early and spread domain knowledge across the team', 1000, 'a1e10000-0000-0000-0000-000000000001'::uuid, now()),
  ('a1e10000-2222-0001-0000-000000000002'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'keep', 'Moving to trunk-based development reduced merge conflicts significantly', 2000, 'a1e10000-0000-0000-0000-000000000002'::uuid, now()),
  ('a1e10000-2222-0001-0000-000000000003'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'keep', 'Daily async standups in Slack worked well for our distributed team', 3000, 'a1e10000-0000-0000-0000-000000000003'::uuid, now()),
  ('a1e10000-2222-0001-0000-000000000004'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'keep', 'Feature flags allowed us to deploy incomplete features safely to production', 4000, 'a1e10000-0000-0000-0000-000000000001'::uuid, now());

-- Problem アイテム
INSERT INTO public.items (id, board_id, column_name, text, position, author_id, created_at) VALUES
  ('a1e10000-2222-0002-0000-000000000001'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'problem', 'CI pipeline takes 45+ minutes, blocking rapid iteration and code reviews', 1000, 'a1e10000-0000-0000-0000-000000000002'::uuid, now()),
  ('a1e10000-2222-0002-0000-000000000002'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'problem', 'Flaky E2E tests causing false failures and eroding trust in the test suite', 2000, 'a1e10000-0000-0000-0000-000000000001'::uuid, now()),
  ('a1e10000-2222-0002-0000-000000000003'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'problem', 'Technical debt in the authentication module making new features risky to implement', 3000, 'a1e10000-0000-0000-0000-000000000003'::uuid, now()),
  ('a1e10000-2222-0002-0000-000000000004'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'problem', 'Unclear ownership of shared components leading to inconsistent patterns', 4000, 'a1e10000-0000-0000-0000-000000000002'::uuid, now());

-- Try アイテム（様々なステータス）
INSERT INTO public.items (id, board_id, column_name, text, position, author_id, status, assignee_id, due_date, created_at) VALUES
  ('a1e10000-2222-0003-0000-000000000001'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'try', 'Set up test parallelization to reduce CI time to under 15 minutes', 1000, 'a1e10000-0000-0000-0000-000000000001'::uuid, 'in_progress', 'a1e10000-0000-0000-0000-000000000002'::uuid, (now() + interval '5 days')::date, now()),
  ('a1e10000-2222-0003-0000-000000000002'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'try', 'Implement retry logic for flaky tests and add test stability dashboard', 2000, 'a1e10000-0000-0000-0000-000000000002'::uuid, 'pending', 'a1e10000-0000-0000-0000-000000000001'::uuid, (now() + interval '7 days')::date, now()),
  ('a1e10000-2222-0003-0000-000000000003'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'try', 'Schedule 2-hour weekly refactoring sessions for auth module cleanup', 3000, 'a1e10000-0000-0000-0000-000000000003'::uuid, 'done', 'a1e10000-0000-0000-0000-000000000003'::uuid, NULL, now()),
  ('a1e10000-2222-0003-0000-000000000004'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'try', 'Create CODEOWNERS file and document component ownership in wiki', 4000, 'a1e10000-0000-0000-0000-000000000001'::uuid, 'pending', NULL, NULL, now()),
  ('a1e10000-2222-0003-0000-000000000005'::uuid, 'a1e10000-1111-0000-0000-000000000000'::uuid, 'try', 'Adopt conventional commits to improve changelog generation', 5000, 'a1e10000-0000-0000-0000-000000000002'::uuid, 'done', 'a1e10000-0000-0000-0000-000000000002'::uuid, NULL, now());

-- 投票データ（一部のアイテムに投票）
INSERT INTO public.item_votes (item_id, user_id, created_at) VALUES
  ('a1e10000-2222-0001-0000-000000000001'::uuid, 'a1e10000-0000-0000-0000-000000000001'::uuid, now()),
  ('a1e10000-2222-0001-0000-000000000001'::uuid, 'a1e10000-0000-0000-0000-000000000002'::uuid, now()),
  ('a1e10000-2222-0001-0000-000000000001'::uuid, 'a1e10000-0000-0000-0000-000000000003'::uuid, now()),
  ('a1e10000-2222-0001-0000-000000000002'::uuid, 'a1e10000-0000-0000-0000-000000000001'::uuid, now()),
  ('a1e10000-2222-0001-0000-000000000002'::uuid, 'a1e10000-0000-0000-0000-000000000003'::uuid, now()),
  ('a1e10000-2222-0002-0000-000000000001'::uuid, 'a1e10000-0000-0000-0000-000000000001'::uuid, now()),
  ('a1e10000-2222-0002-0000-000000000001'::uuid, 'a1e10000-0000-0000-0000-000000000002'::uuid, now()),
  ('a1e10000-2222-0002-0000-000000000001'::uuid, 'a1e10000-0000-0000-0000-000000000003'::uuid, now()),
  ('a1e10000-2222-0002-0000-000000000002'::uuid, 'a1e10000-0000-0000-0000-000000000002'::uuid, now()),
  ('a1e10000-2222-0003-0000-000000000001'::uuid, 'a1e10000-0000-0000-0000-000000000001'::uuid, now()),
  ('a1e10000-2222-0003-0000-000000000001'::uuid, 'a1e10000-0000-0000-0000-000000000002'::uuid, now());
