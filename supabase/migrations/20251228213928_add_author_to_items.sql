ALTER TABLE public.items ADD COLUMN author_id UUID;

UPDATE public.items
SET author_id = (
  SELECT owner_id
  FROM public.boards
  WHERE boards.id = items.board_id
);

ALTER TABLE public.items
  ADD CONSTRAINT items_author_id_users_fkey
  FOREIGN KEY (author_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.items
  ADD CONSTRAINT items_author_id_profiles_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.items.author_id IS 'アイテムを作成したユーザーのID';

CREATE INDEX IF NOT EXISTS items_author_id_idx ON public.items(author_id);
