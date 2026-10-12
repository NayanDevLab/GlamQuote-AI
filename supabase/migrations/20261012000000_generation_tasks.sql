-- One row per YouCam generation request. Written only by Edge Functions (secret key);
-- the mobile app never reads or writes this table directly.
-- No image bytes, image URLs or credentials are stored here.

create table public.generation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('nail_transfer')),
  -- Chosen by the app per Generate tap; a repeat of the same key never creates a second task.
  idempotency_key uuid not null,
  status text not null default 'creating'
    check (status in ('creating', 'running', 'success', 'error')),
  provider_task_id text,
  error_code text,
  provider_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

-- At most one in-flight task per guest: double taps and parallel requests cannot spend twice.
create unique index generation_tasks_one_active_per_user
  on public.generation_tasks (user_id)
  where status in ('creating', 'running');

create index generation_tasks_user_created_at
  on public.generation_tasks (user_id, created_at desc);

-- RLS on with no policies: publishable-key and user-JWT clients get no access at all.
alter table public.generation_tasks enable row level security;
