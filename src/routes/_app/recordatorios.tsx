import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/recordatorios")({
  component: () => <Navigate to="/panel" />,
});
