import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/panel/PageHeader";
import { Badge } from "@/components/ui/badge";
import { INTEGRACIONES } from "@/lib/datos";
import { SERVICIOS_FUTUROS } from "@/lib/servicios";
import { useAsistente } from "@/lib/store";
import { supabaseConfigurado } from "@/lib/supabase";

export const Route = createFileRoute("/admin/integraciones")({
  head: () => ({ meta: [{ title: "Integraciones | Administración" }] }),
  component: IntegracionesPage,
});

function IntegracionesPage() {
  const { persistencia } = useAsistente();
  const integraciones = INTEGRACIONES.map((i) => {
    if (i.nombre !== "Supabase") return i;
    const estado =
      persistencia === "conectado"
        ? "Conectado"
        : persistencia === "error"
          ? "Error de conexión"
          : supabaseConfigurado
            ? "Cliente configurado"
            : "Pendiente de variables";
    return { ...i, estado };
  });

  return (
    <div>
      <PageHeader
        titulo="Integraciones"
        descripcion="Servicios que el frontend ya está preparado para conectar. En este prototipo permanecen simulados."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {integraciones.map((i) => (
          <article key={i.nombre} className="panel-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{i.nombre}</h2>
              <Badge
                variant={
                  i.estado === "Simulada" ||
                  i.estado === "Cliente configurado" ||
                  i.estado === "Conectado" ||
                  i.estado === "Listo para desplegar"
                    ? "secondary"
                    : "outline"
                }
              >
                {i.estado}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{i.descripcion}</p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Contratos listos en el código: {SERVICIOS_FUTUROS.join(" · ")}.
      </p>
    </div>
  );
}
