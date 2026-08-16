// Motor de interpretación de lenguaje natural (prototipo local, sin backend).
// Detecta intención, fecha, hora, actividad y persona a partir de una frase en español.

export type Prioridad = "alta" | "media" | "baja";
export type Estado = "pendiente" | "completada" | "cancelada";

export interface Tarea {
  id: string;
  titulo: string;
  fecha: string | null;
  prioridad: Prioridad;
  estado: Estado;
}

export interface Recordatorio {
  id: string;
  actividad: string;
  fecha: string;
  hora: string;
  estado: Estado;
}

export interface Evento {
  id: string;
  titulo: string;
  persona: string | null;
  fecha: string;
  hora: string;
  estado: Estado;
}

export interface MemoriaItem {
  id: string;
  informacion: string;
  categoria: string;
  fecha: string;
}

export interface Automatizacion {
  id: string;
  accion: string;
  frecuencia: string;
  hora: string;
  estado: "activa" | "pausada";
}

export interface Mensaje {
  id: string;
  autor: "usuario" | "asistente";
  texto: string;
  tipo: "texto" | "voz";
  hora: string;
}

export type Intencion =
  | "tarea"
  | "recordatorio"
  | "evento"
  | "automatizacion"
  | "memoria"
  | "consulta"
  | "desconocida";

export interface Interpretacion {
  intencion: Intencion;
  actividad: string;
  fecha: string | null;
  hora: string | null;
  persona: string | null;
  frecuencia: string | null;
  prioridad: Prioridad;
  faltaInformacion: boolean;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

const NUMEROS: Record<string, number> = {
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
};

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const formatoFecha = (d: Date) =>
  d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

const fechaISO = (d: Date) => d.toISOString().slice(0, 10);

function proximoDia(indice: number, base: Date) {
  const d = new Date(base);
  const delta = (indice - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

function extraerHora(texto: string): string | null {
  const n = normalizar(texto);
  const digital = n.match(/(\d{1,2})[:.](\d{2})/);
  const tarde = /\b(tarde|noche)\b/.test(n);
  if (digital) {
    let h = Number(digital[1]);
    if (tarde && h < 12) h += 12;
    return `${String(h).padStart(2, "0")}:${digital[2]}`;
  }
  const conLas = n.match(/\ba\s+las?\s+([a-z]+|\d{1,2})/);
  if (conLas) {
    const bruto = conLas[1] ?? "";
    let h = /^\d+$/.test(bruto) ? Number(bruto) : (NUMEROS[bruto] ?? NaN);
    if (Number.isNaN(h)) return null;
    if (tarde && h < 12) h += 12;
    return `${String(h).padStart(2, "0")}:00`;
  }
  return null;
}

function extraerFecha(texto: string): string | null {
  const n = normalizar(texto);
  const hoy = new Date();
  if (/\bhoy\b/.test(n)) return fechaISO(hoy);
  if (/\bpasado manana\b/.test(n)) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + 2);
    return fechaISO(d);
  }
  if (/\bmanana\b/.test(n)) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + 1);
    return fechaISO(d);
  }
  const dia = DIAS.findIndex((d) => n.includes(normalizar(d)));
  if (dia >= 0) return fechaISO(proximoDia(dia, hoy));
  const numerica = n.match(/\b(\d{1,2})\s+de\s+([a-z]+)/);
  if (numerica) {
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const mes = meses.indexOf(numerica[2] ?? "");
    if (mes >= 0) {
      const d = new Date(hoy.getFullYear(), mes, Number(numerica[1]));
      if (d < hoy) d.setFullYear(d.getFullYear() + 1);
      return fechaISO(d);
    }
  }
  return null;
}

function extraerPersona(texto: string): string | null {
  const m = texto.match(/\bcon\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/);
  if (m?.[1]) return m[1];
  const m2 = texto.match(/\ba\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/);
  return m2?.[1] ?? null;
}

function extraerFrecuencia(texto: string): string | null {
  const n = normalizar(texto);
  const dia = DIAS.findIndex((d) => n.includes("todos los " + normalizar(d)));
  if (dia >= 0) return `Todos los ${DIAS[dia]}`;
  if (/\btodos los dias\b|\bdiariamente\b|\bcada dia\b/.test(n)) return "Todos los días";
  if (/\bcada semana\b|\bsemanalmente\b|\bsemanal\b/.test(n)) return "Semanal";
  if (/\bcada mes\b|\bmensual\b/.test(n)) return "Mensual";
  return null;
}

function limpiarActividad(texto: string): string {
  let t = texto
    .replace(
      /^(por favor\s+)?(oye\s+)?(recu[eé]rdame|rec[oó]rdame|agenda(r)?|agrega(r)?( a mis tareas)?|a[ñn]ade|anota|programa(r)?|crea(r)?|guarda|recuerda que|no olvides)\s*/i,
      "",
    )
    .replace(/\b(todos los (lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)s?)\b/gi, "")
    .replace(/\b(todos los d[ií]as|cada d[ií]a|semanalmente|cada semana|mensualmente|cada mes)\b/gi, "")
    .replace(/\b(hoy|ma[ñn]ana|pasado ma[ñn]ana)\b/gi, "")
    .replace(/\b(el|los|este|pr[oó]ximo)?\s*(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi, "")
    .replace(/\ba\s+las?\s+(\d{1,2}([:.]\d{2})?|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\b/gi, "")
    .replace(/\bde la (ma[ñn]ana|tarde|noche)\b/gi, "")
    .replace(/\b(\d{1,2}[:.]\d{2})\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, "");
  if (!t) t = texto.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function interpretar(texto: string): Interpretacion {
  const n = normalizar(texto);
  const fecha = extraerFecha(texto);
  const hora = extraerHora(texto);
  const persona = extraerPersona(texto);
  const frecuencia = extraerFrecuencia(texto);
  const prioridad: Prioridad = /\burgente\b|\bimportante\b|\bprioridad alta\b/.test(n)
    ? "alta"
    : /\bcuando pueda\b|\bsin apuro\b/.test(n)
      ? "baja"
      : "media";

  let intencion: Intencion = "desconocida";
  if (/\bque tengo\b|\bque hay\b|\bmis tareas\b|\bmi agenda\b|\bconsulta(r)?\b|\bmuestrame\b|\bque recuerdas\b/.test(n)) {
    intencion = "consulta";
  } else if (frecuencia) {
    intencion = "automatizacion";
  } else if (/\brecuerda que\b|\bmi .* es\b|\bguarda que\b|\bten en cuenta\b|\bmemoriza\b|\bsiempre\b/.test(n)) {
    intencion = "memoria";
  } else if (/\brecuerdame\b|\brecordatorio\b|\bavisame\b|\bno olvides\b/.test(n)) {
    intencion = "recordatorio";
  } else if (/\breunion\b|\bcita\b|\bagenda\b|\bevento\b|\bcompromiso\b|\bconsulta medica\b/.test(n)) {
    intencion = "evento";
  } else if (/\btarea\b|\bpendiente\b|\bagrega\b|\banota\b|\bcomprar\b|\bhacer\b/.test(n)) {
    intencion = "tarea";
  }

  const actividad = limpiarActividad(texto);
  const faltaInformacion =
    (intencion === "recordatorio" || intencion === "evento") && (!fecha || !hora);

  return { intencion, actividad, fecha, hora, persona, frecuencia, prioridad, faltaInformacion };
}

export const fechaLegible = (iso: string | null) => {
  if (!iso) return "sin fecha";
  const d = new Date(iso + "T00:00:00");
  return formatoFecha(d);
};

export const horaAhora = () =>
  new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
