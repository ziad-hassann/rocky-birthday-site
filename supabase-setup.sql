create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text not null,
  image_url text not null,
  image_path text not null,
  created_at timestamptz not null default now()
);

alter table public.memories enable row level security;

drop policy if exists "Public memories are readable" on public.memories;
create policy "Public memories are readable"
on public.memories for select
to anon
using (true);

drop policy if exists "Public memories can be added" on public.memories;
create policy "Public memories can be added"
on public.memories for insert
to anon
with check (true);

drop policy if exists "Public memories can be deleted" on public.memories;
create policy "Public memories can be deleted"
on public.memories for delete
to anon
using (true);

insert into storage.buckets (id, name, public)
values ('rocky-memories', 'rocky-memories', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public memory images are readable" on storage.objects;
create policy "Public memory images are readable"
on storage.objects for select
to anon
using (bucket_id = 'rocky-memories');

drop policy if exists "Public memory images can be uploaded" on storage.objects;
create policy "Public memory images can be uploaded"
on storage.objects for insert
to anon
with check (bucket_id = 'rocky-memories');

drop policy if exists "Public memory images can be deleted" on storage.objects;
create policy "Public memory images can be deleted"
on storage.objects for delete
to anon
using (bucket_id = 'rocky-memories');
