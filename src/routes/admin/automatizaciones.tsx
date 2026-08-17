import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";
import { proximaEjecucion } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/admin/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones | Administración" }] }),
  component: AdminAutomatizaciones,
});

function AdminAutomatizaciones() {
  const { automatizaciones } = useAsistente();

  return (
    <div>
      <PageHeader
        titulo="Automatizaciones"
        descripcion="Supervisión de las automatizaciones activas en el prototipo. La ejecución real se conectará al motor programado."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {automatizaciones.map((a) => (
          <article key={a.id} className="panel-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{a.nombre}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{a.accion}</p>
              </div>
              <EstadoBadge valor={a.activa ? "activa" : "inactivo"} />
            </div>
            <p className="mt-4 text-sm">
              {a.frecuencia} · {a.hora}
            </p>
            <p className="mt-1 text-xs text-success">
              Próxima ejecución: {proximaEjecucion(a.frecuencia, a.hora)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
