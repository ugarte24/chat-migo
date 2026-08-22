import { iaConfigurada } from "./ia";
import { esSaludoDilo } from "./asistente";

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
      parameters: {
        type: "object",
        properties: {
          motivo: { type: "string", description: "Qué quiere saber el usuario" },
        },
      },
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

function resumirAgenda(ctx: ContextoDilo) {
  return briefingPendientes(ctx);
}

export function briefingPendientes(ctx: ContextoDilo) {
  const nombre = (ctx.nombre.split(/\s+/)[0] ?? "").trim();
  const hola = nombre && !/^dilo$/i.test(nombre) ? `Hola, ${nombre}.` : "Hola.";

  const tareas = ctx.tareas.filter((t) => t.estado !== "completada" && t.estado !== "completado");
  const recs = ctx.recordatorios.filter((r) => r.estado === "pendiente" || r.estado === "activo");
  const eventos = ctx.eventos.filter(
    (e) =>
      e.fecha >= ctx.hoy &&
      e.estado !== "completado" &&
      e.estado !== "completada" &&
      e.estado !== "cancelada",
  );

  const deHoy = [
    ...tareas.filter((t) => !t.fecha || t.fecha === ctx.hoy).map((t) => t.titulo),
    ...recs.filter((r) => r.fecha === ctx.hoy).map((r) => `${r.actividad} a las ${r.hora}`),
    ...eventos
      .filter((e) => e.fecha === ctx.hoy)
      .map((e) => (e.persona ? `${e.titulo} con ${e.persona} a las ${e.hora}` : `${e.titulo} a las ${e.hora}`)),
  ];
  const proximos = [
    ...tareas.filter((t) => t.fecha && t.fecha > ctx.hoy).map((t) => `${t.titulo} el ${t.fecha}`),
    ...recs.filter((r) => r.fecha > ctx.hoy).map((r) => `${r.actividad} el ${r.fecha} a las ${r.hora}`),
    ...eventos.filter((e) => e.fecha > ctx.hoy).map((e) => `${e.titulo} el ${e.fecha}`),
  ];

  if (deHoy.length === 0 && proximos.length === 0) {
    return `${hola} No tienes pendientes por ahora. ¿En qué te ayudo?`;
  }

  const partes = [hola];
  if (deHoy.length === 0) {
    partes.push("Hoy no tienes nada marcado.");
  } else if (deHoy.length === 1) {
    partes.push(`Hoy tienes un pendiente: ${deHoy[0]}.`);
  } else {
    partes.push(`Hoy tienes ${deHoy.length} pendientes: ${deHoy.slice(0, 4).join("; ")}.`);
  }
  if (proximos.length > 0) {
    partes.push(`Más adelante: ${proximos.slice(0, 3).join("; ")}.`);
  }
  return partes.join(" ");
}

function confirmarAcciones(acciones: AccionDilo[], ctx: ContextoDilo, consultoAgenda: boolean) {
  if (consultoAgenda && acciones.length === 0) return resumirAgenda(ctx);
  const frases = acciones.map((a) => {
    switch (a.tipo) {
      case "crear_tarea":
        return `Listo, creé la tarea ${a.titulo}.`;
      case "crear_recordatorio":
        return `Te lo recuerdo el ${a.fecha} a las ${a.hora}: ${a.actividad}.`;
      case "crear_evento":
        return `Agendé ${a.titulo} el ${a.fecha} a las ${a.hora}.`;
      case "guardar_memoria":
        return `Lo recordaré: ${a.informacion}.`;
      case "crear_automatizacion":
        return `Programé ${a.accion} ${a.frecuencia} a las ${a.hora}.`;
      case "completar":
        return `Marqué eso como hecho.`;
      case "eliminar":
        return `Listo, lo eliminé.`;
      case "modificar":
        return `Listo, lo actualicé.`;
      default:
        return "Listo.";
    }
  });
  return frases.join(" ") || (consultoAgenda ? resumirAgenda(ctx) : "Listo.");
}

function sistema(ctx: ContextoDilo) {
  return `Eres Dilo, el asistente personal de ${ctx.nombre}. Hablas español, breve y natural, como un ayudante de voz: directo, calmado, útil.
Hoy es ${ctx.hoy}. Son las ${ctx.hora}.
Usas herramientas para guardar, consultar, completar, cambiar o borrar actividades. No digas que lo hiciste si no llamaste a la herramienta.
Si el usuario te saluda (hola, dilo, hey, buenas, cómo estás) o solo dice tu nombre, llama consultar_agenda y responde con un saludo corto más los pendientes de hoy. Si no hay, dilo claro.
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
  if (esSaludoDilo(mensaje)) {
    return { texto: briefingPendientes(contexto), acciones: [] };
  }

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

  try {
    const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        tools: HERRAMIENTAS,
        tool_choice: "auto",
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
    if (!msg) return { texto: "", acciones };

    const llamadas = msg.tool_calls ?? [];
    if (llamadas.length === 0) {
      return { texto: (msg.content ?? "").trim(), acciones };
    }

    let consultoAgenda = false;
    for (const llamada of llamadas) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(llamada.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      if (llamada.function.name === "consultar_agenda") consultoAgenda = true;
      ejecutarHerramienta(llamada.function.name, args, contexto, acciones);
    }

    const hablado = (msg.content ?? "").trim();
    return {
      texto: hablado || confirmarAcciones(acciones, contexto, consultoAgenda),
      acciones,
    };
  } catch {
    return { texto: "", acciones };
  }
}
