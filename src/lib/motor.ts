import { DIAS_SEMANA, hoyISO, type Automatizacion, type Recordatorio } from "./datos";
import { normalizar } from "./asistente";

export function textoCoincide(consulta: string, candidato: string) {
  const a = normalizar(consulta).trim();
  const b = normalizar(candidato).trim();
  if (!a || !b) return false;
  return b.includes(a) || a.includes(b);
}

export function buscarUno<T>(items: T[], consulta: string, campo: (item: T) => string): T[] {
  return items.filter((item) => textoCoincide(consulta, campo(item)));
}

export function recordatorioVencido(r: Recordatorio, ahora: Date) {
  if (!r.activo || r.estado !== "pendiente") return false;
  const [h, m] = r.hora.split(":").map(Number);
  const momento = new Date(`${r.fecha}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`);
  return momento.getTime() <= ahora.getTime();
}

export function tocaAutomatizacion(a: Automatizacion, ahora: Date) {
  if (!a.activa) return false;
  const hoy = hoyISO();
  if (a.ultimaEjecucion === hoy) return false;
  const [h, m] = a.hora.split(":").map(Number);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const minutosAuto = (h ?? 0) * 60 + (m ?? 0);
  if (minutosAhora < minutosAuto) return false;

  const f = a.frecuencia.toLowerCase();
  const diaHoy = DIAS_SEMANA[ahora.getDay()] ?? "";
  if (f.includes("todos los días") || f.includes("cada día") || f.includes("diaria")) return true;
  if (diaHoy && f.includes(diaHoy)) return true;
  if (f.includes("semana") && ahora.getDay() === 1) return true;
  if (f.includes("mes") && ahora.getDate() === 1) return true;
  return false;
}

export interface AvisoEjecutado {
  tipo: "recordatorio" | "automatizacion";
  id: string;
  texto: string;
}

export function avisosPendientes(
  recordatorios: Recordatorio[],
  automatizaciones: Automatizacion[],
  ahora = new Date(),
): AvisoEjecutado[] {
  const avisos: AvisoEjecutado[] = [];
  for (const r of recordatorios) {
    if (recordatorioVencido(r, ahora)) {
      avisos.push({
        tipo: "recordatorio",
        id: r.id,
        texto: `Recordatorio: ${r.actividad}.`,
      });
    }
  }
  for (const a of automatizaciones) {
    if (tocaAutomatizacion(a, ahora)) {
      avisos.push({
        tipo: "automatizacion",
        id: a.id,
        texto: `Automatización: ${a.accion}`,
      });
    }
  }
  return avisos;
}
