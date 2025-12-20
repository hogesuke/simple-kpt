create table public.boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.items
  add column board_id uuid;

alter table public.items
  alter column board_id set not null;

alter table public.items
  add constraint items_board_id_fkey
  foreign key (board_id) references public.boards(id)
  on delete cascade;