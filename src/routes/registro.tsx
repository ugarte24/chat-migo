import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/registro")({
  head: () => ({ meta: [{ title: "Iniciar sesión | Dilo" }] }),
  component: RegistroPage,
});

function RegistroPage() {
  return <Navigate to="/iniciar-sesion" />;
}
