-- style_insights now serves both text-only AI features; each keeps its own daily cap and cache.
alter table public.style_insights
  add column feature text not null default 'decision' check (feature in ('decision', 'look_finder'));
