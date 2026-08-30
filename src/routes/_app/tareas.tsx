import { createFileRoute } from "@tanstack/react-router";
import { ListaAgenda } from "@/components/panel/ListaAgenda";
import { fechaCorta } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/tareas")({
  head: () => ({ meta: [{ title: "Tareas | Dilo" }] }),
  component: TareasPage,
});

function TareasPage() {
  const { tareas } = useAsistente();
  return (
    <ListaAgenda
      titulo="Tareas"
      descripcion="Lo que Dilo anotó para vos. Pedile por voz para agregar o marcar como hecho."
      vacio="Todavía no hay tareas. Decile a Dilo qué tenés que hacer."
      items={tareas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        detalle: [t.fecha ? fechaCorta(t.fecha) : null, t.prioridad].filter(Boolean).join(" · "),
        estado: t.estado,
      }))}
    />
  );
}
