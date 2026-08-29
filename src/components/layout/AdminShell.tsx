import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Activity,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Repeat,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";
import { MarcaWebIcono, NOMBRE_WEB } from "@/components/DiloIcono";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", etiqueta: "Dashboard", icono: LayoutDashboard, exact: true },
  { to: "/admin/usuarios", etiqueta: "Usuarios", icono: Users, exact: true },
  { to: "/admin/aplicacion", etiqueta: "Aplicación Android", icono: Smartphone, exact: true },
  { to: "/admin/actividad", etiqueta: "Actividad del sistema", icono: Activity, exact: true },
  { to: "/admin/automatizaciones", etiqueta: "Automatizaciones", icono: Repeat, exact: true },
  { to: "/admin/integraciones", etiqueta: "Integraciones", icono: Plug, exact: true },
  { to: "/admin/configuracion", etiqueta: "Configuración", icono: Settings, exact: true },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [abierto, setAbierto] = useState(false);
  const actual = NAV.find((n) => n.to === pathname);
  const { perfil, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <Link to="/" className="flex items-center gap-2.5 border-b border-border px-5 py-5">
          <MarcaWebIcono className="size-8" />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold leading-tight">{NOMBRE_WEB}</p>
            <p className="text-[11px] text-muted-foreground">Administración</p>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} activo={pathname === item.to} />
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <p className="truncate text-xs font-medium">{perfil?.nombre}</p>
          <p className="truncate text-[11px] text-muted-foreground">{perfil?.correo}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-8 w-full justify-start px-0 text-xs text-muted-foreground"
            onClick={() => {
              void cerrarSesion().then(() => navigate({ to: "/iniciar-sesion" }));
            }}
          >
            <LogOut className="mr-1.5 size-3.5" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:px-8">
          <Sheet open={abierto} onOpenChange={setAbierto}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-4 py-4 text-left">
                <SheetTitle className="inline-flex items-center gap-2">
                  <MarcaWebIcono className="size-6" />
                  {NOMBRE_WEB}
                </SheetTitle>
              </SheetHeader>
              <nav className="space-y-1 p-3">
                {NAV.map((item) => (
                  <NavItem
                    key={item.to}
                    {...item}
                    activo={pathname === item.to}
                    onClick={() => setAbierto(false)}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{actual?.etiqueta ?? "Admin"}</p>
            <p className="text-xs text-muted-foreground">Supervisión del sistema</p>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-hero-glow p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  etiqueta,
  icono: Icono,
  activo,
  onClick,
}: {
  to: (typeof NAV)[number]["to"];
  etiqueta: string;
  icono: typeof LayoutDashboard;
  activo: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        activo
          ? "bg-primary-dark text-primary-foreground shadow-soft"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <Icono className="size-4 shrink-0" />
      {etiqueta}
    </Link>
  );
}
