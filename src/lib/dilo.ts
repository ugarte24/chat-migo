import { geminiConfigurado } from "./ia";
import { esSaludoDilo, interpretar, normalizar, type Interpretacion } from "./asistente";
import { secreto } from "./secretos";
import { nombreDePila } from "./utils";

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

export type EventoDilo = { tipo: "delta"; texto: string } | { tipo: "listo"; turno: TurnoDilo };

function claveGemini() {
  return secreto("GEMINI_API_KEY");
}

function claveOpenAi() {
  return secreto("OPENAI_API_KEY");
}

const HERRAMIENTAS = [
  {
    type: "function",
    function: {
      name: "consultar_agenda",
      description: "Consulta el detalle de la agenda. Úsala si pregunta qué tiene pendiente, hoy o más adelante. No la uses solo para charlar.",
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
  const pila = nombreDePila(ctx.nombre);
  const hola = pila ? `Hola, ${pila}.` : "Hola.";

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

function paraVoz(texto: string) {
  return texto.replace(/\s+/g, " ").trim();
}

function primerNombre(ctx: ContextoDilo) {
  return nombreDePila(ctx.nombre);
}

function resumenAgendaSistema(ctx: ContextoDilo) {
  const tareas = ctx.tareas.filter((t) => t.estado !== "completada" && t.estado !== "completado");
  const recs = ctx.recordatorios.filter((r) => r.estado === "pendiente" || r.estado === "activo");
  const eventos = ctx.eventos.filter(
    (e) => e.fecha >= ctx.hoy && e.estado !== "completado" && e.estado !== "completada" && e.estado !== "cancelada",
  );
  const lineas = [
    tareas.length ? `Tareas: ${tareas.slice(0, 8).map((t) => t.titulo).join("; ")}` : "Sin tareas pendientes.",
    recs.length
      ? `Recordatorios: ${recs.slice(0, 6).map((r) => `${r.actividad} (${r.fecha} ${r.hora})`).join("; ")}`
      : "Sin recordatorios.",
    eventos.length
      ? `Eventos: ${eventos.slice(0, 6).map((e) => `${e.titulo} (${e.fecha} ${e.hora})`).join("; ")}`
      : "Sin eventos próximos.",
  ];
  if (ctx.memoriaActiva && ctx.memoria.length > 0) {
    lineas.push(`Recuerdos: ${ctx.memoria.slice(0, 8).map((m) => m.informacion).join("; ")}.`);
  }
  return lineas.join(" ");
}

function sistema(ctx: ContextoDilo) {
  const quien = primerNombre(ctx);
  const deQuien = quien ? `de ${quien}` : "personal";
  return `Eres Dilo, el asistente ${deQuien}. No eres un clasificador de comandos ni un formulario. Eres alguien de confianza que habla por voz: cercano, concreto, con calma.

Hoy es ${ctx.hoy}. Son las ${ctx.hora}.

Cómo te comportas:
- Conversas como una persona. Saludas, preguntas, das ánimo, opinas con sentido común y sigues el hilo.
- Tuteas. Frases cortas, pensadas para escucharse en voz alta. Sin markdown, sin asteriscos, sin menús numerados.
- ${quien ? `Lo llamas solo ${quien}. Nunca uses su apellido ni el nombre completo.` : "No inventes un nombre. Si no sabes cómo se llama, no lo nombres."}
- Si pide anotar, recordar, agendar, completar, cambiar o borrar, USA la herramienta. Nunca finjas que lo hiciste.
- Si falta un dato (fecha, hora, cuál ítem), pregunta una sola cosa, como lo haría un asistente humano.
- Si solo quiere hablar, habla. Nunca le pidas que use una frase modelo ni le digas que no identificaste la intención.
- Si pregunta quién eres o qué puedes hacer, explícalo en una o dos frases naturales.

Contexto de su día:
${resumenAgendaSistema(ctx)}
${ctx.memoriaActiva ? "Puedes guardar recuerdos si te lo pide." : "La memoria está desactivada: no guardes recuerdos."}`;
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

function declaracionesGemini() {
  return HERRAMIENTAS.map((h) => ({
    name: h.function.name,
    description: h.function.description,
    parameters: h.function.parameters,
  }));
}

interface ParteGemini {
  text?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

const MODELOS_GEMINI = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.6-flash",
];

type ContenidoGemini = { role: string; parts: ParteGemini[] };

function cuerpoGemini(contents: ContenidoGemini[], contexto: ContextoDilo) {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: sistema(contexto) }] },
    contents,
    tools: [{ functionDeclarations: declaracionesGemini() }],
    toolConfig: { functionCallingConfig: { mode: "AUTO" } },
    generationConfig: { temperature: 0.65 },
  });
}

async function pedirGemini(modelo: string, clave: string, contents: ContenidoGemini[], contexto: ContextoDilo) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": clave,
    },
    signal: AbortSignal.timeout(14_000),
    body: cuerpoGemini(contents, contexto),
  });
}

async function pedirGeminiFlujo(modelo: string, clave: string, contents: ContenidoGemini[], contexto: ContextoDilo) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": clave,
      },
      signal: AbortSignal.timeout(4_000),
      body: cuerpoGemini(contents, contexto),
    },
  );
}

async function* datosSse(res: Response): AsyncGenerator<string> {
  const lector = res.body?.getReader();
  if (!lector) return;
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await lector.read();
    if (done) break;
    buf += dec.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let corte = buf.indexOf("\n\n");
    while (corte >= 0) {
      const bloque = buf.slice(0, corte);
      buf = buf.slice(corte + 2);
      for (const linea of bloque.split("\n")) {
        const t = linea.trim();
        if (t.startsWith("data:")) {
          const dato = t.slice(5).trim();
          if (dato) yield dato;
        }
      }
      corte = buf.indexOf("\n\n");
    }
  }
  const resto = buf.trim();
  if (resto.startsWith("data:")) {
    const dato = resto.slice(5).trim();
    if (dato) yield dato;
  }
}

function partesGemini(cuerpo: { candidates?: { content?: { parts?: ParteGemini[] } }[] }) {
  return cuerpo.candidates?.[0]?.content?.parts ?? [];
}

async function* emitirPorPalabras(texto: string): AsyncGenerator<EventoDilo> {
  const trozos = texto.split(/(\s+)/).filter((t) => t.length > 0);
  for (const t of trozos) {
    yield { tipo: "delta", texto: t };
    await new Promise((r) => setTimeout(r, 16));
  }
}

async function* fluirGeminiUna(
  modelo: string,
  clave: string,
  contents: ContenidoGemini[],
  contexto: ContextoDilo,
): AsyncGenerator<EventoDilo, { partes: ParteGemini[]; texto: string } | null> {
  try {
    const respuesta = await pedirGeminiFlujo(modelo, clave, contents, contexto);
    if (respuesta.status === 404) return null;
    if (respuesta.ok) {
      const partes: ParteGemini[] = [];
      let texto = "";
      for await (const dato of datosSse(respuesta)) {
        if (dato === "[DONE]") continue;
        let cuerpo: { candidates?: { content?: { parts?: ParteGemini[] } }[] };
        try {
          cuerpo = JSON.parse(dato) as typeof cuerpo;
        } catch {
          continue;
        }
        for (const parte of partesGemini(cuerpo)) {
          partes.push(parte);
          if (parte.text) {
            const nuevo = parte.text;
            if (nuevo.startsWith(texto)) {
              const extra = nuevo.slice(texto.length);
              texto = nuevo;
              if (extra) yield { tipo: "delta", texto: extra };
            } else {
              texto += nuevo;
              yield { tipo: "delta", texto: nuevo };
            }
          }
        }
      }
      if (texto || partes.some((p) => p.functionCall?.name)) return { partes, texto };
    } else {
      const detalle = await respuesta.text().catch(() => "");
      console.error("gemini", modelo, respuesta.status, detalle.slice(0, 240));
      if (respuesta.status !== 400 && respuesta.status !== 429 && respuesta.status < 500) {
        return { partes: [], texto: "" };
      }
    }
  } catch (error) {
    console.error("gemini stream", modelo, error);
  }

  try {
    const respuesta = await pedirGemini(modelo, clave, contents, contexto);
    if (respuesta.status === 404) return null;
    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      console.error("gemini", modelo, respuesta.status, detalle.slice(0, 240));
      if (respuesta.status === 400 || respuesta.status === 429 || respuesta.status >= 500) return null;
      return { partes: [], texto: "" };
    }
    const cuerpo = (await respuesta.json()) as {
      candidates?: { content?: { parts?: ParteGemini[] } }[];
    };
    const partes = partesGemini(cuerpo);
    const texto = partes.map((p) => p.text ?? "").join("");
    if (texto) yield* emitirPorPalabras(texto);
    return { partes, texto };
  } catch (error) {
    console.error("gemini", modelo, error);
    return null;
  }
}

async function* fluirGemini(
  mensaje: string,
  historial: MensajeDilo[],
  contexto: ContextoDilo,
): AsyncGenerator<EventoDilo, TurnoDilo> {
  const clave = claveGemini();
  if (!clave) return { texto: "", acciones: [] };

  const contents: ContenidoGemini[] = [
    ...historial.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }] as ParteGemini[],
    })),
    { role: "user", parts: [{ text: mensaje }] },
  ];

  for (const modelo of MODELOS_GEMINI) {
    try {
      const acciones: AccionDilo[] = [];
      const gen = fluirGeminiUna(modelo, clave, contents, contexto);
      let primero: { partes: ParteGemini[]; texto: string } | null = null;
      while (true) {
        const paso = await gen.next();
        if (paso.done) {
          primero = paso.value;
          break;
        }
        yield paso.value;
      }
      if (!primero) continue;
      if (!primero.texto && !primero.partes.some((p) => p.functionCall?.name)) continue;

      let hablado = primero.texto;
      let consultoAgenda = false;
      const llamadas: { name: string; args: Record<string, unknown>; resultado: string }[] = [];
      for (const parte of primero.partes) {
        const llamada = parte.functionCall;
        if (!llamada?.name) continue;
        if (llamada.name === "consultar_agenda") consultoAgenda = true;
        const resultado = ejecutarHerramienta(llamada.name, llamada.args ?? {}, contexto, acciones);
        llamadas.push({ name: llamada.name, args: llamada.args ?? {}, resultado });
      }

      if (llamadas.length > 0) {
        const segunda = fluirGeminiUna(
          modelo,
          clave,
          [
            ...contents,
            { role: "model", parts: primero.partes },
            {
              role: "user",
              parts: llamadas.map((l) => ({
                functionResponse: {
                  name: l.name,
                  response: { resultado: l.resultado },
                },
              })),
            },
          ],
          contexto,
        );
        while (true) {
          const paso = await segunda.next();
          if (paso.done) {
            if (paso.value?.texto) hablado = paso.value.texto;
            break;
          }
          yield paso.value;
        }
      }

      const turno: TurnoDilo = {
        texto: paraVoz(hablado || confirmarAcciones(acciones, contexto, consultoAgenda)),
        acciones,
      };
      yield { tipo: "listo", turno };
      return turno;
    } catch (error) {
      console.error("gemini", modelo, error);
    }
  }
  return { texto: "", acciones: [] };
}

async function* fluirOpenAi(
  mensaje: string,
  historial: MensajeDilo[],
  contexto: ContextoDilo,
): AsyncGenerator<EventoDilo, TurnoDilo> {
  const clave = claveOpenAi();
  if (clave.length < 10) return { texto: "", acciones: [] };

  const mensajes: MensajeApi[] = [
    { role: "system", content: sistema(contexto) },
    ...historial.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: mensaje },
  ];
  const acciones: AccionDilo[] = [];

  const leer = async (cuerpo: Record<string, unknown>) => {
    const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(24_000),
      body: JSON.stringify({ ...cuerpo, stream: true }),
    });
    return respuesta;
  };

  try {
    const respuesta = await leer({
      model: "gpt-4o-mini",
      temperature: 0.65,
      tools: HERRAMIENTAS,
      tool_choice: "auto",
      messages: mensajes,
    });
    if (!respuesta.ok) return { texto: "", acciones };

    let hablado = "";
    const tools: { id: string; name: string; arguments: string }[] = [];
    for await (const dato of datosSse(respuesta)) {
      if (dato === "[DONE]") break;
      let json: {
        choices?: {
          delta?: {
            content?: string | null;
            tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[];
          };
        }[];
      };
      try {
        json = JSON.parse(dato) as typeof json;
      } catch {
        continue;
      }
      const delta = json.choices?.[0]?.delta;
      if (delta?.content) {
        hablado += delta.content;
        yield { tipo: "delta", texto: delta.content };
      }
      for (const llamada of delta?.tool_calls ?? []) {
        const i = llamada.index;
        const actual = tools[i] ?? { id: "", name: "", arguments: "" };
        if (llamada.id) actual.id = llamada.id;
        if (llamada.function?.name) actual.name = llamada.function.name;
        if (llamada.function?.arguments) actual.arguments += llamada.function.arguments;
        tools[i] = actual;
      }
    }

    let consultoAgenda = false;
    if (tools.length > 0) {
      for (const llamada of tools) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(llamada.arguments || "{}") as Record<string, unknown>;
        } catch {
          args = {};
        }
        if (llamada.name === "consultar_agenda") consultoAgenda = true;
        ejecutarHerramienta(llamada.name, args, contexto, acciones);
      }
    }

    const turno: TurnoDilo = {
      texto: paraVoz(hablado || confirmarAcciones(acciones, contexto, consultoAgenda)),
      acciones,
    };
    yield { tipo: "listo", turno };
    return turno;
  } catch {
    return { texto: "", acciones };
  }
}

export async function* fluirDilo(
  mensaje: string,
  historial: MensajeDilo[],
  contexto: ContextoDilo,
): AsyncGenerator<EventoDilo> {
  if (geminiConfigurado()) {
    const gen = fluirGemini(mensaje, historial, contexto);
    while (true) {
      const paso = await gen.next();
      if (paso.done) {
        if (paso.value.texto || paso.value.acciones.length > 0) return;
        break;
      }
      yield paso.value;
      if (paso.value.tipo === "listo") return;
    }
  }

  const genGpt = fluirOpenAi(mensaje, historial, contexto);
  while (true) {
    const paso = await genGpt.next();
    if (paso.done) {
      if (paso.value.texto || paso.value.acciones.length > 0) {
        if (paso.value.texto) yield { tipo: "delta", texto: paso.value.texto };
        yield { tipo: "listo", turno: paso.value };
        return;
      }
      break;
    }
    yield paso.value;
    if (paso.value.tipo === "listo") return;
  }

  const local = turnoLocal(mensaje, contexto);
  if (local.texto) yield { tipo: "delta", texto: local.texto };
  yield { tipo: "listo", turno: local };
}

export async function conversarConDilo(
  mensaje: string,
  historial: MensajeDilo[],
  contexto: ContextoDilo,
): Promise<TurnoDilo> {
  let turno: TurnoDilo = { texto: "", acciones: [] };
  for await (const ev of fluirDilo(mensaje, historial, contexto)) {
    if (ev.tipo === "listo") turno = ev.turno;
  }
  return turno.texto || turno.acciones.length > 0 ? turno : turnoLocal(mensaje, contexto);
}

export function turnoLocal(mensaje: string, contexto: ContextoDilo): TurnoDilo {
  if (esSaludoDilo(mensaje)) {
    return { texto: briefingPendientes(contexto), acciones: [] };
  }

  const r = interpretar(mensaje);
  if (r.intencion === "consulta") {
    return { texto: briefingPendientes(contexto), acciones: [] };
  }

  const acciones = accionesDesdeInterpretacion(r);
  if (acciones.length > 0) {
    return { texto: confirmarAcciones(acciones, contexto, false), acciones };
  }
  if (r.intencion !== "desconocida") {
    return { texto: aclaracionNatural(r), acciones: [] };
  }
  return { texto: charlaLocal(mensaje, contexto), acciones: [] };
}

function accionesDesdeInterpretacion(r: Interpretacion): AccionDilo[] {
  switch (r.intencion) {
    case "tarea":
      return r.actividad
        ? [{ tipo: "crear_tarea", titulo: r.actividad, fecha: r.fecha, prioridad: r.prioridad }]
        : [];
    case "recordatorio":
      return r.actividad && r.fecha && r.hora
        ? [{ tipo: "crear_recordatorio", actividad: r.actividad, fecha: r.fecha, hora: r.hora }]
        : [];
    case "evento":
      return r.actividad && r.fecha && r.hora
        ? [{ tipo: "crear_evento", titulo: r.actividad, fecha: r.fecha, hora: r.hora, persona: r.persona }]
        : [];
    case "memoria":
      return r.actividad
        ? [{ tipo: "guardar_memoria", informacion: r.actividad, categoria: r.persona ? "Personas" : "Preferencias" }]
        : [];
    case "automatizacion":
      return r.actividad
        ? [
            {
              tipo: "crear_automatizacion",
              accion: r.actividad,
              frecuencia: r.frecuencia ?? "Todos los días",
              hora: r.hora ?? "08:00",
            },
          ]
        : [];
    case "completar":
      return r.actividad
        ? [
            {
              tipo: "completar",
              entidad: r.entidad === "recordatorio" || r.entidad === "evento" ? r.entidad : "tarea",
              consulta: r.actividad,
            },
          ]
        : [];
    case "eliminar":
      return r.actividad
        ? [
            {
              tipo: "eliminar",
              entidad:
                r.entidad === "recordatorio" ||
                r.entidad === "evento" ||
                r.entidad === "memoria" ||
                r.entidad === "automatizacion"
                  ? r.entidad
                  : "tarea",
              consulta: r.actividad,
            },
          ]
        : [];
    case "modificar":
      return r.actividad
        ? [
            {
              tipo: "modificar",
              entidad: r.entidad === "recordatorio" || r.entidad === "evento" ? r.entidad : "tarea",
              consulta: r.actividad,
              fecha: r.fecha,
              hora: r.hora,
            },
          ]
        : [];
    default:
      return [];
  }
}

function aclaracionNatural(r: Interpretacion): string {
  if (r.intencion === "recordatorio" || r.intencion === "evento") {
    const que = r.actividad || "eso";
    if (!r.fecha && !r.hora) return `De acuerdo, ${que}. ¿Para qué día y a qué hora?`;
    if (!r.fecha) return `Va, ${que}. ¿Qué día te lo dejo?`;
    return `Va, ${que}. ¿A qué hora?`;
  }
  if (r.intencion === "completar" || r.intencion === "eliminar" || r.intencion === "modificar") {
    return "Dime cuál, y lo dejo hecho.";
  }
  return "Cuéntame un poco más y lo resolvemos.";
}

function charlaLocal(mensaje: string, ctx: ContextoDilo): string {
  const n = normalizar(mensaje);
  const nombre = primerNombre(ctx);
  const hola = nombre ? `${nombre}, ` : "";

  if (/\b(como estas|que tal|todo bien|como va|que onda)\b/.test(n)) {
    return `Aquí ando, ${hola || ""}listo para lo que necesites. ${cierreAgenda(ctx)}`;
  }
  if (/\b(quien eres|que eres|que puedes|que haces|para que sirves|ayudame|ayuda)\b/.test(n)) {
    return "Soy Dilo, tu asistente. Te ayudo a organizar el día, recordarte cosas, anotar pendientes y conversar con calma. Dime qué tienes entre manos.";
  }
  if (/\bgracias\b/.test(n)) {
    return "Cuando quieras. Aquí sigo.";
  }
  if (/\b(cansad|estresad|agotad|mal dia|buen dia)\b/.test(n)) {
    return "Te escucho. Si quieres lo descargamos, o vemos qué tienes pendiente y lo hacemos más liviano. ¿Qué te encaja ahora?";
  }
  if (/\?$/.test(mensaje.trim()) || /^(que|cual|como|cuando|donde|por que|puedes|me puedes|y si)\b/.test(n)) {
    return `Te sigo. ${cierreAgenda(ctx)} Si quieres, lo anotamos o lo vemos juntos.`;
  }
  return `Te escucho. ${cierreAgenda(ctx)} Dime cómo sigo.`;
}

function cierreAgenda(ctx: ContextoDilo) {
  const tareas = ctx.tareas.filter((t) => t.estado !== "completada" && t.estado !== "completado").length;
  const recs = ctx.recordatorios.filter((r) => (r.estado === "pendiente" || r.estado === "activo") && r.fecha === ctx.hoy)
    .length;
  if (tareas === 0 && recs === 0) return "Hoy no tienes nada marcado.";
  if (recs > 0 && tareas > 0) return `Hoy tienes ${tareas} ${tareas === 1 ? "tarea" : "tareas"} y ${recs} ${recs === 1 ? "recordatorio" : "recordatorios"}.`;
  if (recs > 0) return `Hoy tienes ${recs} ${recs === 1 ? "recordatorio" : "recordatorios"}.`;
  return `Tienes ${tareas} ${tareas === 1 ? "tarea pendiente" : "tareas pendientes"}.`;
}
