import { supabase } from "./supabase";

declare global {
  interface Window {
    DiloNativo?: { plataforma?: string; version?: string; tokenFcm?: string };
    DiloPuente?: { plataforma?: () => string; version?: () => string; tokenFcm?: () => string };
  }
}

/** True cuando la página corre dentro de la APK (WebView con UA DiloAndroid). */
export function esCascaraAndroid() {
  if (typeof window === "undefined") return false;
  if (/DiloAndroid/i.test(navigator.userAgent)) return true;
  return window.DiloNativo?.plataforma === "android";
}

/** versionName de la APK (p. ej. 1.0.1). */
export function versionCascaraAndroid() {
  if (typeof window === "undefined") return null;
  const inyectada = window.DiloNativo?.version?.trim();
  if (inyectada) return inyectada;
  try {
    const puente = window.DiloPuente?.version?.()?.trim();
    if (puente) return puente;
  } catch {
    /* el puente nativo no está */
  }
  const marca = navigator.userAgent.match(/DiloAndroid\/(\S+)/i)?.[1];
  if (!marca) return null;
  return marca === "1" ? "1.0.0" : marca;
}

/**
 * El orbe y el producto de usuario solo se ven en la APK.
 * En `vite dev` siguen abiertos en el navegador para poder trabajar.
 */
export function productoVisibleEnEsteCliente() {
  if (import.meta.env.DEV) return true;
  return esCascaraAndroid();
}

function tokenFcmNativo() {
  const inyectado = window.DiloNativo?.tokenFcm?.trim();
  if (inyectado) return inyectado;
  try {
    return window.DiloPuente?.tokenFcm?.()?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Envía el token FCM al servidor para avisos con el teléfono cerrado. */
export async function registrarDispositivo() {
  if (!esCascaraAndroid()) return;
  const token = tokenFcmNativo();
  if (!token || !supabase) return;
  const { data } = await supabase.auth.getSession();
  const acceso = data.session?.access_token;
  if (!acceso) return;
  await fetch("/api/dispositivo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${acceso}`,
    },
    body: JSON.stringify({ token, plataforma: "android" }),
  }).catch(() => undefined);
}
