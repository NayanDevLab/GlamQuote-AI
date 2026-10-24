-- Nail Virtual Try-On (YouCam AI Nail VTO) joins Nail Transfer as a second task kind.
-- The validated customization is stored with the task, so a saved look's details always
-- come from what the server actually sent to YouCam, never from the client.

alter table public.generation_tasks drop constraint generation_tasks_kind_check;
alter table public.generation_tasks
  add constraint generation_tasks_kind_check check (kind in ('nail_transfer', 'nail_vto'));
alter table public.generation_tasks add column effect_type text;
alter table public.generation_tasks add column config jsonb;

alter table public.saved_looks drop constraint saved_looks_kind_check;
alter table public.saved_looks
  add constraint saved_looks_kind_check check (kind in ('nail_transfer', 'nail_vto'));
alter table public.saved_looks drop constraint saved_looks_design_source_check;
alter table public.saved_looks
  add constraint saved_looks_design_source_check
  check (design_source in ('reference', 'catalogue', 'custom'));
alter table public.saved_looks add column effect_type text;
alter table public.saved_looks add column config jsonb;
