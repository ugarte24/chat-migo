import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";
import { proximaEjecucion } from "@/lib/datos";
import { listarAutomatizacionesSistema, type AutomatizacionSistema } from "@/lib/repositorio";

export const Route = createFileRoute("/admin/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones | Administración" }] }),
  component: AdminAutomatizaciones,
});

function AdminAutomatizaciones() {
  const [items, setItems] = useState<AutomatizacionSistema[]>([]);

  useEffect(() => {
    void listarAutomatizacionesSistema().then(setItems);
  }, []);

  return (
    <div>
      <PageHeader
        titulo="Automatizaciones"
        descripcion="Supervisión de las automatizaciones de todos los usuarios. La memoria personal no se muestra."
      />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay automatizaciones registradas.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((a) => (
            <article key={a.id} className="panel-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{a.nombre}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{a.accion}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{a.usuario}</p>
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
      )}
    </div>
  );
}
