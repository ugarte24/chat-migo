import { fetchConTiempo } from "./utils";

const SILENCIO =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let audioActual: HTMLAudioElement | null = null;
let altavoz: HTMLAudioElement | null = null;
let ctxAudio: AudioContext | null = null;
let fuenteActual: AudioBufferSourceNode | null = null;
let audioDesbloqueado = false;
let generacionHabla = 0;
let hablaEnCurso: Promise<void> = Promise.resolve();
const cacheHablar = new Map<string, ArrayBuffer>();

export function esIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function esMovil() {
  if (typeof navigator === "undefined") return false;
  return esIOS() || /Android|Mobi|webOS/i.test(navigator.userAgent);
}

function ctorAudioContext() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function prepararAltavoz() {
  if (typeof Audio === "undefined") return null;
  if (!altavoz) {
    altavoz = new Audio();
    altavoz.setAttribute("playsinline", "true");
    altavoz.setAttribute("webkit-playsinline", "true");
    altavoz.preload = "auto";
  }
  return altavoz;
}

async function contextoListo() {
  const Ctor = ctorAudioContext();
  if (!Ctor) return null;
  ctxAudio = ctxAudio ?? new Ctor();
  if (ctxAudio.state === "suspended") {
    try {
      await ctxAudio.resume();
    } catch {
      /* iOS a veces pide otro gesto */
    }
  }
  return ctxAudio;
}

function claveHablar(texto: string, vozId?: string) {
  return `${vozId ?? ""}:${texto}`;
}

async function pedirAudioHablar(texto: string, vozId?: string) {
  const res = await fetchConTiempo(
    "/api/hablar",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, vozId }),
    },
    14_000,
  );
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  return buf.byteLength < 80 ? null : buf;
}

export async function prefetchHablar(texto: string, vozId?: string) {
  const limpio = texto.replace(/[✓🔔⚙️🎤]/g, "").replace(/^•\s*/gm, "").trim();
  if (!limpio) return;
  const clave = claveHablar(limpio, vozId);
  if (cacheHablar.has(clave)) return;
  try {
    const buf = await pedirAudioHablar(limpio, vozId);
    if (buf) cacheHablar.set(clave, buf);
  } catch {
    /* se intentará otra vez al hablar */
  }
}

async function reproducirBuffer(buf: ArrayBuffer) {
  const ctx = await contextoListo();
  if (ctx) {
    try {
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      fuenteActual?.stop();
      const fuente = ctx.createBufferSource();
      fuente.buffer = decoded;
      fuente.connect(ctx.destination);
      fuenteActual = fuente;
      await new Promise<void>((resolve) => {
        fuente.onended = () => resolve();
        try {
          fuente.start();
        } catch {
          resolve();
        }
      });
      if (fuenteActual === fuente) fuenteActual = null;
      return true;
    } catch {
      /* algunos navegadores no decodifican el mp3; caemos al elemento audio */
    }
  }
  const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
  const el = prepararAltavoz() ?? new Audio();
  el.loop = false;
  el.src = url;
  el.muted = false;
  el.volume = 1;
  audioActual = el;
  try {
    await el.play();
    await new Promise<void>((resolve) => {
      const listo = () => resolve();
      el.onended = listo;
      el.onerror = listo;
      el.addEventListener("pause", listo, { once: true });
    });
    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
    if (audioActual === el) audioActual = null;
  }
}

async function mantenerAltavozVivo() {
  const el = prepararAltavoz();
  if (!el || !audioDesbloqueado) return;
  if (audioActual === el && !el.paused && el.src && !el.src.startsWith("data:")) return;
  try {
    el.loop = true;
    if (el.src !== SILENCIO) el.src = SILENCIO;
    el.muted = false;
    el.volume = 0.01;
    await el.play();
  } catch {
    /* sin gesto el navegador sigue bloqueando */
  }
}

export async function desbloquearAudio() {
  if (typeof Audio === "undefined") return;
  await contextoListo();
  const el = prepararAltavoz();
  try {
    if (el) {
      el.loop = true;
      el.src = SILENCIO;
      el.muted = false;
      el.volume = 0.01;
      await el.play();
    }
    audioDesbloqueado = true;
  } catch {
    /* el navegador aún bloquea autoplay; el AudioContext ya se reanudó */
    audioDesbloqueado = true;
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

function nombreArchivoAudio(tipo: string) {
  const t = tipo.toLowerCase();
  if (t.includes("mp4") || t.includes("m4a") || t.includes("aac") || t.includes("caf")) return "nota.m4a";
  if (t.includes("mpeg") || t.includes("mp3")) return "nota.mp3";
  if (t.includes("ogg")) return "nota.ogg";
  if (t.includes("wav")) return "nota.wav";
  return "nota.webm";
}

export async function transcribirAudio(blob: Blob): Promise<{ texto: string | null; cuota: boolean }> {
  if (blob.size < 800) return { texto: null, cuota: false };
  const form = new FormData();
  form.append("audio", blob, nombreArchivoAudio(blob.type));
  try {
    const res = await fetchConTiempo("/api/transcribir", { method: "POST", body: form }, 16_000);
    if (res.status === 429) return { texto: null, cuota: true };
    if (!res.ok) return { texto: null, cuota: false };
    const cuerpo = (await res.json().catch(() => null)) as { texto?: string } | null;
    return { texto: cuerpo?.texto?.trim() || null, cuota: false };
  } catch {
    return { texto: null, cuota: false };
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
  const tipos = esIOS()
    ? ["audio/mp4", "audio/aac", "audio/webm"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return tipos.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

export interface GrabacionVoz {
  detener: () => Promise<{ blob: Blob; dicho: string }>;
}

function escucharEnVivo(): { texto: () => string; parar: () => void } {
  const Ctor = ctorReconocimiento();
  if (!Ctor) return { texto: () => "", parar: () => undefined };

  const rec = new Ctor();
  rec.lang = "es-ES";
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = true;
  let dicho = "";
  let interino = "";
  rec.onresult = (evento) => {
    let finales = "";
    let provisional = "";
    for (let i = evento.resultIndex ?? 0; i < evento.results.length; i++) {
      const pieza = evento.results[i];
      const t = pieza?.[0]?.transcript?.trim() ?? "";
      if (!t) continue;
      if (pieza?.isFinal) finales = finales ? `${finales} ${t}` : t;
      else provisional = t;
    }
    if (finales) dicho = dicho ? `${dicho} ${finales}` : finales;
    interino = provisional;
  };
  rec.onerror = () => undefined;
  try {
    rec.start();
  } catch {
    return { texto: () => "", parar: () => undefined };
  }
  return {
    texto: () => (dicho || interino).trim(),
    parar: () => {
      try {
        rec.stop();
      } catch {
        /* ya cerrado */
      }
    },
  };
}

function iniciarSoloReconocimiento(
  alCortar?: () => void,
  onTexto?: (texto: string) => void,
  continuo = false,
): GrabacionVoz {
  const Ctor = ctorReconocimiento();
  if (!Ctor) {
    return {
      detener: async () => ({ blob: new Blob(), dicho: "" }),
    };
  }
  const rec = new Ctor();
  rec.lang = "es-ES";
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = true;
  let dicho = "";
  let interino = "";
  let cerrado = false;
  let silencioId = 0;
  const topeId = continuo
    ? 0
    : window.setTimeout(() => {
        if (!cerrado) alCortar?.();
      }, 16_000);

  const programarCorte = () => {
    window.clearTimeout(silencioId);
    silencioId = window.setTimeout(() => {
      if (!cerrado && (dicho || interino)) alCortar?.();
    }, continuo ? 1800 : 1600);
  };

  rec.onresult = (evento) => {
    let finales = "";
    let provisional = "";
    for (let i = evento.resultIndex ?? 0; i < evento.results.length; i++) {
      const pieza = evento.results[i];
      const t = pieza?.[0]?.transcript?.trim() ?? "";
      if (!t) continue;
      if (pieza?.isFinal) finales = finales ? `${finales} ${t}` : t;
      else provisional = t;
    }
    if (finales) dicho = dicho ? `${dicho} ${finales}` : finales;
    interino = provisional;
    onTexto?.((dicho || interino).trim());
    programarCorte();
  };
  rec.onerror = (evento) => {
    const error = (evento as { error?: string }).error;
    if (error === "not-allowed" || error === "service-not-allowed") alCortar?.();
  };
  rec.onend = () => {
    if (cerrado) return;
    try {
      rec.start();
    } catch {
      if (dicho || interino || continuo) alCortar?.();
    }
  };
  rec.start();

  return {
    detener: () =>
      new Promise((resolve) => {
        cerrado = true;
        window.clearTimeout(silencioId);
        window.clearTimeout(topeId);
        try {
          rec.stop();
        } catch {
          /* ya cerrado */
        }
        window.setTimeout(() => {
          resolve({ blob: new Blob(), dicho: (dicho || interino).trim() });
        }, 180);
      }),
  };
}

/** Escucha con el reconocimiento del navegador (sin Whisper). Si no hay, graba audio. */
export async function iniciarGrabacion(
  alCortar?: () => void,
  onTexto?: (texto: string) => void,
  opciones?: { continuo?: boolean },
): Promise<GrabacionVoz> {
  const continuo = opciones?.continuo === true;
  if (ctorReconocimiento()) {
    try {
      return iniciarSoloReconocimiento(alCortar, onTexto, continuo);
    } catch {
      /* algunos móviles fallan el reconocimiento; grabamos audio */
    }
  }
  return iniciarGrabacionArchivo(alCortar, continuo);
}

async function pedirMicrofono() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

/** Graba audio para Whisper si el navegador no reconoce voz. */
async function iniciarGrabacionArchivo(alCortar?: () => void, continuo = false): Promise<GrabacionVoz> {
  const stream = await pedirMicrofono();
  const mime = mimeGrabacion();
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const trozos: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) trozos.push(e.data);
  };
  const movil = esMovil();
  if (movil) rec.start(200);
  else rec.start();
  // En el móvil, reconocimiento + grabación a la vez suelen pelearse por el micrófono.
  const vivo = movil ? { texto: () => "", parar: () => undefined } : escucharEnVivo();

  const AudioCtx = ctorAudioContext();
  let audioCtx: AudioContext | null = null;
  let cerrado = false;
  const inicio = Date.now();
  let huboVoz = false;
  let ultimoSonido = Date.now();

  if (AudioCtx) {
    audioCtx = ctxAudio && ctxAudio.state !== "closed" ? ctxAudio : new AudioCtx();
    ctxAudio = audioCtx;
    try {
      await audioCtx.resume();
    } catch {
      /* sin gesto extra */
    }
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
      if (rms > (movil ? 0.02 : 0.025)) {
        huboVoz = true;
        ultimoSonido = Date.now();
      }
      const ahora = Date.now();
      const silencio = movil ? 2200 : 1600;
      const minimo = movil ? 1800 : 1200;
      if (huboVoz && ahora - ultimoSonido > silencio && ahora - inicio > minimo) {
        cerrado = true;
        alCortar?.();
        return;
      }
      if (!continuo && !huboVoz && ahora - inicio > (movil ? 16000 : 12000)) {
        cerrado = true;
        alCortar?.();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const blobDeTrozo = () =>
    new Blob(trozos, { type: (rec.mimeType || mime || "audio/webm").split(";")[0] });

  return {
    detener: () =>
      new Promise((resolve, reject) => {
        cerrado = true;
        vivo.parar();
        const listo = (blob: Blob) => {
          resolve({ blob, dicho: vivo.texto() });
        };
        const tope = window.setTimeout(() => {
          stream.getTracks().forEach((t) => t.stop());
          if (trozos.length === 0 && !vivo.texto()) {
            reject(new Error("No se grabó audio."));
            return;
          }
          listo(blobDeTrozo());
        }, 2_500);
        rec.onstop = () => {
          window.clearTimeout(tope);
          stream.getTracks().forEach((t) => t.stop());
          if (trozos.length === 0 && !vivo.texto()) {
            reject(new Error("No se grabó audio."));
            return;
          }
          listo(blobDeTrozo());
        };
        if (rec.state === "inactive") {
          window.clearTimeout(tope);
          stream.getTracks().forEach((t) => t.stop());
          if (trozos.length === 0 && !vivo.texto()) {
            reject(new Error("La grabación ya había terminado."));
            return;
          }
          listo(blobDeTrozo());
          return;
        }
        try {
          rec.requestData();
        } catch {
          /* Safari antiguo */
        }
        rec.stop();
      }),
  };
}

export function esperaFinHabla() {
  return hablaEnCurso.catch(() => undefined);
}

export async function hablar(texto: string, vozId?: string) {
  const gen = ++generacionHabla;
  const trabajo = emitirHabla(texto, vozId, gen);
  hablaEnCurso = trabajo.then(
    () => undefined,
    () => undefined,
  );
  await trabajo;
}

async function emitirHabla(texto: string, vozId: string | undefined, gen: number) {
  const limpio = texto
    .replace(/[✓🔔⚙️🎤]/g, "")
    .replace(/^•\s*/gm, "")
    .trim();
  if (!limpio) return;
  if (sintesisVozDisponible()) window.speechSynthesis.cancel();
  try {
    fuenteActual?.stop();
  } catch {
    /* ya parada */
  }
  fuenteActual = null;
  await contextoListo();
  if (gen !== generacionHabla) return;

  const clave = claveHablar(limpio, vozId);
  let buf = cacheHablar.get(clave) ?? null;
  if (!buf) {
    buf = await pedirAudioHablar(limpio, vozId);
    if (buf) cacheHablar.set(clave, buf);
  }
  if (gen !== generacionHabla) return;
  if (buf && (await reproducirBuffer(buf))) {
    await mantenerAltavozVivo();
    return;
  }
  if (gen !== generacionHabla) return;
  await hablarEnNavegador(limpio);
}

async function hablarEnNavegador(texto: string) {
  if (!sintesisVozDisponible()) return;
  const vocesListas = () =>
    new Promise<void>((resolve) => {
      if (window.speechSynthesis.getVoices().length > 0) {
        resolve();
        return;
      }
      window.speechSynthesis.addEventListener("voiceschanged", () => resolve(), { once: true });
      window.setTimeout(resolve, 400);
    });
  await vocesListas();
  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-VE";
    utterance.rate = 1.04;
    utterance.pitch = 1;
    const voces = window.speechSynthesis.getVoices();
    const voz =
      voces.find((v) => v.lang.toLowerCase().startsWith("es-ve")) ||
      voces.find((v) => v.lang.toLowerCase().startsWith("es-mx")) ||
      voces.find((v) => v.lang.toLowerCase().startsWith("es"));
    if (voz) utterance.voice = voz;
    const listo = () => resolve();
    utterance.onend = listo;
    utterance.onerror = listo;
    window.speechSynthesis.speak(utterance);
    window.setTimeout(listo, Math.min(12_000, texto.length * 90 + 1_800));
  });
}

export function silenciar() {
  generacionHabla += 1;
  if (sintesisVozDisponible()) window.speechSynthesis.cancel();
  try {
    fuenteActual?.stop();
  } catch {
    /* ya parada */
  }
  fuenteActual = null;
  if (audioActual) {
    audioActual.pause();
    audioActual = null;
  }
  void mantenerAltavozVivo();
}

export function iaVozEtiqueta() {
  return "Voz de Dilo";
}

interface ResultadoVoz {
  isFinal?: boolean;
  length?: number;
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
