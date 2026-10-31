-- Delete a saved look (P6A-7). A look is hidden first (pending_delete), then its private image and
-- row are removed; if the image can't be deleted yet, the row stays pending_delete so the deletion
-- can be retried and is never reported as finished early. Additive: existing looks become active.
alter table public.saved_looks
  add column if not exists status text not null default 'active'
  check (status in ('active', 'pending_delete'));

create index if not exists saved_looks_image_public_id_idx on public.saved_looks (image_public_id);
