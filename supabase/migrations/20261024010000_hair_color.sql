-- Hair Color (YouCam AI Hair Color Virtual Try-On V1.0) joins as a fourth task kind.
-- effect_type is the mode ('full' or 'ombre'); config is the exact preset or pattern + palettes
-- the server validated and sent to YouCam, copied to the saved look on Save.

alter table public.generation_tasks drop constraint generation_tasks_kind_check;
alter table public.generation_tasks
  add constraint generation_tasks_kind_check
  check (kind in ('nail_transfer', 'nail_vto', 'hairstyle', 'hair_color'));

alter table public.saved_looks drop constraint saved_looks_kind_check;
alter table public.saved_looks
  add constraint saved_looks_kind_check
  check (kind in ('nail_transfer', 'nail_vto', 'hairstyle', 'hair_color'));
alter table public.saved_looks drop constraint saved_looks_design_source_check;
alter table public.saved_looks
  add constraint saved_looks_design_source_check
  check (design_source in ('reference', 'catalogue', 'custom', 'template', 'preset'));
