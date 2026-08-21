import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/badge";
import { INTEGRACIONES } from "@/lib/datos";
import { urlCronEjecutar, urlPublicaApp, urlWebhookWhatsApp } from "@/lib/entorno";
import { SERVICIOS_FUTUROS } from "@/lib/servicios";
import { useAsistente } from "@/lib/store";
import { supabaseConfigurado } from "@/lib/supabase";
import { reconocimientoVozDisponible } from "@/lib/voz";

export const Route = createFileRoute("/admin/integraciones")({
  head: () => ({ meta: [{ title: "Integraciones | Administración" }] }),
  component: IntegracionesPage,
});

interface EstadoServicios {
  whatsapp: boolean;
  ia: boolean;
  servicio: boolean;
  vercel: boolean;
  webhook: string;
  cron: string;
}

function IntegracionesPage() {
  const { persistencia } = useAsistente();
  const [remoto, setRemoto] = useState<EstadoServicios | null>(null);

  useEffect(() => {
    void fetch("/api/estado")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: EstadoServicios | null) => setRemoto(data))
      .catch(() => setRemoto(null));
  }, []);

  const integraciones = INTEGRACIONES.map((i) => {
    if (i.nombre === "Supabase") {
      const estado =
        persistencia === "conectado"
          ? "Conectado"
          : persistencia === "error"
            ? "Error de conexión"
            : supabaseConfigurado
              ? "Cliente configurado"
              : "Pendiente de variables";
      return { ...i, estado };
    }
    if (i.nombre === "WhatsApp Business Platform") {
      return { ...i, estado: remoto?.whatsapp ? "Conectado" : "Pendiente de conexión" };
    }
    if (i.nombre === "API de inteligencia artificial") {
      return { ...i, estado: remoto?.ia ? "Conectada" : "Motor local" };
    }
    if (i.nombre === "Reconocimiento de voz") {
      return { ...i, estado: reconocimientoVozDisponible() ? "Navegador" : "Local" };
    }
    if (i.nombre === "Vercel") {
      return { ...i, estado: remoto?.vercel ? "Desplegado" : "Listo para desplegar" };
    }
    if (i.nombre === "Motor de automatización") {
      return { ...i, estado: remoto?.servicio ? "Cron + panel" : "Panel (cada 20 s)" };
    }
    return i;
  });

  const webhook = remoto?.webhook || urlWebhookWhatsApp();
  const cron = remoto?.cron || urlCronEjecutar();

  return (
    <div>
      <PageHeader
        titulo="Integraciones"
        descripcion="Servicios conectados. WhatsApp e IA se activan con variables de servidor (sin prefijo VITE_)."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {integraciones.map((i) => (
          <article key={i.nombre} className="panel-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{i.nombre}</h2>
              <Badge variant="secondary">{i.estado}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{i.descripcion}</p>
          </article>
        ))}
      </div>
      <div className="panel-card mt-6 space-y-2 p-5 text-sm">
        <p>
          Webhook de WhatsApp: <code className="text-xs">{webhook}</code>
        </p>
        <p>
          Cron de avisos: <code className="text-xs">{cron}</code>
        </p>
        <p className="text-xs text-muted-foreground">
          Origen actual: {urlPublicaApp() || "local"}. Contratos: {SERVICIOS_FUTUROS.join(" · ")}.
        </p>
      </div>
    </div>
  );
}
