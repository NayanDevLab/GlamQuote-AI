-- Saved looks (My Lookbook). Written only by the `lookbook` Edge Function after an explicit Save.
-- The image itself lives in Cloudinary as an `authenticated` (private) asset; only its id is here.

-- SHA-256 of the hand photo, recorded when a task is created. Two previews with the same hash
-- came from the same original photo, which is what Compare Looks requires. The photo itself is
-- not stored by GlamQuote.
alter table public.generation_tasks add column source_photo_hash text;

create table public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- One saved look per generated preview: saving twice can never create a duplicate.
  task_id uuid not null unique references public.generation_tasks (id),
  kind text not null check (kind in ('nail_transfer')),
  title text not null check (char_length(title) between 1 and 80),
  design_source text not null check (design_source in ('reference', 'catalogue')),
  design_id text,
  source_photo_hash text,
  image_public_id text not null,
  image_format text not null,
  image_width integer,
  image_height integer,
  created_at timestamptz not null default now()
);

create index saved_looks_user_created_at on public.saved_looks (user_id, created_at desc);

-- RLS on with no policies: no direct client access; the Edge Function filters by user id.
alter table public.saved_looks enable row level security;
