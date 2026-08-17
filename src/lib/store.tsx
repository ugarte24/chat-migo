// Estado global del prototipo. Persiste en Supabase cuando hay credenciales;
// si falla la carga, sigue con los datos locales.

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
import {
  AUTOMATIZACIONES_INICIALES,
  EVENTOS_INICIALES,
  HISTORIAL_INICIAL,
  MEMORIA_INICIAL,
  RECORDATORIOS_INICIALES,
  TAREAS_INICIALES,
  hoyISO,
  nombreUsuario,
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

export type { ConfiguracionUsuario, MensajeChat };

interface Ctx {
  usuario: string;
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

const ETIQUETA_INTENCION: Record<string, string> = {
  tarea: "Crear tarea",
  recordatorio: "Crear recordatorio",
  evento: "Agendar evento",
  automatizacion: "Crear automatización",
  memoria: "Guardar en memoria",
  consulta: "Consultar información",
  desconocida: "No identificada",
};

const CONFIG_INICIAL: ConfiguracionUsuario = {
  notificaciones: true,
  avisosRecordatorios: true,
  avisosAutomatizaciones: true,
  memoriaActiva: true,
  preferenciaVoz: false,
};

export function AsistenteProvider({ children }: { children: ReactNode }) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: "msg-welcome",
      autor: "asistente",
      texto: `¡Hola ${nombreUsuario}! Soy Dilo. Escríbeme o envíame una nota de voz: “Recuérdame mañana a las 8 enviar el informe”.`,
      tipo: "texto",
      hora: "08:00",
    },
  ]);
  const [tareas, setTareas] = useState<Tarea[]>(TAREAS_INICIALES);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>(RECORDATORIOS_INICIALES);
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS_INICIALES);
  const [memoria, setMemoria] = useState<MemoriaItem[]>(MEMORIA_INICIAL);
  const [automatizaciones, setAutomatizaciones] =
    useState<Automatizacion[]>(AUTOMATIZACIONES_INICIALES);
  const [historial, setHistorial] = useState<HistorialItem[]>(HISTORIAL_INICIAL);
  const [configuracion, setConfiguracion] = useState<ConfiguracionUsuario>(CONFIG_INICIAL);
  const [persistencia, setPersistencia] = useState<EstadoPersistencia>(
    supabaseConfigurado ? "conectado" : "memoria",
  );

  const snapshot = useRef({ tareas, recordatorios, eventos, automatizaciones, configuracion });
  snapshot.current = { tareas, recordatorios, eventos, automatizaciones, configuracion };

  useEffect(() => {
    if (!supabaseConfigurado) return;
    let cancelado = false;
    void cargarEstadoRemoto().then((remoto) => {
      if (cancelado) return;
      if (!remoto) {
        setPersistencia("error");
        return;
      }
      if (remoto.mensajes.length > 0) setMensajes(remoto.mensajes);
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
  }, []);

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
      void guardarHistorial(item);
    },
    [],
  );

  const push = useCallback((m: Omit<MensajeChat, "id" | "hora">) => {
    const item: MensajeChat = { ...m, id: nuevoId(), hora: horaAhora() };
    setMensajes((p) => [...p, item]);
    void guardarMensaje(item);
  }, []);

  const aplicarInterpretacion = useCallback(
    (texto: string, r: Interpretacion) => {
      const { tareas: tNow, recordatorios: rNow, eventos: eNow, automatizaciones: aNow, configuracion: cfg } =
        snapshot.current;

      switch (r.intencion) {
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
          };
          setAutomatizaciones((p) => [...p, auto]);
          void guardarAutomatizacion(auto);
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
          void guardarMemoria(item);
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
          void guardarEvento(evento);
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
          void guardarRecordatorio(rec);
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
            `Tareas pendientes: ${tNow.filter((t) => t.estado !== "completada").length}`,
            `Recordatorios de hoy: ${rNow.filter((x) => x.fecha === hoy).length}`,
            `Eventos próximos: ${eNow.filter((e) => e.fecha >= hoy).length}`,
            `Automatizaciones activas: ${aNow.filter((a) => a.activa).length}`,
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
              "No pude identificar qué necesitas. Intenta con “Recuérdame mañana a las 8 enviar el informe”.",
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
          void guardarTarea(tarea);
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
      const r: Interpretacion = interpretar(texto);
      const correcto = r.intencion !== "desconocida" && !r.faltaInformacion;
      const analisis = {
        intencion: ETIQUETA_INTENCION[r.intencion] ?? "No identificada",
        actividad: r.actividad || "—",
        fecha: r.fecha ? fechaLegible(r.fecha) : "No especificada",
        hora: r.hora ?? "No especificada",
        estado: correcto
          ? "Información identificada correctamente"
          : r.intencion === "desconocida"
            ? "No se identificó la intención"
            : "Falta información para completar la acción",
        correcto,
      };

      push({
        autor: "usuario",
        texto,
        tipo,
        transcripcion: tipo === "voz" ? texto : undefined,
      });

      const mostrarAnalisis = () =>
        push({
          autor: "asistente",
          texto: "Análisis de la solicitud",
          tipo: "analisis",
          analisis,
        });

      if (tipo === "voz") {
        setTimeout(() => {
          push({
            autor: "asistente",
            texto: "🎤 Audio recibido",
            tipo: "proceso",
            etapaVoz: "recibida",
          });
        }, 280);
        setTimeout(() => {
          push({
            autor: "asistente",
            texto: "Transcribiendo…",
            tipo: "proceso",
            etapaVoz: "transcribiendo",
          });
        }, 700);
        setTimeout(() => {
          push({
            autor: "asistente",
            texto: `Texto identificado: “${texto.charAt(0).toUpperCase()}${texto.slice(1)}${texto.endsWith(".") ? "" : "."}”`,
            tipo: "proceso",
            etapaVoz: "transcrito",
            transcripcion: texto,
          });
        }, 1300);
        setTimeout(() => {
          push({
            autor: "asistente",
            texto: "IA interpretando la solicitud…",
            tipo: "proceso",
            etapaVoz: "interpretando",
          });
        }, 1700);
        setTimeout(mostrarAnalisis, 2100);
        setTimeout(() => aplicarInterpretacion(texto, r), 2700);
        return;
      }

      setTimeout(mostrarAnalisis, 400);
      setTimeout(() => aplicarInterpretacion(texto, r), 1100);
    },
    [push, aplicarInterpretacion],
  );

  const valor = useMemo<Ctx>(
    () => ({
      usuario: nombreUsuario,
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
        void guardarTarea(item);
        registrar(t.titulo, "Tarea creada desde el panel");
      },
      actualizarTarea: (id, c) =>
        setTareas((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarTarea(item);
          return next;
        }),
      eliminarTarea: (id) => {
        setTareas((p) => p.filter((x) => x.id !== id));
        void borrarTarea(id);
      },
      agregarRecordatorio: (r) => {
        const item = { ...r, id: nuevoId() };
        setRecordatorios((p) => [item, ...p]);
        void guardarRecordatorio(item);
        registrar(r.actividad, "Recordatorio creado desde el panel");
      },
      actualizarRecordatorio: (id, c) =>
        setRecordatorios((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarRecordatorio(item);
          return next;
        }),
      eliminarRecordatorio: (id) => {
        setRecordatorios((p) => p.filter((x) => x.id !== id));
        void borrarRecordatorio(id);
      },
      agregarEvento: (e) => {
        const item = { ...e, id: nuevoId() };
        setEventos((p) => [item, ...p]);
        void guardarEvento(item);
        registrar(e.titulo, "Evento creado desde el panel");
      },
      actualizarEvento: (id, c) =>
        setEventos((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarEvento(item);
          return next;
        }),
      eliminarEvento: (id) => {
        setEventos((p) => p.filter((x) => x.id !== id));
        void borrarEvento(id);
      },
      agregarMemoria: (m) => {
        const item = { ...m, id: nuevoId() };
        setMemoria((p) => [item, ...p]);
        void guardarMemoria(item);
        registrar(m.informacion, "Memoria guardada");
      },
      actualizarMemoria: (id, c) =>
        setMemoria((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarMemoria(item);
          return next;
        }),
      eliminarMemoria: (id) => {
        setMemoria((p) => p.filter((x) => x.id !== id));
        void borrarMemoria(id);
      },
      limpiarMemoria: () => {
        setMemoria([]);
        void vaciarMemoria();
        registrar("Eliminar toda la memoria", "Memoria eliminada por el usuario");
      },
      agregarAutomatizacion: (a) => {
        const item = { ...a, id: nuevoId() };
        setAutomatizaciones((p) => [item, ...p]);
        void guardarAutomatizacion(item);
        registrar(a.nombre, "Automatización creada desde el panel");
      },
      actualizarAutomatizacion: (id, c) =>
        setAutomatizaciones((p) => {
          const next = p.map((x) => (x.id === id ? { ...x, ...c } : x));
          const item = next.find((x) => x.id === id);
          if (item) void guardarAutomatizacion(item);
          return next;
        }),
      eliminarAutomatizacion: (id) => {
        setAutomatizaciones((p) => p.filter((x) => x.id !== id));
        void borrarAutomatizacion(id);
      },
      actualizarConfiguracion: (c) =>
        setConfiguracion((p) => {
          const next = { ...p, ...c };
          void guardarConfiguracion(next);
          return next;
        }),
      registrar,
    }),
    [
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
