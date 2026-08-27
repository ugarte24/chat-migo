import { createSign } from "node:crypto";

function env(clave: string) {
  if (typeof process === "undefined" || process.env == null) return "";
  return process.env[clave]?.trim() ?? "";
}

interface CuentaServicio {
  project_id: string;
  client_email: string;
  private_key: string;
}

function cuentaServicio(): CuentaServicio | null {
  const crudo = env("FCM_SERVICE_ACCOUNT_JSON");
  if (!crudo) return null;
  try {
    const parsed = JSON.parse(crudo) as CuentaServicio;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

export function fcmConfigurado() {
  return cuentaServicio() != null;
}

let cacheToken: { valor: string; expira: number } | null = null;

async function tokenGoogle(cuenta: CuentaServicio) {
  const ahora = Math.floor(Date.now() / 1000);
  if (cacheToken && cacheToken.expira > ahora + 60) return cacheToken.valor;

  const encabezado = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const reclamo = Buffer.from(
    JSON.stringify({
      iss: cuenta.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: ahora,
      exp: ahora + 3600,
    }),
  ).toString("base64url");
  const firmar = createSign("RSA-SHA256");
  firmar.update(`${encabezado}.${reclamo}`);
  const jwt = `${encabezado}.${reclamo}.${firmar.sign(cuenta.private_key, "base64url")}`;

  const respuesta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  const cuerpo = (await respuesta.json()) as { access_token?: string; expires_in?: number };
  if (!respuesta.ok || !cuerpo.access_token) {
    throw new Error("FCM: no se pudo obtener el token de Google.");
  }
  cacheToken = {
    valor: cuerpo.access_token,
    expira: ahora + (cuerpo.expires_in ?? 3600),
  };
  return cacheToken.valor;
}

export type ResultadoFcm = "ok" | "invalido" | "error";

/** Envía un aviso al token FCM de la cáscara Android. */
export async function enviarFcm(token: string, titulo: string, texto: string): Promise<ResultadoFcm> {
  const cuenta = cuentaServicio();
  if (!cuenta) return "error";
  const acceso = await tokenGoogle(cuenta);
  const respuesta = await fetch(
    `https://fcm.googleapis.com/v1/projects/${cuenta.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${acceso}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: titulo, body: texto },
          android: {
            priority: "high",
            notification: { channel_id: "dilo_avisos", sound: "default" },
          },
          data: { texto },
        },
      }),
    },
  );
  if (respuesta.ok) return "ok";
  const detalle = await respuesta.text();
  if (respuesta.status === 404 || detalle.includes("UNREGISTERED")) return "invalido";
  console.error("[fcm]", detalle);
  return "error";
}
