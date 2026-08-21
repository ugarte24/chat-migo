import { Outlet, createFileRoute, Navigate } from "@tanstack/react-router";
import { UsuarioShell } from "@/components/layout/UsuarioShell";
import { useAuth } from "@/lib/auth";
import { supabaseConfigurado } from "@/lib/supabase";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { cargando, perfil } = useAuth();

  if (supabaseConfigurado) {
    if (cargando) {
      return (
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Comprobando sesión…
        </div>
      );
    }
    if (!perfil) {
      return <Navigate to="/iniciar-sesion" />;
    }
  }

  return (
    <UsuarioShell>
      <Outlet />
    </UsuarioShell>
  );
}
