function env(clave: string) {
  if (typeof process === "undefined" || process.env == null) return "";
  return process.env[clave]?.trim() ?? "";
}

export function whatsappConfigurado() {
  return Boolean(env("WHATSAPP_TOKEN") && env("WHATSAPP_PHONE_NUMBER_ID"));
}

export function tokenVerificacionWhatsApp() {
  return env("WHATSAPP_VERIFY_TOKEN");
}

export async function enviarWhatsApp(numero: string, texto: string) {
  const token = env("WHATSAPP_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) {
    throw new Error("WhatsApp no está configurado.");
  }
  const destino = numero.replace(/[^\d]/g, "");
  const respuesta = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: destino,
      type: "text",
      text: { body: texto },
    }),
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`WhatsApp: ${detalle}`);
  }
}

export interface MensajeWhatsAppEntrante {
  de: string;
  texto: string;
  id: string;
}

export function extraerMensajesWhatsApp(payload: unknown): MensajeWhatsAppEntrante[] {
  const root = payload as {
    entry?: {
      changes?: {
        value?: {
          messages?: { id?: string; from?: string; text?: { body?: string }; type?: string }[];
        };
      }[];
    }[];
  };
  const mensajes: MensajeWhatsAppEntrante[] = [];
  for (const entrada of root.entry ?? []) {
    for (const cambio of entrada.changes ?? []) {
      for (const m of cambio.value?.messages ?? []) {
        if (m.type && m.type !== "text") continue;
        const texto = m.text?.body?.trim();
        if (!m.from || !texto) continue;
        mensajes.push({ de: m.from, texto, id: m.id ?? `${m.from}-${texto}` });
      }
    }
  }
  return mensajes;
}
