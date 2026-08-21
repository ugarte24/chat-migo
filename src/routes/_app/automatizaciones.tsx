import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/automatizaciones")({
  component: () => <Navigate to="/panel" />,
});
