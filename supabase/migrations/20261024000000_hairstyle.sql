-- Hair Studio (YouCam AI Hairstyle Virtual Try-On V2.1, preset templates) joins the nail
-- features as a third task kind. The chosen template is stored with the task in `config`,
-- so a saved look's details always come from what the server actually sent to YouCam.

alter table public.generation_tasks drop constraint generation_tasks_kind_check;
alter table public.generation_tasks
  add constraint generation_tasks_kind_check check (kind in ('nail_transfer', 'nail_vto', 'hairstyle'));

alter table public.saved_looks drop constraint saved_looks_kind_check;
alter table public.saved_looks
  add constraint saved_looks_kind_check check (kind in ('nail_transfer', 'nail_vto', 'hairstyle'));
alter table public.saved_looks drop constraint saved_looks_design_source_check;
alter table public.saved_looks
  add constraint saved_looks_design_source_check
  check (design_source in ('reference', 'catalogue', 'custom', 'template'));
