import { Outlet, createFileRoute, Link, Navigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { productoVisibleEnEsteCliente } from "@/lib/nativo";
import { supabaseConfigurado } from "@/lib/supabase";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { cargando, perfil } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  if (!montado || (supabaseConfigurado && cargando)) {
    return (
      <div className="font-dilo flex min-h-screen items-center justify-center text-sm text-[#5f6368]">
        Comprobando sesión…
      </div>
    );
  }

  if (supabaseConfigurado && !perfil) {
    return <Navigate to="/iniciar-sesion" />;
  }

  if (!productoVisibleEnEsteCliente()) {
    if (perfil?.rol === "administrador") return <Navigate to="/admin" />;
    return <Navigate to="/usar-app" />;
  }

  if (pathname === "/panel" || pathname === "/chat") {
    return <Outlet />;
  }

  return (
    <div className="font-dilo flex h-svh min-h-0 flex-col bg-[#f8f9fa]">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#dadce0] bg-white px-4">
        <Link
          to="/panel"
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-[#2563eb] hover:bg-[#eff6ff]"
        >
          <ArrowLeft className="size-4" />
          Dilo
        </Link>
        <p className="min-w-0 text-[16px] text-[#202124]">Configuración</p>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
