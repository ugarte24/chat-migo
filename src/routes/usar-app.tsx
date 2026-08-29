import { createFileRoute, Link } from "@tanstack/react-router";
import { MarcaWeb, NOMBRE_WEB } from "@/components/DiloIcono";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/usar-app")({
  head: () => ({ meta: [{ title: `Usa la app | ${NOMBRE_WEB}` }] }),
  component: UsarAppPage,
});

function UsarAppPage() {
  const { perfil, cerrarSesion } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-glow px-4">
      <div className="w-full max-w-md panel-card space-y-4 p-6 text-center">
        <div className="flex justify-center">
          <MarcaWeb className="font-display text-lg font-semibold" />
        </div>
        <h1 className="font-display text-xl font-semibold">Dilo se usa en el teléfono</h1>
        <p className="text-sm text-muted-foreground">
          El orbe, la voz y tus tareas viven en la aplicación Android. Esta web es solo la
          presentación y el área del administrador.
        </p>
        {perfil ? (
          <p className="text-sm text-muted-foreground">
            Hola, {perfil.nombre}. Pídele el APK a quien administra Dilo e instálalo en el celular.
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
          {perfil ? (
            <Button
              variant="ghost"
              onClick={() => {
                void cerrarSesion();
              }}
            >
              Cerrar sesión
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link to="/iniciar-sesion">Soy administrador</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
