import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/eventos")({
  component: () => <Navigate to="/panel" />,
});
