import { iaConfigurada } from "./ia";

export type PrioridadDilo = "alta" | "media" | "baja";

export type AccionDilo =
  | { tipo: "crear_tarea"; titulo: string; fecha: string | null; prioridad: PrioridadDilo }
  | { tipo: "crear_recordatorio"; actividad: string; fecha: string; hora: string }
  | { tipo: "crear_evento"; titulo: string; fecha: string; hora: string; persona: string | null }
  | { tipo: "guardar_memoria"; informacion: string; categoria: string }
  | { tipo: "crear_automatizacion"; accion: string; frecuencia: string; hora: string }
  | {
      tipo: "completar";
      entidad: "tarea" | "recordatorio" | "evento";
      consulta: string;
    }
  | {
      tipo: "eliminar";
      entidad: "tarea" | "recordatorio" | "evento" | "memoria" | "automatizacion";
      consulta: string;
    }
  | {
      tipo: "modificar";
      entidad: "tarea" | "recordatorio" | "evento";
      consulta: string;
      fecha: string | null;
      hora: string | null;
    };

export interface ContextoDilo {
  nombre: string;
  hoy: string;
  hora: string;
  memoriaActiva: boolean;
  tareas: { id: string; titulo: string; fecha: string | null; prioridad: string; estado: string }[];
  recordatorios: { id: string; actividad: string; fecha: string; hora: string; estado: string }[];
  eventos: { id: string; titulo: string; persona: string | null; fecha: string; hora: string; estado: string }[];
  memoria: { id: string; informacion: string; categoria: string }[];
  automatizaciones: { id: string; nombre: string; frecuencia: string; hora: string; activa: boolean }[];
}

export interface MensajeDilo {
  role: "user" | "assistant";
  content: string;
}

export interface TurnoDilo {
  texto: string;
  acciones: AccionDilo[];
}

function claveOpenAi() {
  if (typeof process === "undefined" || process.env == null) return "";
  return process.env["OPENAI_API_KEY"]?.trim() ?? "";
}

const HERRAMIENTAS = [
  {
    type: "function",
    function: {
      name: "consultar_agenda",
      description: "Consulta tareas, recordatorios, eventos, memoria y automatizaciones del usuario.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_tarea",
      description: "Crea una tarea. Usa fecha null si no hay plazo.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          fecha: { type: "string", description: "YYYY-MM-DD o vacío" },
          prioridad: { type: "string", enum: ["alta", "media", "baja"] },
        },
        required: ["titulo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_recordatorio",
      description: "Crea un recordatorio con fecha y hora concretas.",
      parameters: {
        type: "object",
        properties: {
          actividad: { type: "string" },
          fecha: { type: "string", description: "YYYY-MM-DD" },
          hora: { type: "string", description: "HH:MM en 24 horas" },
        },
        required: ["actividad", "fecha", "hora"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_evento",
      description: "Agenda un evento o reunión.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          fecha: { type: "string" },
          hora: { type: "string" },
          persona: { type: "string" },
        },
        required: ["titulo", "fecha", "hora"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "guardar_memoria",
      description: "Guarda un dato que el usuario quiere que recuerdes.",
      parameters: {
        type: "object",
        properties: {
          informacion: { type: "string" },
          categoria: {
            type: "string",
            enum: ["Personas", "Preferencias", "Horarios", "Actividades frecuentes", "Información personalizada"],
          },
        },
        required: ["informacion"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_automatizacion",
      description: "Programa una acción recurrente.",
      parameters: {
        type: "object",
        properties: {
          accion: { type: "string" },
          frecuencia: { type: "string", description: "Ej. Todos los días, Todos los lunes" },
          hora: { type: "string" },
        },
        required: ["accion", "frecuencia", "hora"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "completar",
      description: "Marca como hecha una tarea, recordatorio o evento.",
      parameters: {
        type: "object",
        properties: {
          entidad: { type: "string", enum: ["tarea", "recordatorio", "evento"] },
          consulta: { type: "string", description: "Texto para identificar el ítem" },
        },
        required: ["entidad", "consulta"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "eliminar",
      description: "Elimina un ítem de la agenda o un recuerdo.",
      parameters: {
        type: "object",
        properties: {
          entidad: {
            type: "string",
            enum: ["tarea", "recordatorio", "evento", "memoria", "automatizacion"],
          },
          consulta: { type: "string" },
        },
        required: ["entidad", "consulta"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "modificar",
      description: "Cambia fecha u hora de una tarea, recordatorio o evento.",
      parameters: {
        type: "object",
        properties: {
          entidad: { type: "string", enum: ["tarea", "recordatorio", "evento"] },
          consulta: { type: "string" },
          fecha: { type: "string" },
          hora: { type: "string" },
        },
        required: ["entidad", "consulta"],
      },
    },
  },
] as const;

function sistema(ctx: ContextoDilo) {
  return `Eres Dilo, el asistente personal de ${ctx.nombre}. Hablas español, breve y natural, como un ayudante de voz: directo, calmado, útil.
Hoy es ${ctx.hoy}. Son las ${ctx.hora}.
Usas herramientas para guardar, consultar, completar, cambiar o borrar actividades. No digas que lo hiciste si no llamaste a la herramienta.
${ctx.memoriaActiva ? "Puedes guardar recuerdos si el usuario te lo pide." : "La memoria está desactivada: no guardes recuerdos."}
Responde para ser escuchado en voz alta: frases cortas, sin markdown, sin listas con asteriscos.`;
}

function prioridad(valor: unknown): PrioridadDilo {
  return valor === "alta" || valor === "baja" ? valor : "media";
}

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function ejecutarHerramienta(
  nombre: string,
  args: Record<string, unknown>,
  ctx: ContextoDilo,
  acciones: AccionDilo[],
): string {
  switch (nombre) {
    case "consultar_agenda":
      return JSON.stringify({
        tareas: ctx.tareas,
        recordatorios: ctx.recordatorios,
        eventos: ctx.eventos,
        memoria: ctx.memoriaActiva ? ctx.memoria : [],
        automatizaciones: ctx.automatizaciones,
      });
    case "crear_tarea": {
      const titulo = texto(args["titulo"]);
      if (!titulo) return "Falta el título.";
      acciones.push({
        tipo: "crear_tarea",
        titulo,
        fecha: texto(args["fecha"]) || null,
        prioridad: prioridad(args["prioridad"]),
      });
      return "Tarea creada.";
    }
    case "crear_recordatorio": {
      const actividad = texto(args["actividad"]);
      const fecha = texto(args["fecha"]);
      const hora = texto(args["hora"]);
      if (!actividad || !fecha || !hora) return "Faltan actividad, fecha u hora.";
      acciones.push({ tipo: "crear_recordatorio", actividad, fecha, hora });
      return "Recordatorio creado.";
    }
    case "crear_evento": {
      const titulo = texto(args["titulo"]);
      const fecha = texto(args["fecha"]);
      const hora = texto(args["hora"]);
      if (!titulo || !fecha || !hora) return "Faltan título, fecha u hora.";
      acciones.push({
        tipo: "crear_evento",
        titulo,
        fecha,
        hora,
        persona: texto(args["persona"]) || null,
      });
      return "Evento agendado.";
    }
    case "guardar_memoria": {
      if (!ctx.memoriaActiva) return "La memoria está desactivada.";
      const informacion = texto(args["informacion"]);
      if (!informacion) return "Falta la información.";
      acciones.push({
        tipo: "guardar_memoria",
        informacion,
        categoria: texto(args["categoria"]) || "Información personalizada",
      });
      return "Recuerdo guardado.";
    }
    case "crear_automatizacion": {
      const accion = texto(args["accion"]);
      const frecuencia = texto(args["frecuencia"]);
      const hora = texto(args["hora"]);
      if (!accion || !frecuencia || !hora) return "Faltan acción, frecuencia u hora.";
      acciones.push({ tipo: "crear_automatizacion", accion, frecuencia, hora });
      return "Automatización creada.";
    }
    case "completar": {
      const entidad = texto(args["entidad"]);
      const consulta = texto(args["consulta"]);
      if (entidad !== "tarea" && entidad !== "recordatorio" && entidad !== "evento") {
        return "Entidad no válida.";
      }
      if (!consulta) return "Falta qué completar.";
      acciones.push({ tipo: "completar", entidad, consulta });
      return "Marcado como completado.";
    }
    case "eliminar": {
      const entidad = texto(args["entidad"]);
      const consulta = texto(args["consulta"]);
      if (
        entidad !== "tarea" &&
        entidad !== "recordatorio" &&
        entidad !== "evento" &&
        entidad !== "memoria" &&
        entidad !== "automatizacion"
      ) {
        return "Entidad no válida.";
      }
      if (!consulta) return "Falta qué eliminar.";
      acciones.push({ tipo: "eliminar", entidad, consulta });
      return "Eliminado.";
    }
    case "modificar": {
      const entidad = texto(args["entidad"]);
      const consulta = texto(args["consulta"]);
      if (entidad !== "tarea" && entidad !== "recordatorio" && entidad !== "evento") {
        return "Entidad no válida.";
      }
      if (!consulta) return "Falta qué modificar.";
      acciones.push({
        tipo: "modificar",
        entidad,
        consulta,
        fecha: texto(args["fecha"]) || null,
        hora: texto(args["hora"]) || null,
      });
      return "Actualizado.";
    }
    default:
      return "Herramienta desconocida.";
  }
}

interface MensajeApi {
  role: string;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
}

export async function conversarConDilo(
  mensaje: string,
  historial: MensajeDilo[],
  contexto: ContextoDilo,
): Promise<TurnoDilo> {
  const clave = claveOpenAi();
  if (!clave || !iaConfigurada()) {
    return { texto: "", acciones: [] };
  }

  const mensajes: MensajeApi[] = [
    { role: "system", content: sistema(contexto) },
    ...historial.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: mensaje },
  ];

  const acciones: AccionDilo[] = [];

  for (let i = 0; i < 6; i++) {
    const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        tools: HERRAMIENTAS,
        messages: mensajes,
      }),
    });
    if (!respuesta.ok) {
      return { texto: "", acciones };
    }
    const cuerpo = (await respuesta.json()) as {
      choices?: { message?: MensajeApi }[];
    };
    const msg = cuerpo.choices?.[0]?.message;
    if (!msg) break;

    const llamadas = msg.tool_calls ?? [];
    if (llamadas.length === 0) {
      return { texto: (msg.content ?? "").trim(), acciones };
    }

    mensajes.push({
      role: "assistant",
      content: msg.content ?? "",
      tool_calls: llamadas,
    });

    for (const llamada of llamadas) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(llamada.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      const resultado = ejecutarHerramienta(llamada.function.name, args, contexto, acciones);
      mensajes.push({
        role: "tool",
        tool_call_id: llamada.id,
        content: resultado,
      });
    }
  }

  return { texto: "Listo.", acciones };
}
