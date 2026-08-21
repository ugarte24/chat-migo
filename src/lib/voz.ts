let audioActual: HTMLAudioElement | null = null;

export function reconocimientoVozDisponible() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function microfonoDisponible() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function sintesisVozDisponible() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function ctorReconocimiento() {
  const w = window as unknown as {
    SpeechRecognition?: new () => Reconocimiento;
    webkitSpeechRecognition?: new () => Reconocimiento;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

export async function transcribirAudio(blob: Blob): Promise<string | null> {
  const form = new FormData();
  const nombre = blob.type.includes("mp4") ? "nota.m4a" : "nota.webm";
  form.append("audio", blob, nombre);
  const res = await fetch("/api/transcribir", { method: "POST", body: form });
  if (!res.ok) return null;
  const cuerpo = (await res.json().catch(() => null)) as { texto?: string } | null;
  return cuerpo?.texto?.trim() || null;
}

export function transcribirEnNavegador(): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = ctorReconocimiento();
    if (!Ctor) {
      reject(new Error("El navegador no admite reconocimiento de voz."));
      return;
    }
    const rec = new Ctor();
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (evento) => {
      const texto = evento.results[0]?.[0]?.transcript?.trim() ?? "";
      if (texto) resolve(texto);
      else reject(new Error("No se entendió el audio."));
    };
    rec.onerror = () => reject(new Error("No se pudo transcribir el audio."));
    rec.start();
  });
}

function mimeGrabacion() {
  const tipos = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return tipos.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

/** Graba hasta que llamas a detener(). Devuelve el audio. */
export async function iniciarGrabacion(): Promise<{ detener: () => Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = mimeGrabacion();
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const trozos: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) trozos.push(e.data);
  };
  rec.start(250);
  return {
    detener: () =>
      new Promise((resolve, reject) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (trozos.length === 0) {
            reject(new Error("No se grabó audio."));
            return;
          }
          resolve(new Blob(trozos, { type: rec.mimeType || "audio/webm" }));
        };
        if (rec.state === "inactive") {
          stream.getTracks().forEach((t) => t.stop());
          reject(new Error("La grabación ya había terminado."));
          return;
        }
        rec.stop();
      }),
  };
}

export async function hablar(texto: string) {
  const limpio = texto
    .replace(/[✓🔔⚙️🎤]/g, "")
    .replace(/^•\s*/gm, "")
    .trim();
  if (!limpio) return;
  silenciar();
  const api = await hablarConOpenAi(limpio);
  if (!api) hablarEnNavegador(limpio);
}

async function hablarConOpenAi(texto: string) {
  try {
    const res = await fetch("/api/hablar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (blob.size < 80) return false;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioActual = audio;
    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
    });
    URL.revokeObjectURL(url);
    if (audioActual === audio) audioActual = null;
    return true;
  } catch {
    return false;
  }
}

function hablarEnNavegador(texto: string) {
  if (!sintesisVozDisponible()) return;
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "es-ES";
  utterance.rate = 1.04;
  utterance.pitch = 1;
  const voz = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("es"));
  if (voz) utterance.voice = voz;
  window.speechSynthesis.speak(utterance);
}

export function silenciar() {
  if (sintesisVozDisponible()) window.speechSynthesis.cancel();
  if (audioActual) {
    audioActual.pause();
    audioActual.src = "";
    audioActual = null;
  }
}

export function iaVozEtiqueta() {
  return "Voz de Dilo";
}

interface ResultadoVoz {
  isFinal?: boolean;
  0?: { transcript?: string };
}

interface Reconocimiento {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((evento: { resultIndex?: number; results: ArrayLike<ResultadoVoz> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
