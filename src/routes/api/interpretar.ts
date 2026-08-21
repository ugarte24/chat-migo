import { createFileRoute } from "@tanstack/react-router";
import { interpretarConIa } from "@/lib/ia";

export const Route = createFileRoute("/api/interpretar")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const cuerpo = (await request.json().catch(() => null)) as { texto?: string } | null;
        const texto = cuerpo?.texto?.trim() ?? "";
        if (!texto) return Response.json({ error: "Falta el texto" }, { status: 400 });
        const resultado = await interpretarConIa(texto);
        return Response.json(resultado);
      },
    },
  },
});
