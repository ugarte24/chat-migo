import { createFileRoute } from "@tanstack/react-router";
import { ListaAgenda } from "@/components/panel/ListaAgenda";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/memoria")({
  head: () => ({ meta: [{ title: "Memoria | Dilo" }] }),
  component: MemoriaPage,
});

function MemoriaPage() {
  const { memoria } = useAsistente();
  return (
    <ListaAgenda
      titulo="Memoria"
      descripcion="Lo que le pediste a Dilo que recuerde de vos."
      vacio="La memoria está vacía. Contale a Dilo algo que quieras que recuerde."
      items={memoria.map((m) => ({
        id: m.id,
        titulo: m.informacion,
        detalle: m.categoria,
        estado: "guardado",
      }))}
    />
  );
}
