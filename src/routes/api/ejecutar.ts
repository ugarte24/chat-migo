import { createFileRoute } from "@tanstack/react-router";
import { ejecutarAvisosSistema } from "@/lib/ejecutar-servidor";

export const Route = createFileRoute("/api/ejecutar")({
  server: {
    handlers: {
      GET: async () => Response.json(await ejecutarAvisosSistema()),
      POST: async () => Response.json(await ejecutarAvisosSistema()),
    },
  },
});
