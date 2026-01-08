-- items.textに文字数制限を追加
ALTER TABLE items
ADD CONSTRAINT items_text_max_length CHECK (char_length(text) <= 140);

-- boards.nameに文字数制限を追加
ALTER TABLE boards
ADD CONSTRAINT boards_name_max_length CHECK (char_length(name) <= 50);

-- profiles.nicknameに文字数制限を追加
ALTER TABLE profiles
ADD CONSTRAINT profiles_nickname_max_length CHECK (char_length(nickname) <= 15);
