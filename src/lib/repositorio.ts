import {
  CATEGORIAS_MEMORIA,
  type Automatizacion,
  type CategoriaMemoria,
  type ConfiguracionUsuario,
  type EstadoSimple,
  type EstadoTarea,
  type Evento,
  type HistorialItem,
  type MemoriaItem,
  type MensajeChat,
  type PrioridadTarea,
  type Recordatorio,
  type Tarea,
} from "./datos";
import type { Json } from "./database.types";
import { supabase } from "./supabase";
import { VOZ_DEFECTO_ID, vozResuelta } from "./voces";

export const nuevoId = () => crypto.randomUUID();

export type EstadoPersistencia = "memoria" | "conectado" | "error";

export interface EstadoRemoto {
  mensajes: MensajeChat[];
  tareas: Tarea[];
  recordatorios: Recordatorio[];
  eventos: Evento[];
  memoria: MemoriaItem[];
  automatizaciones: Automatizacion[];
  historial: HistorialItem[];
  configuracion: ConfiguracionUsuario;
  nombre: string;
  numero: string | null;
}

const CONFIG_DEFECTO: ConfiguracionUsuario = {
  notificaciones: true,
  avisosRecordatorios: true,
  avisosAutomatizaciones: true,
  memoriaActiva: true,
  preferenciaVoz: true,
  vozId: VOZ_DEFECTO_ID,
};

function horaCorta(valor: string): string {
  return valor.slice(0, 5);
}

function logError(accion: string, error: { message: string } | null) {
  if (error) console.error(`[supabase] ${accion}:`, error.message);
}

function esPrioridad(valor: string): valor is PrioridadTarea {
  return valor === "alta" || valor === "media" || valor === "baja";
}

function esEstadoTarea(valor: string): valor is EstadoTarea {
  return valor === "pendiente" || valor === "en progreso" || valor === "completada";
}

function esEstadoSimple(valor: string): valor is EstadoSimple {
  return valor === "pendiente" || valor === "completado" || valor === "cancelado";
}

function esEstadoHistorial(valor: string): valor is HistorialItem["estado"] {
  return valor === "exitoso" || valor === "pendiente" || valor === "error";
}

function esCategoria(valor: string): valor is CategoriaMemoria {
  return (CATEGORIAS_MEMORIA as readonly string[]).includes(valor);
}

function esAutor(valor: string): valor is MensajeChat["autor"] {
  return valor === "usuario" || valor === "asistente";
}

function esTipoMensaje(valor: string): valor is MensajeChat["tipo"] {
  return (
    valor === "texto" ||
    valor === "voz" ||
    valor === "analisis" ||
    valor === "confirmacion" ||
    valor === "error" ||
    valor === "aclaracion" ||
    valor === "proceso"
  );
}

function configDesdeJson(valor: Json): ConfiguracionUsuario {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return CONFIG_DEFECTO;
  const o = valor;
  return {
    notificaciones: o["notificaciones"] !== false,
    avisosRecordatorios: o["avisosRecordatorios"] !== false,
    avisosAutomatizaciones: o["avisosAutomatizaciones"] !== false,
    memoriaActiva: o["memoriaActiva"] !== false,
    preferenciaVoz: o["preferenciaVoz"] !== false,
    vozId: vozResuelta(typeof o["vozId"] === "string" ? o["vozId"] : undefined),
  };
}

export async function cargarEstadoRemoto(usuarioId: string): Promise<EstadoRemoto | null> {
  if (!supabase || !usuarioId) return null;

  const db = supabase;

  const [perfil, tareas, recordatorios, eventos, memoria, automatizaciones, historial, conversaciones] =
    await Promise.all([
      db.from("perfiles").select("nombre, numero, configuracion").eq("id", usuarioId).maybeSingle(),
      db.from("tareas").select("*").eq("usuario_id", usuarioId).order("created_at", { ascending: false }),
      db.from("recordatorios").select("*").eq("usuario_id", usuarioId).order("fecha", { ascending: true }),
      db.from("eventos").select("*").eq("usuario_id", usuarioId).order("fecha", { ascending: true }),
      db.from("memoria").select("*").eq("usuario_id", usuarioId).order("created_at", { ascending: false }),
      db.from("automatizaciones").select("*").eq("usuario_id", usuarioId).order("created_at", { ascending: true }),
      db.from("historial").select("*").eq("usuario_id", usuarioId).order("created_at", { ascending: false }),
      db.from("conversaciones").select("*").eq("usuario_id", usuarioId).order("created_at", { ascending: true }),
    ]);

  const error =
    perfil.error ??
    tareas.error ??
    recordatorios.error ??
    eventos.error ??
    memoria.error ??
    automatizaciones.error ??
    historial.error ??
    conversaciones.error;

  if (error) {
    logError("cargar", error);
    return null;
  }

  return {
    nombre: perfil.data?.nombre ?? "Usuario",
    numero: perfil.data?.numero ?? null,
    configuracion: configDesdeJson(perfil.data?.configuracion ?? {}),
    tareas: (tareas.data ?? []).flatMap((fila) => {
      if (!esPrioridad(fila.prioridad) || !esEstadoTarea(fila.estado)) return [];
      if (fila.origen !== "chat" && fila.origen !== "panel") return [];
      return [
        {
          id: fila.id,
          titulo: fila.titulo,
          descripcion: fila.descripcion,
          fecha: fila.fecha,
          prioridad: fila.prioridad,
          estado: fila.estado,
          origen: fila.origen,
        },
      ];
    }),
    recordatorios: (recordatorios.data ?? []).flatMap((fila) => {
      if (!esEstadoSimple(fila.estado)) return [];
      return [
        {
          id: fila.id,
          actividad: fila.actividad,
          fecha: fila.fecha,
          hora: horaCorta(fila.hora),
          estado: fila.estado,
          activo: fila.activo,
        },
      ];
    }),
    eventos: (eventos.data ?? []).flatMap((fila) => {
      if (!esEstadoSimple(fila.estado)) return [];
      return [
        {
          id: fila.id,
          titulo: fila.titulo,
          descripcion: fila.descripcion,
          persona: fila.persona,
          lugar: fila.lugar,
          fecha: fila.fecha,
          hora: horaCorta(fila.hora),
          estado: fila.estado,
        },
      ];
    }),
    memoria: (memoria.data ?? []).flatMap((fila) => {
      if (!esCategoria(fila.categoria)) return [];
      return [
        {
          id: fila.id,
          informacion: fila.informacion,
          categoria: fila.categoria,
          fecha: fila.fecha,
        },
      ];
    }),
    automatizaciones: (automatizaciones.data ?? []).map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      accion: fila.accion,
      cuando: fila.cuando,
      frecuencia: fila.frecuencia,
      hora: horaCorta(fila.hora),
      activa: fila.activa,
      ultimaEjecucion: fila.ultima_ejecucion,
    })),
    historial: (historial.data ?? []).flatMap((fila) => {
      if (!esEstadoHistorial(fila.estado)) return [];
      return [
        {
          id: fila.id,
          fecha: fila.fecha,
          hora: horaCorta(fila.hora),
          solicitud: fila.solicitud,
          accion: fila.accion,
          estado: fila.estado,
        },
      ];
    }),
    mensajes: (conversaciones.data ?? []).flatMap((fila) => {
      if (!esAutor(fila.autor) || !esTipoMensaje(fila.tipo)) return [];
      const creado = new Date(fila.created_at);
      return [
        {
          id: fila.id,
          autor: fila.autor,
          texto: fila.mensaje,
          tipo: fila.tipo,
          hora: `${String(creado.getHours()).padStart(2, "0")}:${String(creado.getMinutes()).padStart(2, "0")}`,
        },
      ];
    }),
  };
}

export async function guardarTarea(t: Tarea, usuarioId: string) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase.from("tareas").upsert({
    id: t.id,
    usuario_id: usuarioId,
    titulo: t.titulo,
    descripcion: t.descripcion,
    fecha: t.fecha,
    prioridad: t.prioridad,
    estado: t.estado,
    origen: t.origen,
  });
  logError("tarea", error);
}

export async function borrarTarea(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from("tareas").delete().eq("id", id);
  logError("borrar tarea", error);
}

export async function guardarRecordatorio(r: Recordatorio, usuarioId: string) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase.from("recordatorios").upsert({
    id: r.id,
    usuario_id: usuarioId,
    actividad: r.actividad,
    fecha: r.fecha,
    hora: r.hora,
    estado: r.estado,
    activo: r.activo,
  });
  logError("recordatorio", error);
}

export async function borrarRecordatorio(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from("recordatorios").delete().eq("id", id);
  logError("borrar recordatorio", error);
}

export async function guardarEvento(e: Evento, usuarioId: string) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase.from("eventos").upsert({
    id: e.id,
    usuario_id: usuarioId,
    titulo: e.titulo,
    descripcion: e.descripcion,
    persona: e.persona,
    lugar: e.lugar,
    fecha: e.fecha,
    hora: e.hora,
    estado: e.estado,
  });
  logError("evento", error);
}

export async function borrarEvento(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  logError("borrar evento", error);
}

export async function guardarMemoria(m: MemoriaItem, usuarioId: string) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase.from("memoria").upsert({
    id: m.id,
    usuario_id: usuarioId,
    informacion: m.informacion,
    categoria: m.categoria,
    fecha: m.fecha,
  });
  logError("memoria", error);
}

export async function borrarMemoria(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from("memoria").delete().eq("id", id);
  logError("borrar memoria", error);
}

export async function vaciarMemoria(usuarioId: string) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase.from("memoria").delete().eq("usuario_id", usuarioId);
  logError("vaciar memoria", error);
}

export async function guardarAutomatizacion(a: Automatizacion, usuarioId: string) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase.from("automatizaciones").upsert({
    id: a.id,
    usuario_id: usuarioId,
    nombre: a.nombre,
    accion: a.accion,
    cuando: a.cuando,
    frecuencia: a.frecuencia,
    hora: a.hora,
    activa: a.activa,
    ultima_ejecucion: a.ultimaEjecucion,
  });
  logError("automatización", error);
}

export async function borrarAutomatizacion(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from("automatizaciones").delete().eq("id", id);
  logError("borrar automatización", error);
}

export async function guardarHistorial(h: HistorialItem, usuarioId: string) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase.from("historial").upsert({
    id: h.id,
    usuario_id: usuarioId,
    fecha: h.fecha,
    hora: h.hora,
    solicitud: h.solicitud,
    accion: h.accion,
    estado: h.estado,
  });
  logError("historial", error);
}

export async function guardarMensaje(m: MensajeChat, usuarioId: string) {
  if (!supabase || !usuarioId) return;
  if (m.tipo === "proceso" || m.tipo === "analisis") return;
  const { error } = await supabase.from("conversaciones").upsert({
    id: m.id,
    usuario_id: usuarioId,
    autor: m.autor,
    mensaje: m.texto,
    tipo: m.tipo,
  });
  logError("mensaje", error);
}

export async function guardarConfiguracion(c: ConfiguracionUsuario, usuarioId: string) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase
    .from("perfiles")
    .update({ configuracion: c as unknown as Json })
    .eq("id", usuarioId);
  logError("configuración", error);
}

export async function actualizarDatosPerfil(
  usuarioId: string,
  cambios: { nombre?: string; numero?: string | null },
) {
  if (!supabase || !usuarioId) return;
  const { error } = await supabase.from("perfiles").update(cambios).eq("id", usuarioId);
  logError("perfil datos", error);
}

export type RolPerfil = "usuario" | "administrador";

export interface PerfilSesion {
  id: string;
  nombre: string;
  correo: string | null;
  numero: string | null;
  rol: RolPerfil;
  registro: string;
}

function filaAPerfil(fila: {
  id: string;
  nombre: string;
  correo: string | null;
  numero: string | null;
  rol: string;
  created_at: string;
}): PerfilSesion {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    numero: fila.numero,
    rol: fila.rol === "administrador" ? "administrador" : "usuario",
    registro: fila.created_at.slice(0, 10),
  };
}

export async function cargarPerfil(id: string): Promise<PerfilSesion | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, correo, numero, rol, created_at")
    .eq("id", id)
    .maybeSingle();
  logError("perfil", error);
  if (!data) return null;
  return filaAPerfil(data);
}

export async function asegurarPerfil(
  id: string,
  nombre: string,
  correo: string | null,
): Promise<PerfilSesion | null> {
  if (!supabase) return null;
  const { error } = await supabase.from("perfiles").upsert({
    id,
    nombre,
    correo,
    rol: "usuario",
  });
  logError("asegurar perfil", error);
  return cargarPerfil(id);
}

export async function listarPerfiles(): Promise<PerfilSesion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, correo, numero, rol, created_at")
    .order("created_at", { ascending: true });
  logError("perfiles", error);
  return (data ?? []).map(filaAPerfil);
}

/** Crea una cuenta de Auth + perfil. Solo el administrador autenticado puede usarlo. */
export async function crearUsuarioPorAdmin(
  nombre: string,
  correo: string,
  clave: string,
): Promise<string | null> {
  if (!supabase) return "Supabase no está configurado.";
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return "Debes iniciar sesión.";
  const res = await fetch("/api/usuarios", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nombre: nombre.trim(), correo: correo.trim(), clave }),
  });
  const cuerpo = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) return cuerpo.error || "No se pudo crear la cuenta.";
  return null;
}

export async function contarTabla(tabla: "tareas" | "recordatorios" | "automatizaciones") {
  if (!supabase) return 0;
  const { count, error } = await supabase.from(tabla).select("id", { count: "exact", head: true });
  logError(`contar ${tabla}`, error);
  return count ?? 0;
}

export interface ActividadSistema {
  id: string;
  usuario: string;
  accion: string;
  fecha: string;
  estado: HistorialItem["estado"];
}

export async function listarActividadSistema(): Promise<ActividadSistema[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("historial")
    .select("id, accion, fecha, hora, estado, perfiles!usuario_id(nombre)")
    .order("created_at", { ascending: false })
    .limit(40);
  logError("actividad sistema", error);
  return (data ?? []).flatMap((fila) => {
    if (!esEstadoHistorial(fila.estado)) return [];
    const perfil = fila.perfiles as { nombre: string } | { nombre: string }[] | null;
    const nombre = Array.isArray(perfil) ? perfil[0]?.nombre : perfil?.nombre;
    return [
      {
        id: fila.id,
        usuario: nombre ?? "Usuario",
        accion: fila.accion,
        fecha: `${fila.fecha} ${horaCorta(fila.hora)}`,
        estado: fila.estado,
      },
    ];
  });
}

export interface AutomatizacionSistema extends Automatizacion {
  usuario: string;
}

export async function listarAutomatizacionesSistema(): Promise<AutomatizacionSistema[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("automatizaciones")
    .select("*, perfiles!usuario_id(nombre)")
    .order("created_at", { ascending: true });
  logError("automatizaciones sistema", error);
  return (data ?? []).map((fila) => {
    const perfil = fila.perfiles as { nombre: string } | { nombre: string }[] | null;
    const nombre = Array.isArray(perfil) ? perfil[0]?.nombre : perfil?.nombre;
    return {
      id: fila.id,
      nombre: fila.nombre,
      accion: fila.accion,
      cuando: fila.cuando,
      frecuencia: fila.frecuencia,
      hora: horaCorta(fila.hora),
      activa: fila.activa,
      ultimaEjecucion: fila.ultima_ejecucion,
      usuario: nombre ?? "Usuario",
    };
  });
}
