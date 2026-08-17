function envProceso(clave: string): string {
  if (typeof process === "undefined" || process.env == null) return "";
  return process.env[clave]?.trim() ?? "";
}

function normalizarUrl(valor: string): string {
  const limpio = valor.trim().replace(/\/$/, "");
  if (!limpio) return "";
  if (limpio.startsWith("http://") || limpio.startsWith("https://")) return limpio;
  return `https://${limpio}`;
}

/** URL pública de la app: .env, Vercel o el origen del navegador. */
export function urlPublicaApp(): string {
  const explicita = import.meta.env.VITE_PUBLIC_APP_URL;
  if (explicita?.trim()) return normalizarUrl(explicita);

  const produccion = envProceso("VERCEL_PROJECT_PRODUCTION_URL");
  if (produccion) return normalizarUrl(produccion);

  const preview = envProceso("VERCEL_URL");
  if (preview) return normalizarUrl(preview);

  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** True cuando el código corre en una Function de Vercel (no en el navegador). */
export function desplegadoEnVercel(): boolean {
  return envProceso("VERCEL") === "1";
}

export function entornoVercel(): "production" | "preview" | "development" | "" {
  const vercelEnv = envProceso("VERCEL_ENV");
  if (vercelEnv === "production" || vercelEnv === "preview" || vercelEnv === "development") {
    return vercelEnv;
  }
  return "";
}
