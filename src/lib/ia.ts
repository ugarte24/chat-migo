import { interpretar, type Interpretacion } from "./asistente";

function claveOpenAi() {
  if (typeof process === "undefined" || process.env == null) return "";
  return process.env["OPENAI_API_KEY"]?.trim() ?? "";
}

export function iaConfigurada() {
  return claveOpenAi().length > 10;
}

const SISTEMA = `Eres Dilo, un asistente que convierte instrucciones en español en una acción.
Responde SOLO un JSON con esta forma:
{"intencion":"tarea|recordatorio|evento|automatizacion|memoria|consulta|completar|modificar|eliminar|desconocida","entidad":"tarea|recordatorio|evento|memoria|automatizacion|null","actividad":"texto","fecha":"YYYY-MM-DD o null","hora":"HH:MM o null","persona":"nombre o null","frecuencia":"texto o null","prioridad":"alta|media|baja","faltaInformacion":false}
Hoy es ${new Date().toISOString().slice(0, 10)}.`;

export async function interpretarConIa(texto: string): Promise<Interpretacion> {
  const clave = claveOpenAi();
  if (!clave) return interpretar(texto);

  try {
    const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SISTEMA },
          { role: "user", content: texto },
        ],
      }),
    });
    if (!respuesta.ok) return interpretar(texto);
    const cuerpo = (await respuesta.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const crudo = cuerpo.choices?.[0]?.message?.content;
    if (!crudo) return interpretar(texto);
    const parsed = JSON.parse(crudo) as Partial<Interpretacion>;
    const local = interpretar(texto);
    return {
      intencion: parsed.intencion ?? local.intencion,
      entidad: parsed.entidad === undefined ? local.entidad : parsed.entidad,
      actividad: parsed.actividad || local.actividad,
      fecha: parsed.fecha ?? local.fecha,
      hora: parsed.hora ?? local.hora,
      persona: parsed.persona ?? local.persona,
      frecuencia: parsed.frecuencia ?? local.frecuencia,
      prioridad: parsed.prioridad ?? local.prioridad,
      faltaInformacion: parsed.faltaInformacion ?? local.faltaInformacion,
    };
  } catch {
    return interpretar(texto);
  }
}

export async function transcribirWhisper(audio: ArrayBuffer, mime = "audio/webm"): Promise<string | null> {
  const clave = claveOpenAi();
  if (!clave) return null;
  const archivo = new File([audio], "nota.webm", { type: mime });
  const cuerpo = new FormData();
  cuerpo.append("file", archivo);
  cuerpo.append("model", "whisper-1");
  cuerpo.append("language", "es");
  const respuesta = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}` },
    body: cuerpo,
  });
  if (!respuesta.ok) return null;
  const json = (await respuesta.json()) as { text?: string };
  return json.text?.trim() || null;
}
