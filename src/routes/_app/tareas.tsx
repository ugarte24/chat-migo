import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tareas")({
  component: () => <Navigate to="/panel" />,
});
