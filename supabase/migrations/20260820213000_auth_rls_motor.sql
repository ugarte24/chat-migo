-- Perfil automático al registrarse, RLS por usuario y última ejecución de automatizaciones.

create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'administrador'
  );
$$;

create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, correo, rol)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nombre'), ''),
      split_part(coalesce(new.email, 'usuario'), '@', 1),
      'Usuario'
    ),
    new.email,
    'usuario'
  )
  on conflict (id) do update
    set correo = excluded.correo;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.manejar_nuevo_usuario();

create or replace function public.proteger_rol_perfil()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and new.rol is distinct from old.rol
     and not public.es_administrador() then
    new.rol := old.rol;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_rol_perfil on public.perfiles;
create trigger proteger_rol_perfil
  before update on public.perfiles
  for each row execute procedure public.proteger_rol_perfil();

alter table public.automatizaciones
  add column if not exists ultima_ejecucion date;

drop policy if exists dilo_perfiles_anon on public.perfiles;
drop policy if exists dilo_tareas_anon on public.tareas;
drop policy if exists dilo_recordatorios_anon on public.recordatorios;
drop policy if exists dilo_eventos_anon on public.eventos;
drop policy if exists dilo_memoria_anon on public.memoria;
drop policy if exists dilo_automatizaciones_anon on public.automatizaciones;
drop policy if exists dilo_historial_anon on public.historial;
drop policy if exists dilo_conversaciones_anon on public.conversaciones;

drop policy if exists perfiles_select on public.perfiles;
drop policy if exists perfiles_insert on public.perfiles;
drop policy if exists perfiles_update on public.perfiles;
drop policy if exists tareas_select on public.tareas;
drop policy if exists tareas_insert on public.tareas;
drop policy if exists tareas_update on public.tareas;
drop policy if exists tareas_delete on public.tareas;
drop policy if exists recordatorios_select on public.recordatorios;
drop policy if exists recordatorios_insert on public.recordatorios;
drop policy if exists recordatorios_update on public.recordatorios;
drop policy if exists recordatorios_delete on public.recordatorios;
drop policy if exists eventos_select on public.eventos;
drop policy if exists eventos_insert on public.eventos;
drop policy if exists eventos_update on public.eventos;
drop policy if exists eventos_delete on public.eventos;
drop policy if exists memoria_propia on public.memoria;
drop policy if exists automatizaciones_select on public.automatizaciones;
drop policy if exists automatizaciones_insert on public.automatizaciones;
drop policy if exists automatizaciones_update on public.automatizaciones;
drop policy if exists automatizaciones_delete on public.automatizaciones;
drop policy if exists historial_select on public.historial;
drop policy if exists historial_insert on public.historial;
drop policy if exists historial_update on public.historial;
drop policy if exists historial_delete on public.historial;
drop policy if exists conversaciones_select on public.conversaciones;
drop policy if exists conversaciones_insert on public.conversaciones;
drop policy if exists conversaciones_update on public.conversaciones;
drop policy if exists conversaciones_delete on public.conversaciones;

create policy perfiles_select on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.es_administrador());

create policy perfiles_insert on public.perfiles
  for insert to authenticated
  with check (id = auth.uid());

create policy perfiles_update on public.perfiles
  for update to authenticated
  using (id = auth.uid() or public.es_administrador())
  with check (id = auth.uid() or public.es_administrador());

create policy tareas_select on public.tareas
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_administrador());
create policy tareas_insert on public.tareas
  for insert to authenticated with check (usuario_id = auth.uid());
create policy tareas_update on public.tareas
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy tareas_delete on public.tareas
  for delete to authenticated using (usuario_id = auth.uid());

create policy recordatorios_select on public.recordatorios
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_administrador());
create policy recordatorios_insert on public.recordatorios
  for insert to authenticated with check (usuario_id = auth.uid());
create policy recordatorios_update on public.recordatorios
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy recordatorios_delete on public.recordatorios
  for delete to authenticated using (usuario_id = auth.uid());

create policy eventos_select on public.eventos
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_administrador());
create policy eventos_insert on public.eventos
  for insert to authenticated with check (usuario_id = auth.uid());
create policy eventos_update on public.eventos
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy eventos_delete on public.eventos
  for delete to authenticated using (usuario_id = auth.uid());

create policy memoria_propia on public.memoria
  for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create policy automatizaciones_select on public.automatizaciones
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_administrador());
create policy automatizaciones_insert on public.automatizaciones
  for insert to authenticated with check (usuario_id = auth.uid());
create policy automatizaciones_update on public.automatizaciones
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy automatizaciones_delete on public.automatizaciones
  for delete to authenticated using (usuario_id = auth.uid());

create policy historial_select on public.historial
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_administrador());
create policy historial_insert on public.historial
  for insert to authenticated with check (usuario_id = auth.uid());
create policy historial_update on public.historial
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy historial_delete on public.historial
  for delete to authenticated using (usuario_id = auth.uid());

create policy conversaciones_select on public.conversaciones
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_administrador());
create policy conversaciones_insert on public.conversaciones
  for insert to authenticated with check (usuario_id = auth.uid());
create policy conversaciones_update on public.conversaciones
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy conversaciones_delete on public.conversaciones
  for delete to authenticated using (usuario_id = auth.uid());

grant execute on function public.es_administrador() to authenticated;
grant execute on function public.manejar_nuevo_usuario() to supabase_auth_admin;
