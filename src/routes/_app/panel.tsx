import { createFileRoute } from "@tanstack/react-router";
import { Dilo } from "@/components/DiloJarvis";

export const Route = createFileRoute("/_app/panel")({
  head: () => ({
    meta: [
      { title: "Dilo" },
      { name: "description", content: "Habla con Dilo. Él se encarga del resto." },
    ],
  }),
  component: Dilo,
});
