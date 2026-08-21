alter table public.perfiles
  add column if not exists correo text,
  add column if not exists rol text not null default 'usuario';

alter table public.perfiles drop constraint if exists perfiles_rol_chk;
alter table public.perfiles
  add constraint perfiles_rol_chk check (rol in ('usuario', 'administrador'));

create unique index if not exists perfiles_correo_unico
  on public.perfiles (correo)
  where correo is not null;
