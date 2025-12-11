create table public.items (
  id uuid primary key default gen_random_uuid(),
  column_name text not null check (column_name in ('keep', 'problem', 'try')),
  text text not null,
  created_at timestamptz not null default now()
);
