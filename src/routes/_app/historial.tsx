import { createFileRoute } from "@tanstack/react-router";
import { ListaAgenda } from "@/components/panel/ListaAgenda";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/historial")({
  head: () => ({ meta: [{ title: "Historial | Dilo" }] }),
  component: HistorialPage,
});

function HistorialPage() {
  const { historial } = useAsistente();
  return (
    <ListaAgenda
      titulo="Historial"
      descripcion="Lo que Dilo hizo por vos."
      vacio="Todavía no hay actividad."
      items={historial.map((h) => ({
        id: h.id,
        titulo: h.accion,
        detalle: `${h.fecha} · ${h.hora} · ${h.solicitud}`,
        estado: h.estado,
      }))}
    />
  );
}
