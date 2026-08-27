import { createFileRoute } from "@tanstack/react-router";
import { exigirAdministrador, supabaseServicio } from "@/lib/supabase-servidor";

const CUBETA = "apk";
const ARCHIVO = "dilo.apk";

export const Route = createFileRoute("/api/apk")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const adminId = await exigirAdministrador(request);
        if (!adminId) {
          return Response.json({ error: "Solo el administrador puede descargar la APK." }, { status: 403 });
        }
        const db = supabaseServicio();
        if (!db) {
          return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 });
        }

        const info = new URL(request.url).searchParams.has("info");
        const { data: lista, error: errorLista } = await db.storage.from(CUBETA).list("", {
          search: ARCHIVO,
          limit: 10,
        });
        if (errorLista) {
          return Response.json(
            { error: errorLista.message, disponible: false },
            { status: errorLista.message.includes("not found") ? 404 : 400 },
          );
        }
        const archivo = (lista ?? []).find((item) => item.name === ARCHIVO);
        if (!archivo) {
          return Response.json(
            {
              disponible: false,
              error: "Aún no hay APK. En GitHub: Actions → APK → Run workflow.",
            },
            { status: 404 },
          );
        }

        if (info) {
          return Response.json({
            disponible: true,
            actualizado: archivo.updated_at ?? archivo.created_at,
            tamano: archivo.metadata && typeof archivo.metadata["size"] === "number" ? archivo.metadata["size"] : null,
          });
        }

        const { data, error } = await db.storage.from(CUBETA).createSignedUrl(ARCHIVO, 120);
        if (error || !data?.signedUrl) {
          return Response.json({ error: error?.message || "No se pudo firmar la descarga." }, { status: 400 });
        }
        return Response.json({ url: data.signedUrl });
      },
    },
  },
});
