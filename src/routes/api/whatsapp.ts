import { createFileRoute } from "@tanstack/react-router";
import { persistirInterpretacion } from "@/lib/aplicar-servidor";
import { interpretarConIa } from "@/lib/ia";
import { supabaseServicio } from "@/lib/supabase-servidor";
import {
  extraerMensajesWhatsApp,
  enviarWhatsApp,
  tokenVerificacionWhatsApp,
  whatsappConfigurado,
} from "@/lib/whatsapp";

export const Route = createFileRoute("/api/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode === "subscribe" && token && token === tokenVerificacionWhatsApp()) {
          return new Response(challenge ?? "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },
      POST: async ({ request }: { request: Request }) => {
        if (!whatsappConfigurado()) {
          return Response.json({ ok: false, motivo: "WhatsApp no configurado" }, { status: 503 });
        }
        const db = supabaseServicio();
        if (!db) {
          return Response.json({ ok: false, motivo: "Falta service role" }, { status: 503 });
        }
        const payload = await request.json().catch(() => null);
        const mensajes = extraerMensajesWhatsApp(payload);
        for (const mensaje of mensajes) {
          const digits = mensaje.de.replace(/\D/g, "");
          const { data: perfiles } = await db.from("perfiles").select("id, numero");
          const perfil = (perfiles ?? []).find((p) => (p.numero ?? "").replace(/\D/g, "").endsWith(digits.slice(-8)));
          let usuarioId = perfil?.id;
          if (!usuarioId) {
            usuarioId = crypto.randomUUID();
            await db.from("perfiles").insert({
              id: usuarioId,
              nombre: `WhatsApp ${digits.slice(-4)}`,
              numero: `+${digits}`,
              rol: "usuario",
            });
          }
          const interpretacion = await interpretarConIa(mensaje.texto);
          const respuesta = await persistirInterpretacion(db, usuarioId, mensaje.texto, interpretacion);
          try {
            await enviarWhatsApp(mensaje.de, respuesta);
          } catch (error) {
            console.error("[whatsapp] respuesta", error);
          }
        }
        return Response.json({ ok: true, procesados: mensajes.length });
      },
    },
  },
});
