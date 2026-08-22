import { interpretar, type Interpretacion } from "./asistente";
import { secreto } from "./secretos";

function claveOpenAi() {
  return secreto("OPENAI_API_KEY");
}

function claveGemini() {
  return secreto("GEMINI_API_KEY");
}

export function geminiConfigurado() {
  return claveGemini().length > 10;
}

export function iaConfigurada() {
  return claveOpenAi().length > 10 || geminiConfigurado();
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

function archivoWhisper(audio: ArrayBuffer, mime: string) {
  const tipo = (mime.split(";")[0] ?? "audio/webm").trim().toLowerCase();
  if (tipo.includes("mp4") || tipo.includes("m4a") || tipo.includes("aac") || tipo.includes("caf")) {
    return { blob: new Blob([audio], { type: "audio/mp4" }), nombre: "nota.m4a" };
  }
  if (tipo.includes("mpeg") || tipo.includes("mp3")) {
    return { blob: new Blob([audio], { type: "audio/mpeg" }), nombre: "nota.mp3" };
  }
  if (tipo.includes("ogg")) {
    return { blob: new Blob([audio], { type: "audio/ogg" }), nombre: "nota.ogg" };
  }
  return { blob: new Blob([audio], { type: "audio/webm" }), nombre: "nota.webm" };
}

export async function transcribirWhisper(
  audio: ArrayBuffer,
  mime = "audio/webm",
): Promise<{ texto: string | null; cuota: boolean }> {
  const clave = claveOpenAi();
  if (!clave) return { texto: null, cuota: false };
  if (audio.byteLength < 800) return { texto: null, cuota: false };
  const { blob, nombre } = archivoWhisper(audio, mime);
  const cuerpo = new FormData();
  cuerpo.append("file", blob, nombre);
  cuerpo.append("model", "whisper-1");
  cuerpo.append("language", "es");
  cuerpo.append("response_format", "json");
  try {
    const respuesta = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}` },
      signal: AbortSignal.timeout(12_000),
      body: cuerpo,
    });
    if (respuesta.status === 429) {
      console.error("whisper 429 cuota agotada");
      return { texto: null, cuota: true };
    }
    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      console.error("whisper", respuesta.status, detalle.slice(0, 240));
      return { texto: null, cuota: false };
    }
    const json = (await respuesta.json()) as { text?: string };
    return { texto: json.text?.trim() || null, cuota: false };
  } catch (error) {
    console.error("whisper", error instanceof Error ? error.message : "error");
    return { texto: null, cuota: false };
  }
}

/** Voz de Dilo: ElevenLabs (ID de voz copiado). Si falta la clave, no habla por API. */
export async function sintetizarVoz(texto: string): Promise<ArrayBuffer | null> {
  const limpio = texto.replace(/[#*_`]/g, "").trim();
  if (!limpio) return null;
  return sintetizarElevenLabs(limpio);
}

function envServidor(clave: "ELEVENLABS_API_KEY" | "ELEVENLABS_VOICE_ID") {
  return secreto(clave);
}

/** Santiago: joven, claro y cálido en español. Cámbiala en ELEVENLABS_VOICE_ID. */
export const VOZ_ELEVENLABS_ID = "15bJsujCI3tcDWeoZsQP";

export function vozElevenLabsId() {
  const env = envServidor("ELEVENLABS_VOICE_ID");
  if (!env || env === "XB0fDUnXU5powFXDhCwa") return VOZ_ELEVENLABS_ID;
  return env;
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
        voice_settings: {
          stability: 0.32,
          similarity_boost: 0.78,
          style: 0.68,
          use_speaker_boost: true,
        },
      }),
    });
    if (!respuesta.ok) return null;
    return respuesta.arrayBuffer();
  } catch {
    return null;
  }
}
