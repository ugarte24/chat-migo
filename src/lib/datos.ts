// Modelo de datos y datos simulados del prototipo "Dilo".
// Preparado para ser sustituido más adelante por una base de datos real.

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

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  numero: string;
  registro: string;
  estado: "activo" | "inactivo" | "suspendido";
  actividades: number;
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

export const desplazarDias = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const nombreUsuario = "Gustavo";

export const TAREAS_INICIALES: Tarea[] = [
  {
    id: "id-1",
    titulo: "Enviar el informe mensual",
    descripcion: "Adjuntar el resumen de actividades y enviarlo por correo.",
    fecha: hoyISO(),
    prioridad: "alta",
    estado: "en progreso",
    origen: "chat",
  },
  {
    id: "id-2",
    titulo: "Comprar materiales de oficina",
    descripcion: "Hojas, marcadores y carpetas para el proyecto.",
    fecha: desplazarDias(1),
    prioridad: "media",
    estado: "pendiente",
    origen: "chat",
  },
  {
    id: "id-3",
    titulo: "Revisar el presupuesto del proyecto",
    descripcion: "Validar los montos con el área administrativa.",
    fecha: desplazarDias(3),
    prioridad: "alta",
    estado: "pendiente",
    origen: "panel",
  },
  {
    id: "id-4",
    titulo: "Actualizar la documentación del sistema",
    descripcion: "Incluir los nuevos módulos del prototipo.",
    fecha: desplazarDias(-2),
    prioridad: "baja",
    estado: "completada",
    origen: "panel",
  },
];

export const RECORDATORIOS_INICIALES: Recordatorio[] = [
  {
    id: "id-5",
    actividad: "Llevar los documentos a la oficina",
    fecha: hoyISO(),
    hora: "08:00",
    estado: "pendiente",
    activo: true,
  },
  {
    id: "id-6",
    actividad: "Tomar la medicación",
    fecha: hoyISO(),
    hora: "21:00",
    estado: "pendiente",
    activo: true,
  },
  {
    id: "id-7",
    actividad: "Llamar al banco",
    fecha: desplazarDias(2),
    hora: "10:30",
    estado: "pendiente",
    activo: true,
  },
  {
    id: "id-8",
    actividad: "Pagar el servicio de internet",
    fecha: desplazarDias(-1),
    hora: "09:00",
    estado: "completado",
    activo: false,
  },
];

export const EVENTOS_INICIALES: Evento[] = [
  {
    id: "id-9",
    titulo: "Reunión con Carlos",
    descripcion: "Revisión del avance del proyecto.",
    persona: "Carlos",
    lugar: "Sala 2 — Oficina central",
    fecha: desplazarDias(2),
    hora: "15:00",
    estado: "pendiente",
  },
  {
    id: "id-10",
    titulo: "Consulta médica",
    descripcion: "Control anual.",
    persona: null,
    lugar: "Clínica San Lucas",
    fecha: desplazarDias(5),
    hora: "11:00",
    estado: "pendiente",
  },
  {
    id: "id-11",
    titulo: "Defensa del proyecto",
    descripcion: "Presentación final del sistema.",
    persona: "Docente",
    lugar: "Aula 305",
    fecha: desplazarDias(9),
    hora: "09:30",
    estado: "pendiente",
  },
];

export const MEMORIA_INICIAL: MemoriaItem[] = [
  {
    id: "id-12",
    informacion: "Carlos es mi compañero de proyecto y coordinamos los viernes.",
    categoria: "Personas",
    fecha: desplazarDias(-12),
  },
  {
    id: "id-13",
    informacion: "Prefiero recibir los recordatorios por nota de voz.",
    categoria: "Preferencias",
    fecha: desplazarDias(-9),
  },
  {
    id: "id-14",
    informacion: "Trabajo de 08:00 a 17:00 de lunes a viernes.",
    categoria: "Horarios",
    fecha: desplazarDias(-9),
  },
  {
    id: "id-15",
    informacion: "Todos los lunes reviso mis tareas pendientes.",
    categoria: "Actividades frecuentes",
    fecha: desplazarDias(-6),
  },
  {
    id: "id-16",
    informacion: "Mi número de contacto alterno termina en 4821.",
    categoria: "Información personalizada",
    fecha: desplazarDias(-3),
  },
];

export const AUTOMATIZACIONES_INICIALES: Automatizacion[] = [
  {
    id: "id-17",
    nombre: "Reporte semanal",
    accion: "Enviar recordatorio para realizar el reporte.",
    cuando: "Viernes",
    frecuencia: "Todos los viernes",
    hora: "17:00",
    activa: true,
  },
  {
    id: "id-18",
    nombre: "Revisión de tareas",
    accion: "Enviar la lista de tareas pendientes del día.",
    cuando: "Lunes",
    frecuencia: "Todos los lunes",
    hora: "09:00",
    activa: true,
  },
  {
    id: "id-19",
    nombre: "Resumen diario",
    accion: "Enviar el resumen de actividades del día siguiente.",
    cuando: "Cada noche",
    frecuencia: "Todos los días",
    hora: "20:00",
    activa: false,
  },
];

export const HISTORIAL_INICIAL: HistorialItem[] = [
  {
    id: "id-20",
    fecha: hoyISO(),
    hora: "08:00",
    solicitud: "Recuérdame llevar los documentos",
    accion: "Recordatorio enviado",
    estado: "exitoso",
  },
  {
    id: "id-21",
    fecha: hoyISO(),
    hora: "07:30",
    solicitud: "¿Qué tareas tengo para hoy?",
    accion: "Consulta respondida",
    estado: "exitoso",
  },
  {
    id: "id-22",
    fecha: desplazarDias(-1),
    hora: "17:00",
    solicitud: "Automatización “Reporte semanal”",
    accion: "Automatización ejecutada",
    estado: "exitoso",
  },
  {
    id: "id-23",
    fecha: desplazarDias(-1),
    hora: "12:10",
    solicitud: "Agenda una reunión",
    accion: "Se solicitó aclaración de fecha y hora",
    estado: "pendiente",
  },
  {
    id: "id-24",
    fecha: desplazarDias(-2),
    hora: "19:45",
    solicitud: "Nota de voz sin audio audible",
    accion: "No se pudo transcribir el audio",
    estado: "error",
  },
];

export const USUARIOS_ADMIN: UsuarioAdmin[] = [
  { id: "id-25", nombre: "Gustavo Ugarte", numero: "+591 700 12345", registro: desplazarDias(-45), estado: "activo", actividades: 128 },
  { id: "id-26", nombre: "Carlos Mamani", numero: "+591 712 98765", registro: desplazarDias(-38), estado: "activo", actividades: 94 },
  { id: "id-27", nombre: "María Fernández", numero: "+591 767 45612", registro: desplazarDias(-30), estado: "activo", actividades: 76 },
  { id: "id-28", nombre: "Luis Quispe", numero: "+591 733 11223", registro: desplazarDias(-21), estado: "inactivo", actividades: 12 },
  { id: "id-29", nombre: "Ana Rojas", numero: "+591 750 33445", registro: desplazarDias(-10), estado: "activo", actividades: 41 },
  { id: "id-30", nombre: "Pedro Salazar", numero: "+591 799 55667", registro: desplazarDias(-4), estado: "suspendido", actividades: 3 },
];

export const ACTIVIDAD_ADMIN = [
  { id: "id-31", usuario: "Gustavo Ugarte", accion: "Creó un recordatorio por nota de voz", fecha: `${hoyISO()} 08:02`, estado: "exitoso" as const },
  { id: "id-32", usuario: "María Fernández", accion: "Activó la automatización “Resumen diario”", fecha: `${hoyISO()} 07:44`, estado: "exitoso" as const },
  { id: "id-33", usuario: "Carlos Mamani", accion: "Consultó su agenda del día", fecha: `${hoyISO()} 07:15`, estado: "exitoso" as const },
  { id: "id-34", usuario: "Luis Quispe", accion: "Mensaje no interpretado", fecha: `${desplazarDias(-1)} 22:31`, estado: "error" as const },
  { id: "id-35", usuario: "Ana Rojas", accion: "Guardó información en memoria", fecha: `${desplazarDias(-1)} 18:05`, estado: "exitoso" as const },
];

export const INTEGRACIONES = [
  { nombre: "WhatsApp Business Platform", descripcion: "Recepción y envío de mensajes y notas de voz.", estado: "Pendiente de conexión" },
  { nombre: "API de inteligencia artificial", descripcion: "Interpretación de lenguaje natural e intenciones.", estado: "Simulada" },
  { nombre: "Reconocimiento de voz", descripcion: "Transcripción de notas de voz a texto.", estado: "Simulada" },
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
