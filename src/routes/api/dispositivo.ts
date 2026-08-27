import { createFileRoute } from "@tanstack/react-router";
import { exigirUsuario, supabaseServicio } from "@/lib/supabase-servidor";

export const Route = createFileRoute("/api/dispositivo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const usuarioId = await exigirUsuario(request);
        if (!usuarioId) {
          return Response.json({ error: "No autenticado." }, { status: 401 });
        }
        const db = supabaseServicio();
        if (!db) {
          return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 });
        }

        const cuerpo = (await request.json().catch(() => null)) as
          | { token?: unknown; plataforma?: unknown }
          | null;
        const token = typeof cuerpo?.token === "string" ? cuerpo.token.trim() : "";
        const plataforma = cuerpo?.plataforma === "android" ? "android" : "android";
        if (token.length < 20) {
          return Response.json({ error: "Token FCM no válido." }, { status: 400 });
        }

        const { error } = await db.from("dispositivos").upsert(
          {
            usuario_id: usuarioId,
            token,
            plataforma,
            actualizado_at: new Date().toISOString(),
          },
          { onConflict: "token" },
        );
        if (error) {
          return Response.json({ error: error.message }, { status: 400 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
