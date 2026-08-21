import { createFileRoute } from "@tanstack/react-router";
import { exigirAdministrador, supabaseServicio } from "@/lib/supabase-servidor";

function correoValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

export const Route = createFileRoute("/api/usuarios")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const adminId = await exigirAdministrador(request);
        if (!adminId) {
          return Response.json({ error: "Solo el administrador puede crear cuentas." }, { status: 403 });
        }

        const db = supabaseServicio();
        if (!db) {
          return Response.json(
            { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." },
            { status: 503 },
          );
        }

        const cuerpo = (await request.json().catch(() => null)) as
          | { nombre?: unknown; correo?: unknown; clave?: unknown }
          | null;
        const nombre = typeof cuerpo?.nombre === "string" ? cuerpo.nombre.trim() : "";
        const correo = typeof cuerpo?.correo === "string" ? cuerpo.correo.trim() : "";
        const clave = typeof cuerpo?.clave === "string" ? cuerpo.clave : "";

        if (!nombre) {
          return Response.json({ error: "El nombre es obligatorio." }, { status: 400 });
        }
        if (!correoValido(correo)) {
          return Response.json({ error: "El correo no es válido." }, { status: 400 });
        }
        if (clave.length < 6) {
          return Response.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
        }

        const { data, error } = await db.auth.admin.createUser({
          email: correo,
          password: clave,
          email_confirm: true,
          user_metadata: { nombre },
        });
        if (error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ id: data.user.id });
      },
    },
  },
});
