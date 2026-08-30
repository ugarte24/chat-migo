import { createFileRoute } from "@tanstack/react-router";
import { ListaAgenda } from "@/components/panel/ListaAgenda";
import { fechaCorta } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/eventos")({
  head: () => ({ meta: [{ title: "Eventos | Dilo" }] }),
  component: EventosPage,
});

function EventosPage() {
  const { eventos } = useAsistente();
  return (
    <ListaAgenda
      titulo="Eventos"
      descripcion="Reuniones y compromisos que Dilo tiene anotados."
      vacio="No hay eventos. Pedile a Dilo que agende uno."
      items={eventos.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        detalle: [e.persona, `${fechaCorta(e.fecha)} · ${e.hora}`].filter(Boolean).join(" · "),
        estado: e.estado,
      }))}
    />
  );
}
