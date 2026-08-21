import { createFileRoute } from "@tanstack/react-router";
import { transcribirWhisper } from "@/lib/ia";

export const Route = createFileRoute("/api/transcribir")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const form = await request.formData().catch(() => null);
        const archivo = form?.get("audio");
        if (!(archivo instanceof Blob)) {
          return Response.json({ error: "Falta el audio" }, { status: 400 });
        }
        const buffer = await archivo.arrayBuffer();
        const texto = await transcribirWhisper(buffer, archivo.type || "audio/webm");
        if (!texto) return Response.json({ error: "No se pudo transcribir" }, { status: 501 });
        return Response.json({ texto });
      },
    },
  },
});
