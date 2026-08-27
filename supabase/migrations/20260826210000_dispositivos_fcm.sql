-- Tokens FCM de la cáscara Android. El servidor los usa para avisos con el teléfono cerrado.

create table if not exists public.dispositivos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  token text not null,
  plataforma text not null default 'android',
  created_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  constraint dispositivos_token_unico unique (token),
  constraint dispositivos_plataforma_chk check (plataforma in ('android'))
);

create index if not exists dispositivos_usuario_idx on public.dispositivos (usuario_id);

alter table public.dispositivos enable row level security;

drop policy if exists dispositivos_select on public.dispositivos;
drop policy if exists dispositivos_insert on public.dispositivos;
drop policy if exists dispositivos_update on public.dispositivos;
drop policy if exists dispositivos_delete on public.dispositivos;

create policy dispositivos_select on public.dispositivos
  for select to authenticated
  using (usuario_id = auth.uid());
create policy dispositivos_insert on public.dispositivos
  for insert to authenticated
  with check (usuario_id = auth.uid());
create policy dispositivos_update on public.dispositivos
  for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
create policy dispositivos_delete on public.dispositivos
  for delete to authenticated
  using (usuario_id = auth.uid());
