import { createFileRoute } from "@tanstack/react-router";
import { sintetizarVoz } from "@/lib/ia";

export const Route = createFileRoute("/api/hablar")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const cuerpo = (await request.json().catch(() => null)) as { texto?: string } | null;
        const texto = cuerpo?.texto?.trim() ?? "";
        if (!texto) return Response.json({ error: "Falta el texto" }, { status: 400 });
        const audio = await sintetizarVoz(texto);
        if (!audio) return Response.json({ error: "Sin voz" }, { status: 501 });
        return new Response(audio, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
