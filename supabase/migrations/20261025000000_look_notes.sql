-- Look Battle: an optional personal note, kept only when the user saves the look.
alter table public.saved_looks
  add column note text check (note is null or char_length(note) <= 280);
