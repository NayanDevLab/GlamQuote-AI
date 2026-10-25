-- Gemini Decision Assistant: one row per real Gemini call, for the per-guest daily cap and a
-- short-lived cache of validated replies. Only the validated reply text is kept — never the
-- prompt, the note, image data or URLs. The fingerprint is a hash of the looks, their
-- settings, the answers, the shared note, the question, the model and the prompt version.

create table public.style_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fingerprint text not null,
  status text not null check (status in ('ok', 'invalid', 'error')),
  response jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index style_insights_user_created_at on public.style_insights (user_id, created_at desc);
create index style_insights_user_fingerprint on public.style_insights (user_id, fingerprint);

-- RLS on with no policies: only the style-insight Edge Function (secret key) reads or writes.
alter table public.style_insights enable row level security;
