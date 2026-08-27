import { createFileRoute } from "@tanstack/react-router";
import { exigirAdministrador, supabaseServicio } from "@/lib/supabase-servidor";

type RolPerfil = "usuario" | "administrador";

function correoValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function rolValido(valor: unknown): valor is RolPerfil {
  return valor === "usuario" || valor === "administrador";
}

async function quedaOtroAdministrador(
  db: NonNullable<ReturnType<typeof supabaseServicio>>,
  exceptoId: string,
) {
  const { data } = await db.from("perfiles").select("id").eq("rol", "administrador");
  return (data ?? []).some((fila) => fila.id !== exceptoId);
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
          | { nombre?: unknown; correo?: unknown; clave?: unknown; rol?: unknown }
          | null;
        const nombre = typeof cuerpo?.nombre === "string" ? cuerpo.nombre.trim() : "";
        const correo = typeof cuerpo?.correo === "string" ? cuerpo.correo.trim() : "";
        const clave = typeof cuerpo?.clave === "string" ? cuerpo.clave : "";
        const rol: RolPerfil = rolValido(cuerpo?.rol) ? cuerpo.rol : "usuario";

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

        const { error: errorPerfil } = await db
          .from("perfiles")
          .update({ nombre, correo, rol })
          .eq("id", data.user.id);
        if (errorPerfil) {
          return Response.json({ error: errorPerfil.message }, { status: 400 });
        }

        return Response.json({ id: data.user.id });
      },

      PATCH: async ({ request }) => {
        const adminId = await exigirAdministrador(request);
        if (!adminId) {
          return Response.json({ error: "Solo el administrador puede editar cuentas." }, { status: 403 });
        }

        const db = supabaseServicio();
        if (!db) {
          return Response.json(
            { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." },
            { status: 503 },
          );
        }

        const cuerpo = (await request.json().catch(() => null)) as
          | { id?: unknown; nombre?: unknown; correo?: unknown; clave?: unknown; rol?: unknown }
          | null;
        const id = typeof cuerpo?.id === "string" ? cuerpo.id : "";
        const nombre = typeof cuerpo?.nombre === "string" ? cuerpo.nombre.trim() : "";
        const correo = typeof cuerpo?.correo === "string" ? cuerpo.correo.trim() : "";
        const clave = typeof cuerpo?.clave === "string" ? cuerpo.clave : "";
        const rol: RolPerfil = rolValido(cuerpo?.rol) ? cuerpo.rol : "usuario";

        if (!id) {
          return Response.json({ error: "Falta el usuario." }, { status: 400 });
        }
        if (!nombre) {
          return Response.json({ error: "El nombre es obligatorio." }, { status: 400 });
        }
        if (!correoValido(correo)) {
          return Response.json({ error: "El correo no es válido." }, { status: 400 });
        }
        if (clave && clave.length < 6) {
          return Response.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
        }

        if (rol === "usuario") {
          const hayOtro = await quedaOtroAdministrador(db, id);
          if (!hayOtro) {
            return Response.json(
              { error: "Debe quedar al menos un administrador." },
              { status: 400 },
            );
          }
        }

        const auth: { email?: string; password?: string; user_metadata: { nombre: string } } = {
          email: correo,
          user_metadata: { nombre },
        };
        if (clave) auth.password = clave;

        const { error: errorAuth } = await db.auth.admin.updateUserById(id, auth);
        if (errorAuth) {
          return Response.json({ error: errorAuth.message }, { status: 400 });
        }

        const { error: errorPerfil } = await db
          .from("perfiles")
          .update({ nombre, correo, rol })
          .eq("id", id);
        if (errorPerfil) {
          return Response.json({ error: errorPerfil.message }, { status: 400 });
        }

        return Response.json({ id });
      },
    },
  },
});
