-- Esquema inicial de Dilo. Un perfil demo hasta que exista auth por WhatsApp.

create table public.perfiles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  numero text,
  configuracion jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  titulo text not null,
  descripcion text not null default '',
  fecha date,
  prioridad text not null default 'media',
  estado text not null default 'pendiente',
  origen text not null default 'panel',
  created_at timestamptz not null default now(),
  constraint tareas_prioridad_chk check (prioridad in ('alta', 'media', 'baja')),
  constraint tareas_estado_chk check (estado in ('pendiente', 'en progreso', 'completada')),
  constraint tareas_origen_chk check (origen in ('chat', 'panel'))
);

create table public.recordatorios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  actividad text not null,
  fecha date not null,
  hora time not null,
  estado text not null default 'pendiente',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recordatorios_estado_chk check (estado in ('pendiente', 'completado', 'cancelado'))
);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  titulo text not null,
  descripcion text not null default '',
  persona text,
  lugar text not null default '',
  fecha date not null,
  hora time not null,
  estado text not null default 'pendiente',
  created_at timestamptz not null default now(),
  constraint eventos_estado_chk check (estado in ('pendiente', 'completado', 'cancelado'))
);

create table public.memoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  informacion text not null,
  categoria text not null,
  fecha date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.automatizaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  nombre text not null,
  accion text not null,
  cuando text not null,
  frecuencia text not null,
  hora time not null,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.historial (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  fecha date not null default current_date,
  hora time not null default localtime,
  solicitud text not null,
  accion text not null,
  estado text not null default 'exitoso',
  created_at timestamptz not null default now(),
  constraint historial_estado_chk check (estado in ('exitoso', 'pendiente', 'error'))
);

create table public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  autor text not null,
  mensaje text not null,
  tipo text not null default 'texto',
  created_at timestamptz not null default now(),
  constraint conversaciones_autor_chk check (autor in ('usuario', 'asistente'))
);

create index tareas_usuario_idx on public.tareas (usuario_id, created_at desc);
create index recordatorios_usuario_idx on public.recordatorios (usuario_id, fecha, hora);
create index eventos_usuario_idx on public.eventos (usuario_id, fecha, hora);
create index memoria_usuario_idx on public.memoria (usuario_id, created_at desc);
create index automatizaciones_usuario_idx on public.automatizaciones (usuario_id);
create index historial_usuario_idx on public.historial (usuario_id, created_at desc);
create index conversaciones_usuario_idx on public.conversaciones (usuario_id, created_at);

alter table public.perfiles enable row level security;
alter table public.tareas enable row level security;
alter table public.recordatorios enable row level security;
alter table public.eventos enable row level security;
alter table public.memoria enable row level security;
alter table public.automatizaciones enable row level security;
alter table public.historial enable row level security;
alter table public.conversaciones enable row level security;

-- Acceso inicial: el cliente usa la publishable key (rol anon).
-- Sustituir por políticas por usuario cuando exista auth.
create policy dilo_perfiles_anon on public.perfiles for all to anon, authenticated using (true) with check (true);
create policy dilo_tareas_anon on public.tareas for all to anon, authenticated using (true) with check (true);
create policy dilo_recordatorios_anon on public.recordatorios for all to anon, authenticated using (true) with check (true);
create policy dilo_eventos_anon on public.eventos for all to anon, authenticated using (true) with check (true);
create policy dilo_memoria_anon on public.memoria for all to anon, authenticated using (true) with check (true);
create policy dilo_automatizaciones_anon on public.automatizaciones for all to anon, authenticated using (true) with check (true);
create policy dilo_historial_anon on public.historial for all to anon, authenticated using (true) with check (true);
create policy dilo_conversaciones_anon on public.conversaciones for all to anon, authenticated using (true) with check (true);

insert into public.perfiles (id, nombre, numero, configuracion)
values (
  '00000000-0000-4000-8000-000000000001',
  'Gustavo',
  '+591 700 12345',
  '{"notificaciones":true,"avisosRecordatorios":true,"avisosAutomatizaciones":true,"memoriaActiva":true,"preferenciaVoz":false}'::jsonb
);

insert into public.tareas (usuario_id, titulo, descripcion, fecha, prioridad, estado, origen) values
  ('00000000-0000-4000-8000-000000000001', 'Enviar el informe mensual', 'Adjuntar el resumen de actividades y enviarlo por correo.', current_date, 'alta', 'en progreso', 'chat'),
  ('00000000-0000-4000-8000-000000000001', 'Comprar materiales de oficina', 'Hojas, marcadores y carpetas para el proyecto.', current_date + 1, 'media', 'pendiente', 'chat'),
  ('00000000-0000-4000-8000-000000000001', 'Revisar el presupuesto del proyecto', 'Validar los montos con el área administrativa.', current_date + 3, 'alta', 'pendiente', 'panel'),
  ('00000000-0000-4000-8000-000000000001', 'Actualizar la documentación del sistema', 'Incluir los nuevos módulos del sistema.', current_date - 2, 'baja', 'completada', 'panel');

insert into public.recordatorios (usuario_id, actividad, fecha, hora, estado, activo) values
  ('00000000-0000-4000-8000-000000000001', 'Llevar los documentos a la oficina', current_date, '08:00', 'pendiente', true),
  ('00000000-0000-4000-8000-000000000001', 'Tomar la medicación', current_date, '21:00', 'pendiente', true),
  ('00000000-0000-4000-8000-000000000001', 'Llamar al banco', current_date + 2, '10:30', 'pendiente', true),
  ('00000000-0000-4000-8000-000000000001', 'Pagar el servicio de internet', current_date - 1, '09:00', 'completado', false);

insert into public.eventos (usuario_id, titulo, descripcion, persona, lugar, fecha, hora, estado) values
  ('00000000-0000-4000-8000-000000000001', 'Reunión con Carlos', 'Revisión del avance del proyecto.', 'Carlos', 'Sala 2 — Oficina central', current_date + 2, '15:00', 'pendiente'),
  ('00000000-0000-4000-8000-000000000001', 'Consulta médica', 'Control anual.', null, 'Clínica San Lucas', current_date + 5, '11:00', 'pendiente'),
  ('00000000-0000-4000-8000-000000000001', 'Defensa del proyecto', 'Presentación final del sistema.', 'Docente', 'Aula 305', current_date + 9, '09:30', 'pendiente');

insert into public.memoria (usuario_id, informacion, categoria, fecha) values
  ('00000000-0000-4000-8000-000000000001', 'Carlos es mi compañero de proyecto y coordinamos los viernes.', 'Personas', current_date - 12),
  ('00000000-0000-4000-8000-000000000001', 'Prefiero recibir los recordatorios por nota de voz.', 'Preferencias', current_date - 9),
  ('00000000-0000-4000-8000-000000000001', 'Trabajo de 08:00 a 17:00 de lunes a viernes.', 'Horarios', current_date - 9),
  ('00000000-0000-4000-8000-000000000001', 'Todos los lunes reviso mis tareas pendientes.', 'Actividades frecuentes', current_date - 6),
  ('00000000-0000-4000-8000-000000000001', 'Mi número de contacto alterno termina en 4821.', 'Información personalizada', current_date - 3);

insert into public.automatizaciones (usuario_id, nombre, accion, cuando, frecuencia, hora, activa) values
  ('00000000-0000-4000-8000-000000000001', 'Reporte semanal', 'Enviar recordatorio para realizar el reporte.', 'Viernes', 'Todos los viernes', '17:00', true),
  ('00000000-0000-4000-8000-000000000001', 'Revisión de tareas', 'Enviar la lista de tareas pendientes del día.', 'Lunes', 'Todos los lunes', '09:00', true),
  ('00000000-0000-4000-8000-000000000001', 'Resumen diario', 'Enviar el resumen de actividades del día siguiente.', 'Cada noche', 'Todos los días', '20:00', false);

insert into public.historial (usuario_id, fecha, hora, solicitud, accion, estado) values
  ('00000000-0000-4000-8000-000000000001', current_date, '08:00', 'Recuérdame llevar los documentos', 'Recordatorio enviado', 'exitoso'),
  ('00000000-0000-4000-8000-000000000001', current_date, '07:30', '¿Qué tareas tengo para hoy?', 'Consulta respondida', 'exitoso'),
  ('00000000-0000-4000-8000-000000000001', current_date - 1, '17:00', 'Automatización “Reporte semanal”', 'Automatización ejecutada', 'exitoso');

insert into public.conversaciones (usuario_id, autor, mensaje, tipo) values
  ('00000000-0000-4000-8000-000000000001', 'asistente', '¡Hola Gustavo! Soy Dilo. Escríbeme o envíame una nota de voz: “Recuérdame mañana a las 8 enviar el informe”.', 'texto');
