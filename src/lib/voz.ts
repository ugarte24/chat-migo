import { fetchConTiempo } from "./utils";

let audioActual: HTMLAudioElement | null = null;
let audioDesbloqueado = false;

export async function desbloquearAudio() {
  if (audioDesbloqueado || typeof Audio === "undefined") return;
  try {
    const silencio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA",
    );
    silencio.volume = 0.01;
    await silencio.play();
    silencio.pause();
    audioDesbloqueado = true;
  } catch {
    /* el navegador aún bloquea autoplay */
  }
}

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
  try {
    const res = await fetchConTiempo("/api/transcribir", { method: "POST", body: form }, 16_000);
    if (!res.ok) return null;
    const cuerpo = (await res.json().catch(() => null)) as { texto?: string } | null;
    return cuerpo?.texto?.trim() || null;
  } catch {
    return null;
  }
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
    let cerrado = false;
    const listo = (fn: () => void) => {
      if (cerrado) return;
      cerrado = true;
      window.clearTimeout(id);
      fn();
    };
    const id = window.setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* ya cerrado */
      }
      listo(() => reject(new Error("No se entendió el audio.")));
    }, 8_000);
    rec.onresult = (evento) => {
      const texto = evento.results[0]?.[0]?.transcript?.trim() ?? "";
      if (texto) listo(() => resolve(texto));
      else listo(() => reject(new Error("No se entendió el audio.")));
    };
    rec.onerror = () => listo(() => reject(new Error("No se pudo transcribir el audio.")));
    rec.onend = () => listo(() => reject(new Error("No se entendió el audio.")));
    rec.start();
  });
}

function mimeGrabacion() {
  const tipos = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return tipos.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

/** Graba hasta que llamas a detener(), o hasta un silencio tras oírte. */
export async function iniciarGrabacion(alCortar?: () => void): Promise<{ detener: () => Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = mimeGrabacion();
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const trozos: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) trozos.push(e.data);
  };
  rec.start(250);

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  let audioCtx: AudioContext | null = null;
  let cerrado = false;
  const inicio = Date.now();
  let huboVoz = false;
  let ultimoSonido = Date.now();

  if (AudioCtx) {
    audioCtx = new AudioCtx();
    const fuente = audioCtx.createMediaStreamSource(stream);
    const analizador = audioCtx.createAnalyser();
    analizador.fftSize = 2048;
    fuente.connect(analizador);
    const datos = new Uint8Array(analizador.fftSize);

    const tick = () => {
      if (cerrado) return;
      analizador.getByteTimeDomainData(datos);
      let suma = 0;
      for (let i = 0; i < datos.length; i++) {
        const v = (datos[i]! - 128) / 128;
        suma += v * v;
      }
      const rms = Math.sqrt(suma / datos.length);
      if (rms > 0.04) {
        huboVoz = true;
        ultimoSonido = Date.now();
      }
      const ahora = Date.now();
      if (huboVoz && ahora - ultimoSonido > 1100 && ahora - inicio > 700) {
        cerrado = true;
        alCortar?.();
        return;
      }
      if (!huboVoz && ahora - inicio > 14000) {
        cerrado = true;
        alCortar?.();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  return {
    detener: () =>
      new Promise((resolve, reject) => {
        cerrado = true;
        void audioCtx?.close().catch(() => undefined);
        const tope = window.setTimeout(() => {
          stream.getTracks().forEach((t) => t.stop());
          if (trozos.length === 0) {
            reject(new Error("No se grabó audio."));
            return;
          }
          resolve(new Blob(trozos, { type: rec.mimeType || "audio/webm" }));
        }, 2_000);
        rec.onstop = () => {
          window.clearTimeout(tope);
          stream.getTracks().forEach((t) => t.stop());
          if (trozos.length === 0) {
            reject(new Error("No se grabó audio."));
            return;
          }
          resolve(new Blob(trozos, { type: rec.mimeType || "audio/webm" }));
        };
        if (rec.state === "inactive") {
          window.clearTimeout(tope);
          stream.getTracks().forEach((t) => t.stop());
          if (trozos.length === 0) {
            reject(new Error("La grabación ya había terminado."));
            return;
          }
          resolve(new Blob(trozos, { type: rec.mimeType || "audio/webm" }));
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
    const res = await fetchConTiempo(
      "/api/hablar",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      },
      14_000,
    );
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
