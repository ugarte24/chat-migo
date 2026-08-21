import { createFileRoute } from "@tanstack/react-router";
import { DiloJarvis } from "@/components/DiloJarvis";

export const Route = createFileRoute("/_app/panel")({
  head: () => ({
    meta: [
      { title: "Dilo" },
      {
        name: "description",
        content: "Habla con Dilo para gestionar tareas, recordatorios, eventos y automatizaciones.",
      },
    ],
  }),
  component: DiloJarvis,
});
