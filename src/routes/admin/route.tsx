import { Outlet, createFileRoute, Navigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { cargando, perfil } = useAuth();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Comprobando sesión…
      </div>
    );
  }

  if (perfil?.rol !== "administrador") {
    return <Navigate to="/iniciar-sesion" />;
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
