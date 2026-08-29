import { createFileRoute, Navigate } from "@tanstack/react-router";
import { NOMBRE_WEB } from "@/components/DiloIcono";

export const Route = createFileRoute("/registro")({
  head: () => ({ meta: [{ title: `Iniciar sesión | ${NOMBRE_WEB}` }] }),
  component: RegistroPage,
});

function RegistroPage() {
  return <Navigate to="/iniciar-sesion" />;
}
