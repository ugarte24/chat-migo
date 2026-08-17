import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  AudioLines,
  Bell,
  Brain,
  CalendarDays,
  History,
  LayoutDashboard,
  ListTodo,
  Menu,
  MessageCircle,
  Repeat,
  Settings,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAsistente } from "@/lib/store";

const NAV = [
  { to: "/panel", etiqueta: "Inicio", icono: LayoutDashboard, exact: true },
  { to: "/chat", etiqueta: "Chat", icono: MessageCircle, exact: true },
  { to: "/tareas", etiqueta: "Tareas", icono: ListTodo, exact: true },
  { to: "/recordatorios", etiqueta: "Recordatorios", icono: Bell, exact: true },
  { to: "/eventos", etiqueta: "Eventos", icono: CalendarDays, exact: true },
  { to: "/automatizaciones", etiqueta: "Automatizaciones", icono: Repeat, exact: true },
  { to: "/memoria", etiqueta: "Memoria", icono: Brain, exact: true },
  { to: "/historial", etiqueta: "Historial", icono: History, exact: true },
  { to: "/configuracion", etiqueta: "Configuración", icono: Settings, exact: true },
] as const;

export function UsuarioShell({ children }: { children: ReactNode }) {
  const { usuario } = useAsistente();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [abierto, setAbierto] = useState(false);
  const actual = NAV.find((n) => n.to === pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <Marca />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} activo={pathname === item.to} />
          ))}
        </nav>
        <PieUsuario usuario={usuario} />
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
                <SheetTitle className="font-display">Dilo</SheetTitle>
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
            <p className="truncate text-sm font-semibold">{actual?.etiqueta ?? "Panel"}</p>
            <p className="truncate text-xs text-muted-foreground">Panel del usuario · {usuario}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/">Sitio público</Link>
          </Button>
        </header>
        <main className="flex-1 overflow-auto bg-hero-glow p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function Marca() {
  return (
    <Link to="/" className="flex items-center gap-2 border-b border-border px-5 py-5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-accent text-primary-foreground">
        <AudioLines className="size-5" />
      </span>
      <span className="font-display text-base font-semibold">Dilo</span>
    </Link>
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
          ? "bg-primary text-primary-foreground shadow-soft"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <Icono className="size-4 shrink-0" />
      {etiqueta}
    </Link>
  );
}

function PieUsuario({ usuario }: { usuario: string }) {
  return (
    <div className="space-y-2 border-t border-border p-4">
      <p className="truncate text-sm font-medium">{usuario}</p>
      <p className="text-xs text-muted-foreground">Cuenta personal · prototipo</p>
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <Shield className="size-3.5" /> Área del administrador
      </Link>
    </div>
  );
}
