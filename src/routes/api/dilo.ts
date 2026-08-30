import { createFileRoute } from "@tanstack/react-router";
import { fluirDilo, type ContextoDilo, type MensajeDilo } from "@/lib/dilo";

export const Route = createFileRoute("/api/dilo")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const cuerpo = (await request.json().catch(() => null)) as {
          mensaje?: string;
          historial?: MensajeDilo[];
          contexto?: ContextoDilo;
        } | null;
        const mensaje = cuerpo?.mensaje?.trim() ?? "";
        const contexto = cuerpo?.contexto;
        if (!mensaje || !contexto) {
          return Response.json({ error: "Falta el mensaje" }, { status: 400 });
        }
        const historial = cuerpo?.historial ?? [];
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const enviar = (dato: unknown) => {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(dato)}\n\n`));
              } catch {
                /* el cliente cerró el stream */
              }
            };
            try {
              for await (const ev of fluirDilo(mensaje, historial, contexto)) {
                enviar(ev);
              }
            } catch (error) {
              console.error("dilo stream", error);
              enviar({
                tipo: "listo",
                turno: { texto: "No pude responder ahora. Intenta otra vez.", acciones: [] },
              });
            }
            try {
              controller.close();
            } catch {
              /* ya cerrado */
            }
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
