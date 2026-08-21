import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/memoria")({
  component: () => <Navigate to="/panel" />,
});
