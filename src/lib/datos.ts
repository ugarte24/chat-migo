// Modelo de datos de Dilo.

export type EstadoTarea = "pendiente" | "en progreso" | "completada";
export type PrioridadTarea = "alta" | "media" | "baja";
export type EstadoSimple = "pendiente" | "completado" | "cancelado";

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string | null;
  prioridad: PrioridadTarea;
  estado: EstadoTarea;
  origen: "chat" | "panel";
}

export interface Recordatorio {
  id: string;
  actividad: string;
  fecha: string;
  hora: string;
  estado: EstadoSimple;
  activo: boolean;
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  persona: string | null;
  lugar: string;
  fecha: string;
  hora: string;
  estado: EstadoSimple;
}

export type CategoriaMemoria =
  | "Personas"
  | "Preferencias"
  | "Horarios"
  | "Actividades frecuentes"
  | "Información personalizada";

export const CATEGORIAS_MEMORIA: CategoriaMemoria[] = [
  "Personas",
  "Preferencias",
  "Horarios",
  "Actividades frecuentes",
  "Información personalizada",
];

export interface MemoriaItem {
  id: string;
  informacion: string;
  categoria: CategoriaMemoria;
  fecha: string;
}

export interface Automatizacion {
  id: string;
  nombre: string;
  accion: string;
  cuando: string;
  frecuencia: string;
  hora: string;
  activa: boolean;
  ultimaEjecucion: string | null;
}

export interface HistorialItem {
  id: string;
  fecha: string;
  hora: string;
  solicitud: string;
  accion: string;
  estado: "exitoso" | "pendiente" | "error";
}

export interface MensajeChat {
  id: string;
  autor: "usuario" | "asistente";
  texto: string;
  tipo: "texto" | "voz" | "analisis" | "confirmacion" | "error" | "aclaracion" | "proceso";
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
  etapaVoz?: "recibida" | "transcribiendo" | "transcrito" | "interpretando" | "ejecutado";
}

export interface ConfiguracionUsuario {
  notificaciones: boolean;
  avisosRecordatorios: boolean;
  avisosAutomatizaciones: boolean;
  memoriaActiva: boolean;
  preferenciaVoz: boolean;
}

export const fechaCorta = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const INTEGRACIONES = [
  { nombre: "WhatsApp Business Platform", descripcion: "Recepción y envío de mensajes y notas de voz.", estado: "Pendiente de conexión" },
  { nombre: "API de inteligencia artificial", descripcion: "ChatGPT interpreta y actúa sobre tu agenda.", estado: "Conectado con OPENAI_API_KEY" },
  { nombre: "Voz de Dilo", descripcion: "ElevenLabs TTS con Voice ID. Whisper transcribe.", estado: "ElevenLabs + OPENAI_API_KEY" },
  { nombre: "Supabase", descripcion: "Persistencia de tareas, eventos, memoria, historial y chat en el proyecto Dilo.", estado: "Conectado" },
  { nombre: "Vercel", descripcion: "Alojamiento SSR (TanStack Start + Nitro). Variables VITE_* en el dashboard del proyecto.", estado: "Listo para desplegar" },
  { nombre: "Google Calendar", descripcion: "Sincronización de eventos del usuario.", estado: "Pendiente de conexión" },
  { nombre: "Motor de automatización", descripcion: "Ejecución programada de acciones recurrentes.", estado: "Simulada" },
];

export const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

/** Calcula una próxima ejecución legible a partir de la frecuencia y hora. */
export function proximaEjecucion(frecuencia: string, hora: string): string {
  const base = new Date();
  const f = frecuencia.toLowerCase();
  const indice = DIAS_SEMANA.findIndex((d) => f.includes(d));
  const destino = new Date(base);
  if (indice >= 0) {
    const delta = (indice - base.getDay() + 7) % 7;
    destino.setDate(base.getDate() + (delta === 0 ? 7 : delta));
  } else if (f.includes("mes")) {
    destino.setMonth(base.getMonth() + 1);
  } else {
    destino.setDate(base.getDate() + 1);
  }
  const texto = destino.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}, ${hora}`;
}
