// Estado global de Dilo. Persiste en Supabase con el usuario autenticado.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fechaLegible, horaAhora, interpretar, type Interpretacion } from "./asistente";
import { useAuth } from "./auth";
import {
  hoyISO,
  type Automatizacion,
  type CategoriaMemoria,
  type ConfiguracionUsuario,
  type Evento,
  type HistorialItem,
  type MemoriaItem,
  type MensajeChat,
  type Recordatorio,
  type Tarea,
} from "./datos";
import { avisosPendientes, buscarUno } from "./motor";
import {
  borrarAutomatizacion,
  borrarEvento,
  borrarMemoria,
  borrarRecordatorio,
  borrarTarea,
  cargarEstadoRemoto,
  guardarAutomatizacion,
  guardarConfiguracion,
  guardarEvento,
  guardarHistorial,
  guardarMemoria,
  guardarMensaje,
  guardarRecordatorio,
  guardarTarea,
  nuevoId,
  vaciarMemoria,
  type EstadoPersistencia,
} from "./repositorio";
import { supabaseConfigurado } from "./supabase";
import { hablar } from "./voz";

export type { ConfiguracionUsuario, MensajeChat };

const MENSAJE_BIENVENIDA = (nombre: string): MensajeChat => ({
  id: "msg-welcome",
  autor: "asistente",
  texto: `En línea, ${nombre}. Soy Dilo. Dime qué hacer: recordatorios, tareas, eventos, memoria o automatizaciones. Puedes hablarme.`,
  tipo: "texto",
  hora: "08:00",
});

interface Ctx {
  usuario: string;
  usuarioId: string;
  mensajes: MensajeChat[];
  tareas: Tarea[];
  recordatorios: Recordatorio[];
  eventos: Evento[];
  memoria: MemoriaItem[];
  automatizaciones: Automatizacion[];
  historial: HistorialItem[];
  configuracion: ConfiguracionUsuario;
  enviarMensaje: (texto: string, tipo: "texto" | "voz") => void;
  agregarTarea: (t: Omit<Tarea, "id">) => void;
  actualizarTarea: (id: string, cambios: Partial<Tarea>) => void;
  eliminarTarea: (id: string) => void;
  agregarRecordatorio: (r: Omit<Recordatorio, "id">) => void;
  actualizarRecordatorio: (id: string, cambios: Partial<Recordatorio>) => void;
  eliminarRecordatorio: (id: string) => void;
  agregarEvento: (e: Omit<Evento, "id">) => void;
  actualizarEvento: (id: string, cambios: Partial<Evento>) => void;
  eliminarEvento: (id: string) => void;
  agregarMemoria: (m: Omit<MemoriaItem, "id">) => void;
  actualizarMemoria: (id: string, cambios: Partial<MemoriaItem>) => void;
  eliminarMemoria: (id: string) => void;
  limpiarMemoria: () => void;
  agregarAutomatizacion: (a: Omit<Automatizacion, "id">) => void;
  actualizarAutomatizacion: (id: string, cambios: Partial<Automatizacion>) => void;
  eliminarAutomatizacion: (id: string) => void;
  actualizarConfiguracion: (c: Partial<ConfiguracionUsuario>) => void;
  registrar: (solicitud: string, accion: string, estado?: HistorialItem["estado"]) => void;
  persistencia: EstadoPersistencia;
}

const AsistenteContext = createContext<Ctx | null>(null);

const CONFIG_INICIAL: ConfiguracionUsuario = {
  notificaciones: true,
  avisosRecordatorios: true,
  avisosAutomatizaciones: true,
  memoriaActiva: true,
  preferenciaVoz: true,
};

async function interpretarSolicitud(texto: string): Promise<Interpretacion> {
  try {
    const res = await fetch("/api/interpretar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    if (res.ok) return (await res.json()) as Interpretacion;
  } catch {
    /* usa el motor local */
  }
  return interpretar(texto);
}

export function AsistenteProvider({ children }: { children: ReactNode }) {
  const { perfil, cargando: authCargando } = useAuth();
  const usuarioId = perfil?.id ?? "";
  const usuario = perfil?.nombre ?? "Usuario";

  const [mensajes, setMensajes] = useState<MensajeChat[]>([MENSAJE_BIENVENIDA(usuario)]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [memoria, setMemoria] = useState<MemoriaItem[]>([]);
  const [automatizaciones, setAutomatizaciones] = useState<Automatizacion[]>([]);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionUsuario>(CONFIG_INICIAL);
  const [persistencia, setPersistencia] = useState<EstadoPersistencia>(
    supabaseConfigurado ? "conectado" : "memoria",
  );

  const uidRef = useRef(usuarioId);
  uidRef.current = usuarioId;
  const snapshot = useRef({
    tareas,
    recordatorios,
    eventos,
    memoria,
    automatizaciones,
    configuracion,
  });
  snapshot.current = { tareas, recordatorios, eventos, memoria, automatizaciones, configuracion };

  useEffect(() => {
    if (!supabaseConfigurado) {
      setPersistencia("memoria");
      return;
    }
    if (authCargando) return;
    if (!usuarioId) return;

    let cancelado = false;
    void cargarEstadoRemoto(usuarioId).then((remoto) => {
      if (cancelado) return;
      if (!remoto) {
        setPersistencia("error");
        return;
      }
      setMensajes(
        remoto.mensajes.length > 0 ? remoto.mensajes : [MENSAJE_BIENVENIDA(remoto.nombre)],
      );
      setTareas(remoto.tareas);
      setRecordatorios(remoto.recordatorios);
      setEventos(remoto.eventos);
      setMemoria(remoto.memoria);
      setAutomatizaciones(remoto.automatizaciones);
      setHistorial(remoto.historial);
      setConfiguracion(remoto.configuracion);
      setPersistencia("conectado");
    });
    return () => {
      cancelado = true;
    };
  }, [authCargando, usuarioId]);

  const cfgRef = useRef(configuracion);
  cfgRef.current = configuracion;

  const registrar = useCallback(
    (solicitud: string, accion: string, estado: HistorialItem["estado"] = "exitoso") => {
      const item: HistorialItem = {
        id: nuevoId(),
        fecha: hoyISO(),
        hora: horaAhora(),
        solicitud,
        accion,
        estado,
      };
      setHistorial((p) => [item, ...p]);
      void guardarHistorial(item, uidRef.current);
    },
    [],
  );

  const push = useCallback((m: Omit<MensajeChat, "id" | "hora">) => {
    const item: MensajeChat = { ...m, id: nuevoId(), hora: horaAhora() };
    setMensajes((p) => [...p, item]);
    void guardarMensaje(item, uidRef.current);
    if (
      item.autor === "asistente" &&
      cfgRef.current.preferenciaVoz &&
      (item.tipo === "texto" ||
        item.tipo === "confirmacion" ||
        item.tipo === "aclaracion" ||
        item.tipo === "error")
    ) {
      hablar(item.texto);
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const { recordatorios: recs, automatizaciones: autos, configuracion: cfg } = snapshot.current;
      if (!cfg.notificaciones) return;
      const avisos = avisosPendientes(recs, autos);
      if (avisos.length === 0) return;

      for (const aviso of avisos) {
        if (aviso.tipo === "recordatorio" && cfg.avisosRecordatorios) {
          setRecordatorios((p) => {
            const next = p.map((x) =>
              x.id === aviso.id ? { ...x, estado: "completado" as const, activo: false } : x,
            );
            const item = next.find((x) => x.id === aviso.id);
            if (item) void guardarRecordatorio(item, uidRef.current);
            return next;
          });
          push({ autor: "asistente", texto: `🔔 ${aviso.texto}`, tipo: "confirmacion" });
          registrar(aviso.texto, "Recordatorio ejecutado");
        }
        if (aviso.tipo === "automatizacion" && cfg.avisosAutomatizaciones) {
          setAutomatizaciones((p) => {
            const next = p.map((x) =>
              x.id === aviso.id ? { ...x, ultimaEjecucion: hoyISO() } : x,
            );
            const item = next.find((x) => x.id === aviso.id);
            if (item) void guardarAutomatizacion(item, uidRef.current);
            return next;
          });
          push({ autor: "asistente", texto: `⚙️ ${aviso.texto}`, tipo: "confirmacion" });
          registrar(aviso.texto, "Automatización ejecutada");
        }
      }
    };

    const id = window.setInterval(tick, 20_000);
    tick();
    return () => window.clearInterval(id);
  }, [push, registrar]);

  const aplicarInterpretacion = useCallback(
    (texto: string, r: Interpretacion) => {
      const {
        tareas: tNow,
        recordatorios: rNow,
        eventos: eNow,
        memoria: mNow,
        automatizaciones: aNow,
        configuracion: cfg,
      } = snapshot.current;

      const aclarar = (msg: string) => {
        push({ autor: "asistente", texto: msg, tipo: "aclaracion" });
        registrar(texto, "Se solicitó aclaración", "pendiente");
      };

      switch (r.intencion) {
        case "completar": {
          const tareasHit = buscarUno(tNow, r.actividad, (t) => t.titulo);
          const recHit = buscarUno(rNow, r.actividad, (x) => x.actividad);
          const evHit = buscarUno(eNow, r.actividad, (e) => e.titulo);
          if (r.entidad === "recordatorio" || (recHit.length === 1 && tareasHit.length === 0)) {
            const item = recHit[0];
            if (!item) {
              aclarar("No encontré ese recordatorio. ¿Cuál quieres completar?");
              break;
            }
            const next = { ...item, estado: "completado" as const, activo: false };
            setRecordatorios((p) => p.map((x) => (x.id === item.id ? next : x)));
            void guardarRecordatorio(next, uidRef.current);
            push({
              autor: "asistente",
              texto: `✓ Recordatorio completado: “${item.actividad}”.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Recordatorio completado");
            break;
          }
          if (r.entidad === "evento" || (evHit.length === 1 && tareasHit.length === 0)) {
            const item = evHit[0];
            if (!item) {
              aclarar("No encontré ese evento. ¿Cuál quieres completar?");
              break;
            }
            const next = { ...item, estado: "completado" as const };
            setEventos((p) => p.map((x) => (x.id === item.id ? next : x)));
            void guardarEvento(next, uidRef.current);
            push({
              autor: "asistente",
              texto: `✓ Evento marcado como completado: “${item.titulo}”.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Evento completado");
            break;
          }
          const item = tareasHit[0];
          if (!item || tareasHit.length > 1) {
            aclarar("No identifiqué qué tarea completar. Dime el título, por ejemplo “completa comprar materiales”.");
            break;
          }
          const next = { ...item, estado: "completada" as const };
          setTareas((p) => p.map((x) => (x.id === item.id ? next : x)));
          void guardarTarea(next, uidRef.current);
          push({
            autor: "asistente",
            texto: `✓ Tarea completada: “${item.titulo}”.`,
            tipo: "confirmacion",
          });
          registrar(texto, "Tarea completada");
          break;
        }
        case "eliminar": {
          if (r.entidad === "memoria" || /memoria|recuerdo/i.test(texto)) {
            const hits = buscarUno(mNow, r.actividad, (m) => m.informacion);
            const item = hits[0];
            if (!item) {
              aclarar("No encontré ese recuerdo. ¿Cuál quieres olvidar?");
              break;
            }
            setMemoria((p) => p.filter((x) => x.id !== item.id));
            void borrarMemoria(item.id);
            push({
              autor: "asistente",
              texto: `✓ Lo olvidé: “${item.informacion}”.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Memoria eliminada");
            break;
          }
          if (r.entidad === "recordatorio") {
            const hits = buscarUno(rNow, r.actividad, (x) => x.actividad);
            const item = hits[0];
            if (!item) {
              aclarar("No encontré ese recordatorio.");
              break;
            }
            setRecordatorios((p) => p.filter((x) => x.id !== item.id));
            void borrarRecordatorio(item.id);
            push({
              autor: "asistente",
              texto: `✓ Recordatorio eliminado: “${item.actividad}”.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Recordatorio eliminado");
            break;
          }
          if (r.entidad === "evento") {
            const hits = buscarUno(eNow, r.actividad, (e) => e.titulo);
            const item = hits[0];
            if (!item) {
              aclarar("No encontré ese evento.");
              break;
            }
            setEventos((p) => p.filter((x) => x.id !== item.id));
            void borrarEvento(item.id);
            push({
              autor: "asistente",
              texto: `✓ Evento eliminado: “${item.titulo}”.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Evento eliminado");
            break;
          }
          if (r.entidad === "automatizacion") {
            const hits = buscarUno(aNow, r.actividad, (a) => `${a.nombre} ${a.accion}`);
            const item = hits[0];
            if (!item) {
              aclarar("No encontré esa automatización.");
              break;
            }
            setAutomatizaciones((p) => p.filter((x) => x.id !== item.id));
            void borrarAutomatizacion(item.id);
            push({
              autor: "asistente",
              texto: `✓ Automatización eliminada: “${item.nombre}”.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Automatización eliminada");
            break;
          }
          const hits = buscarUno(tNow, r.actividad, (t) => t.titulo);
          const item = hits[0];
          if (!item) {
            aclarar("No encontré esa actividad. Indica si es una tarea, recordatorio o evento.");
            break;
          }
          setTareas((p) => p.filter((x) => x.id !== item.id));
          void borrarTarea(item.id);
          push({
            autor: "asistente",
            texto: `✓ Tarea eliminada: “${item.titulo}”.`,
            tipo: "confirmacion",
          });
          registrar(texto, "Tarea eliminada");
          break;
        }
        case "modificar": {
          const aplicarFechaHora = <T extends { fecha?: string | null; hora?: string }>(item: T): T => ({
            ...item,
            ...(r.fecha ? { fecha: r.fecha } : {}),
            ...(r.hora ? { hora: r.hora } : {}),
          });
          if (!r.fecha && !r.hora) {
            aclarar("¿Qué cambio hago? Indica la nueva fecha u hora.");
            break;
          }
          if (r.entidad === "recordatorio") {
            const hits = buscarUno(rNow, r.actividad, (x) => x.actividad);
            const item = hits[0];
            if (!item) {
              aclarar("No encontré ese recordatorio.");
              break;
            }
            const next = aplicarFechaHora(item);
            setRecordatorios((p) => p.map((x) => (x.id === item.id ? next : x)));
            void guardarRecordatorio(next, uidRef.current);
            push({
              autor: "asistente",
              texto: `✓ Recordatorio actualizado: “${next.actividad}” el ${fechaLegible(next.fecha)} a las ${next.hora}.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Recordatorio modificado");
            break;
          }
          if (r.entidad === "evento") {
            const hits = buscarUno(eNow, r.actividad, (e) => `${e.titulo} ${e.persona ?? ""}`);
            const item = hits[0];
            if (!item) {
              aclarar("No encontré ese evento.");
              break;
            }
            const next = aplicarFechaHora(item);
            setEventos((p) => p.map((x) => (x.id === item.id ? next : x)));
            void guardarEvento(next, uidRef.current);
            push({
              autor: "asistente",
              texto: `✓ Evento actualizado: “${next.titulo}” el ${fechaLegible(next.fecha)} a las ${next.hora}.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Evento modificado");
            break;
          }
          const hits = buscarUno(tNow, r.actividad, (t) => t.titulo);
          const item = hits[0];
          if (!item) {
            aclarar("No encontré esa tarea. Prueba con “cambia la reunión a las 16:00”.");
            break;
          }
          const next = { ...item, fecha: r.fecha ?? item.fecha };
          setTareas((p) => p.map((x) => (x.id === item.id ? next : x)));
          void guardarTarea(next, uidRef.current);
          push({
            autor: "asistente",
            texto: `✓ Tarea actualizada: “${next.titulo}”${next.fecha ? ` para el ${fechaLegible(next.fecha)}` : ""}.`,
            tipo: "confirmacion",
          });
          registrar(texto, "Tarea modificada");
          break;
        }
        case "automatizacion": {
          const frecuencia = r.frecuencia ?? "Todos los días";
          const hora = r.hora ?? "08:00";
          const auto: Automatizacion = {
            id: nuevoId(),
            nombre: r.actividad,
            accion: r.actividad,
            cuando: frecuencia.replace(/^Todos los /i, ""),
            frecuencia,
            hora,
            activa: true,
            ultimaEjecucion: null,
          };
          setAutomatizaciones((p) => [...p, auto]);
          void guardarAutomatizacion(auto, uidRef.current);
          push({
            autor: "asistente",
            texto: `✓ Automatización creada: ${frecuencia} a las ${hora} — ${r.actividad}.`,
            tipo: "confirmacion",
          });
          registrar(texto, "Automatización creada");
          break;
        }
        case "memoria": {
          if (!cfg.memoriaActiva) {
            push({
              autor: "asistente",
              texto: "La memoria está desactivada en configuración. Actívala para guardar información.",
              tipo: "aclaracion",
            });
            registrar(texto, "Memoria desactivada: no se guardó", "pendiente");
            break;
          }
          const categoria: CategoriaMemoria = r.persona ? "Personas" : "Preferencias";
          const item: MemoriaItem = { id: nuevoId(), informacion: r.actividad, categoria, fecha: hoyISO() };
          setMemoria((p) => [...p, item]);
          void guardarMemoria(item, uidRef.current);
          push({
            autor: "asistente",
            texto: `✓ Guardado en tu memoria: “${r.actividad}”. Puedes eliminarlo cuando quieras.`,
            tipo: "confirmacion",
          });
          registrar(texto, "Información guardada en memoria");
          break;
        }
        case "evento": {
          if (!r.fecha || !r.hora) {
            push({
              autor: "asistente",
              texto: `Entendí “${r.actividad}”, pero me falta ${!r.fecha ? "la fecha" : "la hora"}. ¿Cuándo lo agendo?`,
              tipo: "aclaracion",
            });
            registrar(texto, "Se solicitó aclaración de fecha y hora", "pendiente");
            break;
          }
          const evento: Evento = {
            id: nuevoId(),
            titulo: r.actividad,
            descripcion: "Creado desde el chat.",
            persona: r.persona,
            lugar: "Por definir",
            fecha: r.fecha,
            hora: r.hora,
            estado: "pendiente",
          };
          setEventos((p) => [...p, evento]);
          void guardarEvento(evento, uidRef.current);
          push({
            autor: "asistente",
            texto: `✓ Evento agendado: ${r.actividad}${r.persona ? ` con ${r.persona}` : ""}, el ${fechaLegible(r.fecha)} a las ${r.hora}.`,
            tipo: "confirmacion",
          });
          registrar(texto, "Evento agendado");
          break;
        }
        case "recordatorio": {
          if (!r.fecha || !r.hora) {
            push({
              autor: "asistente",
              texto: `Entendí “${r.actividad}”, pero me falta ${!r.fecha ? "la fecha" : "la hora"}. ¿Cuándo te lo recuerdo?`,
              tipo: "aclaracion",
            });
            registrar(texto, "Se solicitó aclaración de fecha y hora", "pendiente");
            break;
          }
          const rec: Recordatorio = {
            id: nuevoId(),
            actividad: r.actividad,
            fecha: r.fecha,
            hora: r.hora,
            estado: "pendiente",
            activo: true,
          };
          setRecordatorios((p) => [...p, rec]);
          void guardarRecordatorio(rec, uidRef.current);
          push({
            autor: "asistente",
            texto: `✓ Recordatorio creado: te avisaré el ${fechaLegible(r.fecha)} a las ${r.hora} — ${r.actividad}.`,
            tipo: "confirmacion",
          });
          registrar(texto, "Recordatorio creado");
          break;
        }
        case "consulta": {
          const hoy = hoyISO();
          const lineas = [
            `Tareas pendientes: ${tNow.filter((t) => t.estado !== "completada").map((t) => t.titulo).join(", ") || "ninguna"}`,
            `Recordatorios de hoy: ${rNow.filter((x) => x.fecha === hoy && x.estado === "pendiente").map((x) => x.actividad).join(", ") || "ninguno"}`,
            `Eventos próximos: ${eNow.filter((e) => e.fecha >= hoy).map((e) => e.titulo).join(", ") || "ninguno"}`,
            `Automatizaciones activas: ${aNow.filter((a) => a.activa).length}`,
            cfg.memoriaActiva
              ? `Memoria: ${mNow.slice(0, 3).map((m) => m.informacion).join("; ") || "vacía"}`
              : "Memoria desactivada",
          ];
          push({
            autor: "asistente",
            texto: `Esto es lo que tengo registrado:\n• ${lineas.join("\n• ")}`,
            tipo: "texto",
          });
          registrar(texto, "Consulta respondida");
          break;
        }
        case "desconocida": {
          push({
            autor: "asistente",
            texto:
              "No pude identificar qué necesitas. Intenta con “Recuérdame mañana a las 8 enviar el informe” o “completa comprar materiales”.",
            tipo: "error",
          });
          registrar(texto, "Mensaje no interpretado", "error");
          break;
        }
        default: {
          const tarea: Tarea = {
            id: nuevoId(),
            titulo: r.actividad,
            descripcion: "Creada desde el chat.",
            fecha: r.fecha,
            prioridad: r.prioridad,
            estado: "pendiente",
            origen: "chat",
          };
          setTareas((p) => [...p, tarea]);
          void guardarTarea(tarea, uidRef.current);
          push({
            autor: "asistente",
            texto: `✓ Tarea creada: “${r.actividad}”${r.fecha ? ` para el ${fechaLegible(r.fecha)}` : ""} (prioridad ${r.prioridad}).`,
            tipo: "confirmacion",
          });
          registrar(texto, "Tarea creada");
        }
      }
    },
    [push, registrar],
  );

  const enviarMensaje = useCallback(
    (texto: string, tipo: "texto" | "voz") => {
      push({
        autor: "usuario",
        texto,
        tipo,
        ...(tipo === "voz" ? { transcripcion: texto } : {}),
      });

      const continuar = (r: Interpretacion) => {
        aplicarInterpretacion(texto, r);
      };

      void interpretarSolicitud(texto).then(continuar);
    },
    [push, aplicarInterpretacion],
  );

  const valor = useMemo<Ctx>(
    () => ({
      usuario,
      usuarioId,
      mensajes,
      tareas,
      recordatorios,
      eventos,
      memoria,
      automatizaciones,
      historial,
      configuracion,
      persistencia,
      enviarMensaje,
      agregarTarea: (t) => {
        const item = { ...t, id: nuevoId() };
        setTareas((p) => [item, ...p]);
        void guardarTarea(item, uidRef.current);
        registrar(t.titulo, "Tarea creada desde el panel");
      },
      actualizarTarea: (id, c) =>
        setTareas((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarTarea(item, uidRef.current);
          return next;
        }),
      eliminarTarea: (id) => {
        setTareas((p) => p.filter((x) => x.id !== id));
        void borrarTarea(id);
      },
      agregarRecordatorio: (r) => {
        const item = { ...r, id: nuevoId() };
        setRecordatorios((p) => [item, ...p]);
        void guardarRecordatorio(item, uidRef.current);
        registrar(r.actividad, "Recordatorio creado desde el panel");
      },
      actualizarRecordatorio: (id, c) =>
        setRecordatorios((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarRecordatorio(item, uidRef.current);
          return next;
        }),
      eliminarRecordatorio: (id) => {
        setRecordatorios((p) => p.filter((x) => x.id !== id));
        void borrarRecordatorio(id);
      },
      agregarEvento: (e) => {
        const item = { ...e, id: nuevoId() };
        setEventos((p) => [item, ...p]);
        void guardarEvento(item, uidRef.current);
        registrar(e.titulo, "Evento creado desde el panel");
      },
      actualizarEvento: (id, c) =>
        setEventos((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarEvento(item, uidRef.current);
          return next;
        }),
      eliminarEvento: (id) => {
        setEventos((p) => p.filter((x) => x.id !== id));
        void borrarEvento(id);
      },
      agregarMemoria: (m) => {
        const item = { ...m, id: nuevoId() };
        setMemoria((p) => [item, ...p]);
        void guardarMemoria(item, uidRef.current);
        registrar(m.informacion, "Memoria guardada");
      },
      actualizarMemoria: (id, c) =>
        setMemoria((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarMemoria(item, uidRef.current);
          return next;
        }),
      eliminarMemoria: (id) => {
        setMemoria((p) => p.filter((x) => x.id !== id));
        void borrarMemoria(id);
      },
      limpiarMemoria: () => {
        setMemoria([]);
        void vaciarMemoria(uidRef.current);
        registrar("Eliminar toda la memoria", "Memoria eliminada por el usuario");
      },
      agregarAutomatizacion: (a) => {
        const item = { ...a, id: nuevoId(), ultimaEjecucion: a.ultimaEjecucion ?? null };
        setAutomatizaciones((p) => [item, ...p]);
        void guardarAutomatizacion(item, uidRef.current);
        registrar(a.nombre, "Automatización creada desde el panel");
      },
      actualizarAutomatizacion: (id, c) =>
        setAutomatizaciones((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarAutomatizacion(item, uidRef.current);
          return next;
        }),
      eliminarAutomatizacion: (id) => {
        setAutomatizaciones((p) => p.filter((x) => x.id !== id));
        void borrarAutomatizacion(id);
      },
      actualizarConfiguracion: (c) =>
        setConfiguracion((p) => {
          const next = { ...p, ...c };
          void guardarConfiguracion(next, uidRef.current);
          return next;
        }),
      registrar,
    }),
    [
      usuario,
      usuarioId,
      persistencia,
      mensajes,
      tareas,
      recordatorios,
      eventos,
      memoria,
      automatizaciones,
      historial,
      configuracion,
      enviarMensaje,
      registrar,
    ],
  );

  return <AsistenteContext.Provider value={valor}>{children}</AsistenteContext.Provider>;
}

export function useAsistente() {
  const ctx = useContext(AsistenteContext);
  if (!ctx) throw new Error("useAsistente debe usarse dentro de AsistenteProvider");
  return ctx;
}
