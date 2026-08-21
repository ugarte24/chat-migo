import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/chat")({
  component: () => <Navigate to="/panel" />,
});
