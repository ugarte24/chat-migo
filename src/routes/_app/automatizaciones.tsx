import { createFileRoute } from "@tanstack/react-router";
import { ListaAgenda } from "@/components/panel/ListaAgenda";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones | Dilo" }] }),
  component: AutomatizacionesPage,
});

function AutomatizacionesPage() {
  const { automatizaciones } = useAsistente();
  return (
    <ListaAgenda
      titulo="Automatizaciones"
      descripcion="Acciones que Dilo repite solo, a la hora que le dijiste."
      vacio="No hay automatizaciones. Pedile a Dilo algo recurrente, como todos los lunes."
      items={automatizaciones.map((a) => ({
        id: a.id,
        titulo: a.nombre,
        detalle: `${a.frecuencia} · ${a.hora}`,
        estado: a.activa ? "activa" : "inactivo",
      }))}
    />
  );
}
