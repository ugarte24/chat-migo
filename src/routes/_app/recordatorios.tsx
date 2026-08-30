import { createFileRoute } from "@tanstack/react-router";
import { ListaAgenda } from "@/components/panel/ListaAgenda";
import { fechaCorta } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/recordatorios")({
  head: () => ({ meta: [{ title: "Recordatorios | Dilo" }] }),
  component: RecordatoriosPage,
});

function RecordatoriosPage() {
  const { recordatorios } = useAsistente();
  return (
    <ListaAgenda
      titulo="Recordatorios"
      descripcion="Avisos que Dilo te va a mandar al celular."
      vacio="No hay recordatorios. Decile a Dilo qué y cuándo recordarte."
      items={recordatorios.map((r) => ({
        id: r.id,
        titulo: r.actividad,
        detalle: `${fechaCorta(r.fecha)} · ${r.hora}`,
        estado: r.activo ? r.estado : "inactivo",
      }))}
    />
  );
}
