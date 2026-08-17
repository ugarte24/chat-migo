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

export const USUARIO_DEMO_ID = "00000000-0000-4000-8000-000000000001";

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
}

const CONFIG_DEFECTO: ConfiguracionUsuario = {
  notificaciones: true,
  avisosRecordatorios: true,
  avisosAutomatizaciones: true,
  memoriaActiva: true,
  preferenciaVoz: false,
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
    preferenciaVoz: o["preferenciaVoz"] === true,
  };
}

export async function cargarEstadoRemoto(): Promise<EstadoRemoto | null> {
  if (!supabase) return null;

  const db = supabase;
  const uid = USUARIO_DEMO_ID;

  const [perfil, tareas, recordatorios, eventos, memoria, automatizaciones, historial, conversaciones] =
    await Promise.all([
      db.from("perfiles").select("nombre, configuracion").eq("id", uid).maybeSingle(),
      db.from("tareas").select("*").eq("usuario_id", uid).order("created_at", { ascending: false }),
      db.from("recordatorios").select("*").eq("usuario_id", uid).order("fecha", { ascending: true }),
      db.from("eventos").select("*").eq("usuario_id", uid).order("fecha", { ascending: true }),
      db.from("memoria").select("*").eq("usuario_id", uid).order("created_at", { ascending: false }),
      db.from("automatizaciones").select("*").eq("usuario_id", uid).order("created_at", { ascending: true }),
      db.from("historial").select("*").eq("usuario_id", uid).order("created_at", { ascending: false }),
      db.from("conversaciones").select("*").eq("usuario_id", uid).order("created_at", { ascending: true }),
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

export async function guardarTarea(t: Tarea) {
  if (!supabase) return;
  const { error } = await supabase.from("tareas").upsert({
    id: t.id,
    usuario_id: USUARIO_DEMO_ID,
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

export async function guardarRecordatorio(r: Recordatorio) {
  if (!supabase) return;
  const { error } = await supabase.from("recordatorios").upsert({
    id: r.id,
    usuario_id: USUARIO_DEMO_ID,
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

export async function guardarEvento(e: Evento) {
  if (!supabase) return;
  const { error } = await supabase.from("eventos").upsert({
    id: e.id,
    usuario_id: USUARIO_DEMO_ID,
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

export async function guardarMemoria(m: MemoriaItem) {
  if (!supabase) return;
  const { error } = await supabase.from("memoria").upsert({
    id: m.id,
    usuario_id: USUARIO_DEMO_ID,
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

export async function vaciarMemoria() {
  if (!supabase) return;
  const { error } = await supabase.from("memoria").delete().eq("usuario_id", USUARIO_DEMO_ID);
  logError("vaciar memoria", error);
}

export async function guardarAutomatizacion(a: Automatizacion) {
  if (!supabase) return;
  const { error } = await supabase.from("automatizaciones").upsert({
    id: a.id,
    usuario_id: USUARIO_DEMO_ID,
    nombre: a.nombre,
    accion: a.accion,
    cuando: a.cuando,
    frecuencia: a.frecuencia,
    hora: a.hora,
    activa: a.activa,
  });
  logError("automatización", error);
}

export async function borrarAutomatizacion(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from("automatizaciones").delete().eq("id", id);
  logError("borrar automatización", error);
}

export async function guardarHistorial(h: HistorialItem) {
  if (!supabase) return;
  const { error } = await supabase.from("historial").upsert({
    id: h.id,
    usuario_id: USUARIO_DEMO_ID,
    fecha: h.fecha,
    hora: h.hora,
    solicitud: h.solicitud,
    accion: h.accion,
    estado: h.estado,
  });
  logError("historial", error);
}

export async function guardarMensaje(m: MensajeChat) {
  if (!supabase) return;
  if (m.tipo === "proceso" || m.tipo === "analisis") return;
  const { error } = await supabase.from("conversaciones").upsert({
    id: m.id,
    usuario_id: USUARIO_DEMO_ID,
    autor: m.autor,
    mensaje: m.texto,
    tipo: m.tipo,
  });
  logError("mensaje", error);
}

export async function guardarConfiguracion(c: ConfiguracionUsuario) {
  if (!supabase) return;
  const { error } = await supabase
    .from("perfiles")
    .update({ configuracion: c })
    .eq("id", USUARIO_DEMO_ID);
  logError("configuración", error);
}
