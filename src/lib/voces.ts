/** Voces premade de ElevenLabs. En el plan Free la API no admite voces de librería. */

export interface VozDilo {
  id: string;
  nombre: string;
  detalle: string;
  grupo: "hombres" | "mujeres" | "neutra";
}

export const VOZ_DEFECTO_ID = "TX3LPaxmHKxFdv7VOQHJ"; // Liam

export const VOCES_DILO: readonly VozDilo[] = [
  { id: VOZ_DEFECTO_ID, nombre: "Liam", detalle: "Joven, enérgico", grupo: "hombres" },
  { id: "IKne3meq5aSn9XLyUdCD", nombre: "Charlie", detalle: "Grave, seguro", grupo: "hombres" },
  { id: "bIHbv24MWmeRgasZH58o", nombre: "Will", detalle: "Relajado", grupo: "hombres" },
  { id: "iP95p4xoKVk53GoZ742B", nombre: "Chris", detalle: "Cercano", grupo: "hombres" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", nombre: "Roger", detalle: "Casual", grupo: "hombres" },
  { id: "cjVigY5qzO86Huf0OWal", nombre: "Eric", detalle: "Confiable", grupo: "hombres" },
  { id: "nPczCjzI2devNBz1zQrb", nombre: "Brian", detalle: "Grave, cálido", grupo: "hombres" },
  { id: "pNInz6obpgDQGcFmaJgB", nombre: "Adam", detalle: "Firme", grupo: "hombres" },
  { id: "JBFqnCBsd6RMkjVDRZzb", nombre: "George", detalle: "Narrador británico", grupo: "hombres" },
  { id: "onwK4e9ZLuTAKqWW03F9", nombre: "Daniel", detalle: "Presentador", grupo: "hombres" },
  { id: "pqHfZKP75CvOlQylNhV4", nombre: "Bill", detalle: "Maduro", grupo: "hombres" },
  { id: "N2lVS1w4EtoT3dr4eOWO", nombre: "Callum", detalle: "Ronco, personaje", grupo: "hombres" },
  { id: "SOYHLrjzK2X1ezoPC6cr", nombre: "Harry", detalle: "Intenso", grupo: "hombres" },
  { id: "FGY2WhTYpPnrIDTdsKH5", nombre: "Laura", detalle: "Joven, enérgica", grupo: "mujeres" },
  { id: "EXAVITQu4vr4xnSDxMaL", nombre: "Sarah", detalle: "Suave, profesional", grupo: "mujeres" },
  { id: "cgSgspJ2msm6clMCkdW9", nombre: "Jessica", detalle: "Alegre, cercana", grupo: "mujeres" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", nombre: "Alice", detalle: "Clara, británica", grupo: "mujeres" },
  { id: "XrExE9yKIg1WjnnlVkGX", nombre: "Matilda", detalle: "Cálida", grupo: "mujeres" },
  { id: "pFZP5JQG7iQjIQuC4Bku", nombre: "Lily", detalle: "Actriz británica", grupo: "mujeres" },
  { id: "hpp4J3VqNfWAUOO0d1Us", nombre: "Bella", detalle: "Profesional", grupo: "mujeres" },
  { id: "SAz9YHcvj6GT2YYXdXww", nombre: "River", detalle: "Neutra, calmada", grupo: "neutra" },
];

const IDS = new Set(VOCES_DILO.map((v) => v.id));

export function esVozGratis(id: string | null | undefined): boolean {
  return Boolean(id && IDS.has(id));
}

export function vozPorId(id: string | null | undefined): VozDilo {
  return VOCES_DILO.find((v) => v.id === id) ?? VOCES_DILO[0]!;
}

export function vozResuelta(id: string | null | undefined): string {
  return esVozGratis(id) ? id! : VOZ_DEFECTO_ID;
}
