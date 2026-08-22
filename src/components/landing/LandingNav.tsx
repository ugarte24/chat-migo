import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { DiloMarca } from "@/components/DiloIcono";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "#inicio", etiqueta: "Inicio" },
  { href: "#como-funciona", etiqueta: "Cómo funciona" },
  { href: "#funciones", etiqueta: "Funciones" },
  { href: "#beneficios", etiqueta: "Beneficios" },
  { href: "#precios", etiqueta: "Precios" },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/80 bg-white/80 shadow-[0_8px_30px_-18px_rgb(15_23_42/0.25)] backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:h-[4.25rem] md:px-8">
        <a href="#inicio" className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-foreground">
          <DiloMarca className="font-extrabold tracking-tight" />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Secciones">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.etiqueta}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/iniciar-sesion">Iniciar sesión</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/iniciar-sesion">Comenzar ahora</Link>
          </Button>
        </div>

        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="text-left font-extrabold">
                <DiloMarca className="font-extrabold" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4" aria-label="Menú móvil">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  className="text-base font-medium text-foreground"
                >
                  {item.etiqueta}
                </a>
              ))}
              <Button asChild variant="ghost" className="mt-4 justify-start px-0">
                <Link to="/iniciar-sesion" onClick={() => setAbierto(false)}>
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild>
                <Link to="/iniciar-sesion" onClick={() => setAbierto(false)}>
                  Comenzar ahora
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
