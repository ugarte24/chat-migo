import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/historial")({
  component: () => <Navigate to="/panel" />,
});
