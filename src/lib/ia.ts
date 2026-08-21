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
      signal: AbortSignal.timeout(8_000),
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
  const ext = mime.includes("mp4") || mime.includes("m4a") ? "m4a" : mime.includes("mpeg") ? "mp3" : "webm";
  const archivo = new File([audio], `nota.${ext}`, { type: mime || "audio/webm" });
  const cuerpo = new FormData();
  cuerpo.append("file", archivo);
  cuerpo.append("model", "whisper-1");
  cuerpo.append("language", "es");
  try {
    const respuesta = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}` },
      signal: AbortSignal.timeout(14_000),
      body: cuerpo,
    });
    if (!respuesta.ok) return null;
    const json = (await respuesta.json()) as { text?: string };
    return json.text?.trim() || null;
  } catch {
    return null;
  }
}

/** Voz de Dilo: ElevenLabs (ID de voz copiado). Si falta la clave, no habla por API. */
export async function sintetizarVoz(texto: string): Promise<ArrayBuffer | null> {
  const limpio = texto.replace(/[#*_`]/g, "").trim();
  if (!limpio) return null;
  return sintetizarElevenLabs(limpio);
}

function envServidor(clave: string) {
  if (typeof process === "undefined" || process.env == null) return "";
  return process.env[clave]?.trim() ?? "";
}

/** Charlotte (conversacional, multilingual). Cámbiala en ELEVENLABS_VOICE_ID. */
export const VOZ_ELEVENLABS_ID = "XB0fDUnXU5powFXDhCwa";

export function vozElevenLabsId() {
  return envServidor("ELEVENLABS_VOICE_ID") || VOZ_ELEVENLABS_ID;
}

export function elevenLabsConfigurado() {
  return envServidor("ELEVENLABS_API_KEY").length > 10;
}

async function sintetizarElevenLabs(texto: string): Promise<ArrayBuffer | null> {
  const clave = envServidor("ELEVENLABS_API_KEY");
  if (clave.length < 10) return null;
  const voz = vozElevenLabsId();
  try {
    const respuesta = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}`, {
      method: "POST",
      headers: {
        "xi-api-key": clave,
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        text: texto.slice(0, 4000),
        model_id: "eleven_multilingual_v2",
      }),
    });
    if (!respuesta.ok) return null;
    return respuesta.arrayBuffer();
  } catch {
    return null;
  }
}
