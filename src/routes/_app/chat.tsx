import { createFileRoute } from "@tanstack/react-router";
import { CuadernoDilo } from "@/components/CuadernoDilo";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Conversación | Dilo" }] }),
  component: CuadernoDilo,
});
