import { esCascaraAndroid, usarParlanteNativo } from "./nativo";
import { fetchConTiempo } from "./utils";

const SILENCIO =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let audioActual: HTMLAudioElement | null = null;
let altavoz: HTMLAudioElement | null = null;
let ctxAudio: AudioContext | null = null;
let ctxCaptura: AudioContext | null = null;
let fuenteActual: AudioBufferSourceNode | null = null;
let gananciaActual: GainNode | null = null;
let audioDesbloqueado = false;
let generacionHabla = 0;
let hablaEnCurso: Promise<void> = Promise.resolve();
let colaHabla: Promise<void> = Promise.resolve();
let hablaPendiente = 0;
let turnoVozAbierto = false;
const cacheHablar = new Map<string, ArrayBuffer>();

type NivelCb = (nivel: number) => void;
const oyentesNivel = new Set<NivelCb>();
let nivelVoz = 0;
let rafNivel = 0;
let suavizadoNivel = 0;
let pararLatidoActual: (() => void) | null = null;

function publicarNivel(n: number) {
  nivelVoz = Math.min(1, Math.max(0, n));
  oyentesNivel.forEach((cb) => cb(nivelVoz));
}

export function suscribirNivelVoz(cb: NivelCb) {
  oyentesNivel.add(cb);
  cb(nivelVoz);
  return () => {
    oyentesNivel.delete(cb);
  };
}

function arrancarMedidor(analizador: AnalyserNode, suelo = 0.015) {
  const datos = new Uint8Array(analizador.fftSize);
  const tick = () => {
    analizador.getByteTimeDomainData(datos);
    let suma = 0;
    for (let i = 0; i < datos.length; i++) {
      const v = (datos[i]! - 128) / 128;
      suma += v * v;
    }
    const rms = Math.sqrt(suma / datos.length);
    const crudo = Math.min(1, Math.max(0, (rms - suelo) / 0.14));
    suavizadoNivel += (crudo - suavizadoNivel) * 0.35;
    publicarNivel(suavizadoNivel);
    rafNivel = requestAnimationFrame(tick);
  };
  if (rafNivel) cancelAnimationFrame(rafNivel);
  rafNivel = requestAnimationFrame(tick);
}

function pararMedidor() {
  if (rafNivel) cancelAnimationFrame(rafNivel);
  rafNivel = 0;
  suavizadoNivel = 0;
  publicarNivel(0);
}

function latidoSimulado() {
  let id = 0;
  let vivo = true;
  const tick = () => {
    if (!vivo) return;
    publicarNivel(0.28 + Math.random() * 0.5);
    id = window.setTimeout(tick, 80 + Math.random() * 80);
  };
  tick();
  const parar = () => {
    if (!vivo) return;
    vivo = false;
    window.clearTimeout(id);
    publicarNivel(0);
    if (pararLatidoActual === parar) pararLatidoActual = null;
  };
  pararLatidoActual = parar;
  return parar;
}

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

function gananciaVoz() {
  return esMovil() ? 2.8 : 1.9;
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

async function reproducirBuffer(buf: ArrayBuffer, gen: number) {
  usarParlanteNativo();
  await pararSilencio();
  if (await reproducirEnElemento(buf, gen)) return true;
  return reproducirEnContexto(buf, gen);
}

async function pararSilencio() {
  const el = altavoz;
  if (!el) return;
  try {
    el.loop = false;
    el.pause();
  } catch {
    /* ya parado */
  }
  el.muted = false;
  el.volume = 1;
}

async function reproducirEnElemento(buf: ArrayBuffer, gen: number) {
  const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
  const nativo = esCascaraAndroid();
  const el = nativo ? prepararAltavoz() : new Audio();
  if (!el) {
    URL.revokeObjectURL(url);
    return false;
  }
  el.setAttribute("playsinline", "true");
  el.setAttribute("webkit-playsinline", "true");
  el.preload = "auto";
  el.loop = false;
  el.muted = false;
  el.volume = 1;
  if (!nativo) {
    const conSalida = el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
    try {
      await conSalida.setSinkId?.("default");
    } catch {
      /* el navegador no deja elegir salida */
    }
  }
  el.src = url;
  audioActual = el;
  let pararFake: (() => void) | null = null;
  const ctx = nativo ? null : await contextoListo();
  if (ctx) {
    try {
      const fuente = ctx.createMediaElementSource(el);
      const analizador = ctx.createAnalyser();
      analizador.fftSize = 1024;
      fuente.connect(analizador);
      analizador.connect(ctx.destination);
      arrancarMedidor(analizador, 0.008);
    } catch {
      pararFake = latidoSimulado();
    }
  } else {
    pararFake = latidoSimulado();
  }
  try {
    await el.play();
    await new Promise<void>((resolve) => {
      let listoYa = false;
      const listo = () => {
        if (listoYa) return;
        listoYa = true;
        window.clearInterval(iv);
        resolve();
      };
      const iv = window.setInterval(() => {
        if (gen !== generacionHabla) listo();
      }, 80);
      el.onended = listo;
      el.onerror = listo;
    });
    return gen === generacionHabla && !el.error;
  } catch {
    return false;
  } finally {
    pararFake?.();
    pararMedidor();
    el.onended = null;
    el.onerror = null;
    if (audioActual === el) audioActual = null;
    URL.revokeObjectURL(url);
  }
}

async function reproducirEnContexto(buf: ArrayBuffer, gen: number) {
  const ctx = await contextoListo();
  if (!ctx) return false;
  try {
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    try {
      fuenteActual?.stop();
    } catch {
      /* ya parada */
    }
    const fuente = ctx.createBufferSource();
    const ganancia = ctx.createGain();
    ganancia.gain.value = gananciaVoz();
    fuente.buffer = decoded;
    fuente.connect(ganancia);
    const analizador = ctx.createAnalyser();
    analizador.fftSize = 1024;
    ganancia.connect(analizador);
    analizador.connect(ctx.destination);
    fuenteActual = fuente;
    gananciaActual = ganancia;
    arrancarMedidor(analizador, 0.006);
    await new Promise<void>((resolve) => {
      let listoYa = false;
      const listo = () => {
        if (listoYa) return;
        listoYa = true;
        window.clearInterval(iv);
        resolve();
      };
      const iv = window.setInterval(() => {
        if (gen !== generacionHabla) listo();
      }, 80);
      fuente.onended = listo;
      try {
        fuente.start();
      } catch {
        listo();
      }
    });
    pararMedidor();
    if (fuenteActual === fuente) fuenteActual = null;
    if (gananciaActual === ganancia) gananciaActual = null;
    return true;
  } catch {
    pararMedidor();
    return false;
  }
}

async function mantenerAltavozVivo() {
  if (!esIOS()) {
    await pararSilencio();
    return;
  }
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
  usarParlanteNativo();
  if (!esCascaraAndroid()) await contextoListo();
  const el = prepararAltavoz();
  try {
    if (el) {
      el.muted = false;
      el.volume = esIOS() ? 0.01 : 1;
      el.loop = esIOS();
      el.src = SILENCIO;
      await el.play();
      if (!esIOS()) {
        el.pause();
        el.loop = false;
        el.volume = 1;
      }
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

function compactarRepeticiones(texto: string) {
  let palabras = texto.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (palabras.length < 2) return palabras.join(" ");

  for (let n = Math.min(16, Math.floor(palabras.length / 2)); n >= 2; n--) {
    const res: string[] = [];
    let i = 0;
    while (i < palabras.length) {
      if (i + 2 * n <= palabras.length) {
        const a = palabras.slice(i, i + n).join(" ");
        const b = palabras.slice(i + n, i + 2 * n).join(" ");
        if (a === b) {
          res.push(...palabras.slice(i, i + n));
          i += 2 * n;
          while (i + n <= palabras.length && palabras.slice(i, i + n).join(" ") === a) i += n;
          continue;
        }
      }
      res.push(palabras[i]!);
      i += 1;
    }
    palabras = res;
  }

  const res: string[] = [];
  for (let i = 0; i < palabras.length; ) {
    const w = palabras[i]!;
    let j = i + 1;
    while (j < palabras.length && palabras[j] === w) j++;
    const veces = j - i;
    if (veces >= 3 || (veces === 2 && w.length >= 5)) res.push(w);
    else for (let k = 0; k < veces; k++) res.push(w);
    i = j;
  }
  return res.join(" ");
}

function unirSinSolape(anterior: string, siguiente: string) {
  const a = compactarRepeticiones(anterior);
  const b = compactarRepeticiones(siguiente);
  if (!b) return a;
  if (!a) return b;
  if (a === b || b.startsWith(a)) return b;
  if (a.endsWith(b) || a.includes(b)) return a;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  const tope = Math.min(a.length, b.length);
  for (let n = tope; n >= 10; n--) {
    if (al.slice(-n) === bl.slice(0, n)) {
      return compactarRepeticiones(`${a}${b.slice(n)}`);
    }
  }
  return compactarRepeticiones(`${a} ${b}`);
}

function partesDeResultado(evento: { results: ArrayLike<ResultadoVoz> }) {
  let finales = "";
  let provisional = "";
  for (let i = 0; i < evento.results.length; i++) {
    const pieza = evento.results[i];
    const t = pieza?.[0]?.transcript?.trim() ?? "";
    if (!t) continue;
    if (pieza?.isFinal) finales = finales ? `${finales} ${t}` : t;
    else provisional = provisional ? `${provisional} ${t}` : t;
  }
  return {
    finales: compactarRepeticiones(finales),
    provisional: compactarRepeticiones(provisional),
  };
}

function crearAcumuladorVoz() {
  let base = "";
  let sesion = "";
  let interino = "";
  return {
    aplicar(evento: { results: ArrayLike<ResultadoVoz> }) {
      const { finales, provisional } = partesDeResultado(evento);
      sesion = finales;
      interino = provisional;
      return compactarRepeticiones(unirSinSolape(unirSinSolape(base, sesion), interino));
    },
    comprometer() {
      base = unirSinSolape(base, sesion);
      sesion = "";
      interino = "";
    },
    texto() {
      return compactarRepeticiones(unirSinSolape(unirSinSolape(base, sesion), interino));
    },
  };
}

function escucharEnVivo(): { texto: () => string; parar: () => void } {
  const Ctor = ctorReconocimiento();
  if (!Ctor) return { texto: () => "", parar: () => undefined };

  const rec = new Ctor();
  rec.lang = "es-ES";
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = true;
  const acumulado = crearAcumuladorVoz();
  rec.onresult = (evento) => {
    acumulado.aplicar(evento);
  };
  rec.onerror = () => undefined;
  try {
    rec.start();
  } catch {
    return { texto: () => "", parar: () => undefined };
  }
  return {
    texto: () => acumulado.texto(),
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
  const acumulado = crearAcumuladorVoz();
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
      if (!cerrado && acumulado.texto()) alCortar?.();
    }, continuo ? 1800 : 1600);
  };

  rec.onresult = (evento) => {
    const texto = acumulado.aplicar(evento);
    onTexto?.(texto);
    publicarNivel(0.42 + Math.random() * 0.45);
    programarCorte();
  };
  rec.onerror = (evento) => {
    const error = (evento as { error?: string }).error;
    if (error === "not-allowed" || error === "service-not-allowed") alCortar?.();
  };
  rec.onend = () => {
    if (cerrado) return;
    acumulado.comprometer();
    try {
      rec.start();
    } catch {
      if (acumulado.texto() || continuo) alCortar?.();
    }
  };
  rec.start();
  usarParlanteNativo();
  publicarNivel(0.14);
  const decaer = window.setInterval(() => {
    if (cerrado) {
      window.clearInterval(decaer);
      return;
    }
    publicarNivel(Math.max(0.12, nivelVoz * 0.78));
  }, 130);

  return {
    detener: () =>
      new Promise((resolve) => {
        cerrado = true;
        window.clearInterval(decaer);
        window.clearTimeout(silencioId);
        window.clearTimeout(topeId);
        pararMedidor();
        try {
          rec.stop();
        } catch {
          /* ya cerrado */
        }
        window.setTimeout(() => {
          resolve({ blob: new Blob(), dicho: acumulado.texto() });
          usarParlanteNativo();
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
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    usarParlanteNativo();
    return stream;
  } catch {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    usarParlanteNativo();
    return stream;
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
  let fuenteMic: MediaStreamAudioSourceNode | null = null;
  let cerrado = false;
  const inicio = Date.now();
  let huboVoz = false;
  let ultimoSonido = Date.now();

  if (AudioCtx) {
    ctxCaptura = ctxCaptura && ctxCaptura.state !== "closed" ? ctxCaptura : new AudioCtx();
    audioCtx = ctxCaptura;
    try {
      await audioCtx.resume();
    } catch {
      /* sin gesto extra */
    }
    fuenteMic = audioCtx.createMediaStreamSource(stream);
    const analizador = audioCtx.createAnalyser();
    analizador.fftSize = 2048;
    fuenteMic.connect(analizador);
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
      suavizadoNivel += (Math.min(1, Math.max(0, (rms - (movil ? 0.02 : 0.025)) / 0.14)) - suavizadoNivel) * 0.35;
      publicarNivel(suavizadoNivel);
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
        pararMedidor();
        try {
          fuenteMic?.disconnect();
        } catch {
          /* ya suelta */
        }
        fuenteMic = null;
        const soltarMic = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (audioCtx && audioCtx === ctxCaptura) {
            try {
              void audioCtx.close();
            } catch {
              /* ya cerrado */
            }
            ctxCaptura = null;
          }
          usarParlanteNativo();
        };
        const listo = (blob: Blob) => {
          resolve({ blob, dicho: vivo.texto() });
        };
        const tope = window.setTimeout(() => {
          soltarMic();
          if (trozos.length === 0 && !vivo.texto()) {
            reject(new Error("No se grabó audio."));
            return;
          }
          listo(blobDeTrozo());
        }, 2_500);
        rec.onstop = () => {
          window.clearTimeout(tope);
          soltarMic();
          if (trozos.length === 0 && !vivo.texto()) {
            reject(new Error("No se grabó audio."));
            return;
          }
          listo(blobDeTrozo());
        };
        if (rec.state === "inactive") {
          window.clearTimeout(tope);
          soltarMic();
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

export function extraerFrasesVoz(buffer: string, forzarResto: boolean) {
  const listas: string[] = [];
  let resto = buffer;
  const re = /^([\s\S]*?[.!?…]+)(\s+|$)/;
  while (true) {
    const m = resto.match(re);
    if (!m) break;
    const frase = (m[1] ?? "").trim();
    if (frase) listas.push(frase);
    resto = resto.slice(m[0].length);
  }
  if (forzarResto) {
    const cola = resto.trim();
    if (cola) listas.push(cola);
    resto = "";
  } else if (resto.length > 72) {
    const corte = Math.max(resto.lastIndexOf(", "), resto.lastIndexOf(" "));
    if (corte > 24) {
      listas.push(resto.slice(0, corte).trim());
      resto = resto.slice(corte).trimStart();
    }
  }
  return { listas, resto };
}

export function esperaFinHabla() {
  return (async () => {
    while (turnoVozAbierto || hablaPendiente > 0) {
      await colaHabla.catch(() => undefined);
      if (!turnoVozAbierto && hablaPendiente === 0) break;
      await new Promise((r) => window.setTimeout(r, 40));
    }
    await hablaEnCurso.catch(() => undefined);
  })();
}

export function abrirTurnoVoz() {
  silenciar();
  turnoVozAbierto = true;
}

export function cerrarTurnoVoz() {
  turnoVozAbierto = false;
}

export function encolarHabla(texto: string, vozId?: string) {
  const gen = generacionHabla;
  hablaPendiente += 1;
  colaHabla = colaHabla
    .then(async () => {
      if (gen !== generacionHabla) return;
      await emitirHabla(texto, vozId, gen);
    })
    .catch(() => undefined)
    .then(() => {
      if (gen === generacionHabla) {
        hablaPendiente = Math.max(0, hablaPendiente - 1);
      }
    });
  hablaEnCurso = colaHabla;
}

/** Si hay un turno de voz abierto, encola; si no, habla ya. */
export function decir(texto: string, vozId?: string) {
  if (turnoVozAbierto || hablaPendiente > 0) {
    void prefetchHablar(texto, vozId);
    encolarHabla(texto, vozId);
    return;
  }
  void hablar(texto, vozId);
}

export async function hablar(texto: string, vozId?: string) {
  silenciar();
  encolarHabla(texto, vozId);
  await colaHabla;
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
  usarParlanteNativo();
  if (!esCascaraAndroid()) await contextoListo();
  if (gen !== generacionHabla) return;

  const clave = claveHablar(limpio, vozId);
  let buf = cacheHablar.get(clave) ?? null;
  if (!buf) {
    buf = await pedirAudioHablar(limpio, vozId);
    if (buf) cacheHablar.set(clave, buf);
  }
  if (gen !== generacionHabla) return;
  if (buf && (await reproducirBuffer(buf, gen))) {
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
  const pararLatido = latidoSimulado();
  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-VE";
    utterance.rate = 1.04;
    utterance.pitch = 1;
    utterance.volume = 1;
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
  pararLatido();
}

export function silenciar() {
  generacionHabla += 1;
  turnoVozAbierto = false;
  hablaPendiente = 0;
  colaHabla = Promise.resolve();
  hablaEnCurso = colaHabla;
  pararLatidoActual?.();
  pararMedidor();
  if (sintesisVozDisponible()) window.speechSynthesis.cancel();
  try {
    fuenteActual?.stop();
  } catch {
    /* ya parada */
  }
  fuenteActual = null;
  gananciaActual = null;
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
