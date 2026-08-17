// Estado global del prototipo. Toda la lógica está en memoria y simula el
// backend que posteriormente será conectado (base de datos, IA, WhatsApp).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { fechaLegible, horaAhora, interpretar, uid, type Interpretacion } from "./asistente";
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
  type Evento,
  type HistorialItem,
  type MemoriaItem,
  type Recordatorio,
  type Tarea,
} from "./datos";

export interface MensajeChat {
  id: string;
  autor: "usuario" | "asistente";
  texto: string;
  tipo: "texto" | "voz" | "analisis" | "confirmacion" | "error" | "aclaracion";
  hora: string;
  analisis?: {
    intencion: string;
    actividad: string;
    fecha: string;
    hora: string;
    estado: string;
    correcto: boolean;
  };
  transcripcion?: string;
}

interface Ctx {
  usuario: string;
  mensajes: MensajeChat[];
  tareas: Tarea[];
  recordatorios: Recordatorio[];
  eventos: Evento[];
  memoria: MemoriaItem[];
  automatizaciones: Automatizacion[];
  historial: HistorialItem[];
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
  registrar: (solicitud: string, accion: string, estado?: HistorialItem["estado"]) => void;
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

export function AsistenteProvider({ children }: { children: ReactNode }) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: uid(),
      autor: "asistente",
      texto: `¡Hola ${nombreUsuario}! Soy tu Asistente Diario. Escríbeme o envíame una nota de voz: “Recuérdame mañana a las 8 enviar el informe”.`,
      tipo: "texto",
      hora: horaAhora(),
    },
  ]);
  const [tareas, setTareas] = useState<Tarea[]>(TAREAS_INICIALES);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>(RECORDATORIOS_INICIALES);
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS_INICIALES);
  const [memoria, setMemoria] = useState<MemoriaItem[]>(MEMORIA_INICIAL);
  const [automatizaciones, setAutomatizaciones] =
    useState<Automatizacion[]>(AUTOMATIZACIONES_INICIALES);
  const [historial, setHistorial] = useState<HistorialItem[]>(HISTORIAL_INICIAL);

  const registrar = useCallback(
    (solicitud: string, accion: string, estado: HistorialItem["estado"] = "exitoso") =>
      setHistorial((p) => [
        { id: uid(), fecha: hoyISO(), hora: horaAhora(), solicitud, accion, estado },
        ...p,
      ]),
    [],
  );

  const push = useCallback(
    (m: Omit<MensajeChat, "id" | "hora">) =>
      setMensajes((p) => [...p, { ...m, id: uid(), hora: horaAhora() }]),
    [],
  );

  const enviarMensaje = useCallback(
    (texto: string, tipo: "texto" | "voz") => {
      push({ autor: "usuario", texto, tipo, transcripcion: tipo === "voz" ? texto : undefined });

      const r: Interpretacion = interpretar(texto);
      const correcto = r.intencion !== "desconocida" && !r.faltaInformacion;

      setTimeout(() => {
        push({
          autor: "asistente",
          texto: "Análisis de la solicitud",
          tipo: "analisis",
          analisis: {
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
          },
        });
      }, 400);

      setTimeout(() => {
        switch (r.intencion) {
          case "automatizacion": {
            const frecuencia = r.frecuencia ?? "Todos los días";
            const hora = r.hora ?? "08:00";
            setAutomatizaciones((p) => [
              ...p,
              { id: uid(), nombre: r.actividad, accion: r.actividad, frecuencia, hora, activa: true },
            ]);
            push({
              autor: "asistente",
              texto: `✓ Automatización creada: ${frecuencia} a las ${hora} — ${r.actividad}.`,
              tipo: "confirmacion",
            });
            registrar(texto, "Automatización creada");
            break;
          }
          case "memoria": {
            const categoria: CategoriaMemoria = r.persona ? "Personas" : "Preferencias";
            setMemoria((p) => [
              ...p,
              { id: uid(), informacion: r.actividad, categoria, fecha: hoyISO() },
            ]);
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
            setEventos((p) => [
              ...p,
              {
                id: uid(),
                titulo: r.actividad,
                descripcion: "Creado desde el chat.",
                persona: r.persona,
                lugar: "Por definir",
                fecha: r.fecha!,
                hora: r.hora!,
                estado: "pendiente",
              },
            ]);
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
            setRecordatorios((p) => [
              ...p,
              {
                id: uid(),
                actividad: r.actividad,
                fecha: r.fecha!,
                hora: r.hora!,
                estado: "pendiente",
                activo: true,
              },
            ]);
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
              `Tareas pendientes: ${tareas.filter((t) => t.estado !== "completada").length}`,
              `Recordatorios de hoy: ${recordatorios.filter((x) => x.fecha === hoy).length}`,
              `Eventos próximos: ${eventos.filter((e) => e.fecha >= hoy).length}`,
              `Automatizaciones activas: ${automatizaciones.filter((a) => a.activa).length}`,
            ];
            push({ autor: "asistente", texto: `Esto es lo que tengo registrado:\n• ${lineas.join("\n• ")}`, tipo: "texto" });
            registrar(texto, "Consulta respondida");
            break;
          }
          case "desconocida": {
            push({
              autor: "asistente",
              texto: "No pude identificar qué necesitas. Intenta con “Recuérdame mañana a las 8 enviar el informe”.",
              tipo: "error",
            });
            registrar(texto, "Mensaje no interpretado", "error");
            break;
          }
          default: {
            setTareas((p) => [
              ...p,
              {
                id: uid(),
                titulo: r.actividad,
                descripcion: "Creada desde el chat.",
                fecha: r.fecha,
                prioridad: r.prioridad,
                estado: "pendiente",
                origen: "chat",
              },
            ]);
            push({
              autor: "asistente",
              texto: `✓ Tarea creada: “${r.actividad}”${r.fecha ? ` para el ${fechaLegible(r.fecha)}` : ""} (prioridad ${r.prioridad}).`,
              tipo: "confirmacion",
            });
            registrar(texto, "Tarea creada");
          }
        }
      }, 1100);
    },
    [push, registrar, tareas, recordatorios, eventos, automatizaciones],
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
      enviarMensaje,
      agregarTarea: (t) => {
        setTareas((p) => [{ ...t, id: uid() }, ...p]);
        registrar(t.titulo, "Tarea creada desde el panel");
      },
      actualizarTarea: (id, c) => setTareas((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
      eliminarTarea: (id) => setTareas((p) => p.filter((x) => x.id !== id)),
      agregarRecordatorio: (r) => {
        setRecordatorios((p) => [{ ...r, id: uid() }, ...p]);
        registrar(r.actividad, "Recordatorio creado desde el panel");
      },
      actualizarRecordatorio: (id, c) =>
        setRecordatorios((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
      eliminarRecordatorio: (id) => setRecordatorios((p) => p.filter((x) => x.id !== id)),
      agregarEvento: (e) => {
        setEventos((p) => [{ ...e, id: uid() }, ...p]);
        registrar(e.titulo, "Evento creado desde el panel");
      },
      actualizarEvento: (id, c) => setEventos((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
      eliminarEvento: (id) => setEventos((p) => p.filter((x) => x.id !== id)),
      agregarMemoria: (m) => {
        setMemoria((p) => [{ ...m, id: uid() }, ...p]);
        registrar(m.informacion, "Memoria guardada");
      },
      actualizarMemoria: (id, c) => setMemoria((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
      eliminarMemoria: (id) => setMemoria((p) => p.filter((x) => x.id !== id)),
      limpiarMemoria: () => {
        setMemoria([]);
        registrar("Eliminar toda la memoria", "Memoria eliminada por el usuario");
      },
      agregarAutomatizacion: (a) => {
        setAutomatizaciones((p) => [{ ...a, id: uid() }, ...p]);
        registrar(a.nombre, "Automatización creada desde el panel");
      },
      actualizarAutomatizacion: (id, c) =>
        setAutomatizaciones((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
      eliminarAutomatizacion: (id) => setAutomatizaciones((p) => p.filter((x) => x.id !== id)),
      registrar,
    }),
    [mensajes, tareas, recordatorios, eventos, memoria, automatizaciones, historial, enviarMensaje, registrar],
  );

  return <AsistenteContext.Provider value={valor}>{children}</AsistenteContext.Provider>;
}

export function useAsistente() {
  const ctx = useContext(AsistenteContext);
  if (!ctx) throw new Error("useAsistente debe usarse dentro de AsistenteProvider");
  return ctx;
}
