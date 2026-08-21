import { createFileRoute } from "@tanstack/react-router";
import { conversarConDilo, type ContextoDilo, type MensajeDilo } from "@/lib/dilo";
import { iaConfigurada } from "@/lib/ia";

export const Route = createFileRoute("/api/dilo")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        if (!iaConfigurada()) {
          return Response.json({ error: "sin-ia" }, { status: 501 });
        }
        const cuerpo = (await request.json().catch(() => null)) as {
          mensaje?: string;
          historial?: MensajeDilo[];
          contexto?: ContextoDilo;
        } | null;
        const mensaje = cuerpo?.mensaje?.trim() ?? "";
        if (!mensaje || !cuerpo?.contexto) {
          return Response.json({ error: "Falta el mensaje" }, { status: 400 });
        }
        const turno = await conversarConDilo(mensaje, cuerpo.historial ?? [], cuerpo.contexto);
        if (!turno.texto && turno.acciones.length === 0) {
          return Response.json({ error: "sin-ia" }, { status: 502 });
        }
        return Response.json(turno);
      },
    },
  },
});
