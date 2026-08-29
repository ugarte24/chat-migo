import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MarcaWeb, NOMBRE_WEB } from "@/components/DiloIcono";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { destinoTrasLogin, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/iniciar-sesion")({
  head: () => ({ meta: [{ title: `Iniciar sesión | ${NOMBRE_WEB}` }] }),
  component: IniciarSesionPage,
});

function IniciarSesionPage() {
  const { iniciarSesion, perfil, cargando } = useAuth();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!cargando && perfil) {
    return <Navigate to={destinoTrasLogin(perfil.rol)} />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const fallo = await iniciarSesion(correo, clave);
    setEnviando(false);
    if (fallo) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-glow px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <MarcaWeb className="font-display text-lg font-semibold" />
        </Link>
        <form onSubmit={(e) => void onSubmit(e)} className="panel-card space-y-4 p-6">
          <div>
            <h1 className="font-display text-xl font-semibold">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Administración en la web. Si te dieron la app, abre Dilo en el teléfono.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clave">Contraseña</Label>
            <Input
              id="clave"
              type="password"
              autoComplete="current-password"
              required
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={enviando || cargando}>
            {enviando ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
