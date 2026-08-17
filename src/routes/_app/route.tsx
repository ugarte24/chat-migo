import { Outlet, createFileRoute } from "@tanstack/react-router";
import { UsuarioShell } from "@/components/layout/UsuarioShell";

export const Route = createFileRoute("/_app")({
  component: () => (
    <UsuarioShell>
      <Outlet />
    </UsuarioShell>
  ),
});
