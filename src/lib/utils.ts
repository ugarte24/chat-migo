import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Primera palabra del nombre, para que Dilo tutee sin apellido. */
export function nombreDePila(nombre: string | null | undefined) {
  const primero = (nombre ?? "").trim().split(/\s+/)[0] ?? "";
  if (!primero || /^dilo$/i.test(primero) || /^usuario$/i.test(primero)) return "";
  return primero;
}

/** fetch con tope de tiempo, para no dejar la UI colgada. */
export async function fetchConTiempo(
  input: RequestInfo | URL,
  init: RequestInit = {},
  ms = 12_000,
): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}
