import { createFileRoute } from "@tanstack/react-router";
import { sintetizarVoz, vozElevenLabsId } from "@/lib/ia";

export const Route = createFileRoute("/api/hablar")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const cuerpo = (await request.json().catch(() => null)) as { texto?: string; vozId?: string } | null;
        const texto = cuerpo?.texto?.trim() ?? "";
        if (!texto) return Response.json({ error: "Falta el texto" }, { status: 400 });
        const voz = vozElevenLabsId(cuerpo?.vozId);
        const audio = await sintetizarVoz(texto, voz);
        if (!audio) return Response.json({ error: "Sin voz", voz }, { status: 501 });
        return new Response(audio, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
            "X-Dilo-Voice": voz,
          },
        });
      },
    },
  },
});
