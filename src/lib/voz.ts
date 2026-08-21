export function reconocimientoVozDisponible() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
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

/** Escucha continua: se reinicia sola hasta que llames al retorno. */
export function iniciarEscuchaContinua(onTexto: (texto: string) => void): () => void {
  const Ctor = ctorReconocimiento();
  if (!Ctor) return () => undefined;

  let activo = true;
  const rec = new Ctor();
  rec.lang = "es-ES";
  rec.interimResults = false;
  rec.continuous = true;
  rec.maxAlternatives = 1;

  rec.onresult = (evento) => {
    const resultados = evento.results;
    for (let i = evento.resultIndex ?? 0; i < resultados.length; i++) {
      const item = resultados[i];
      if (!item?.isFinal) continue;
      const texto = item[0]?.transcript?.trim() ?? "";
      if (texto) onTexto(texto);
    }
  };
  rec.onend = () => {
    if (activo) {
      try {
        rec.start();
      } catch {
        /* el motor aún no estaba listo */
      }
    }
  };
  rec.onerror = () => undefined;
  try {
    rec.start();
  } catch {
    activo = false;
  }

  return () => {
    activo = false;
    try {
      rec.stop();
    } catch {
      /* ya estaba detenido */
    }
  };
}

export function hablar(texto: string) {
  if (!sintesisVozDisponible()) return;
  const limpio = texto
    .replace(/[✓🔔⚙️🎤]/g, "")
    .replace(/^•\s*/gm, "")
    .trim();
  if (!limpio) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(limpio);
  utterance.lang = "es-ES";
  utterance.rate = 1.04;
  utterance.pitch = 1;
  const voz = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith("es"));
  if (voz) utterance.voice = voz;
  window.speechSynthesis.speak(utterance);
}

export function silenciar() {
  if (sintesisVozDisponible()) window.speechSynthesis.cancel();
}

export function iaVozEtiqueta() {
  if (reconocimientoVozDisponible()) return "Voz del navegador";
  return "Voz local";
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
