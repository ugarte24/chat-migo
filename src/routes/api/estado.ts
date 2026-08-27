import { createFileRoute } from "@tanstack/react-router";
import { desplegadoEnVercel, urlCronEjecutar, urlWebhookWhatsApp } from "@/lib/entorno";
import { fcmConfigurado } from "@/lib/fcm";
import { geminiConfigurado, iaConfigurada } from "@/lib/ia";
import { servicioRoleConfigurado } from "@/lib/supabase-servidor";
import { whatsappConfigurado } from "@/lib/whatsapp";

export const Route = createFileRoute("/api/estado")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          whatsapp: whatsappConfigurado(),
          fcm: fcmConfigurado(),
          gemini: geminiConfigurado(),
          ia: iaConfigurada(),
          servicio: servicioRoleConfigurado(),
          vercel: desplegadoEnVercel(),
          webhook: urlWebhookWhatsApp(),
          cron: urlCronEjecutar(),
        }),
    },
  },
});
