import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/panel/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/aplicacion")({
  head: () => ({ meta: [{ title: "Aplicación Android | Administración" }] }),
  component: AplicacionPage,
});

interface InfoApk {
  disponible: boolean;
  version: string | null;
  versionCode: number | null;
  archivo: string | null;
  actualizado: string | null;
  tamano: number | null;
  error: string | null;
}

function formatoTamano(bytes: number | null | undefined) {
  if (bytes == null || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AplicacionPage() {
  const [info, setInfo] = useState<InfoApk | null>(null);
  const [cargando, setCargando] = useState(true);
  const [bajando, setBajando] = useState(false);

  const cargar = useCallback(async () => {
    if (!supabase) {
      setInfo({
        disponible: false,
        version: null,
        versionCode: null,
        archivo: null,
        actualizado: null,
        tamano: null,
        error: "Supabase no está configurado.",
      });
      setCargando(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setInfo({
        disponible: false,
        version: null,
        versionCode: null,
        archivo: null,
        actualizado: null,
        tamano: null,
        error: "Debes iniciar sesión.",
      });
      setCargando(false);
      return;
    }
    const res = await fetch("/api/apk?info=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cuerpo = (await res.json().catch(() => ({}))) as Partial<InfoApk> & { error?: string };
    setInfo({
      disponible: Boolean(cuerpo.disponible),
      version: cuerpo.version ?? null,
      versionCode: typeof cuerpo.versionCode === "number" ? cuerpo.versionCode : null,
      archivo: cuerpo.archivo ?? null,
      actualizado: cuerpo.actualizado ?? null,
      tamano: cuerpo.tamano ?? null,
      error: cuerpo.error ?? null,
    });
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function descargar() {
    if (!supabase) return;
    setBajando(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      toast.error("Debes iniciar sesión.");
      setBajando(false);
      return;
    }
    const res = await fetch("/api/apk", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cuerpo = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    setBajando(false);
    if (!res.ok || !cuerpo.url) {
      toast.error(cuerpo.error || "No se pudo obtener la APK.");
      return;
    }
    window.location.href = cuerpo.url;
  }

  const tamano = formatoTamano(info?.tamano);
  const fecha = info?.actualizado
    ? new Date(info.actualizado).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })
    : null;
  const nombreArchivo = info?.archivo || (info?.version ? `Dilo-${info.version}.apk` : "Dilo.apk");

  return (
    <div>
      <PageHeader
        titulo="Aplicación Android"
        descripcion="Cada vez que se publica un APK nuevo, la versión sube sola. Los usuarios ven un aviso en el celular para instalarla encima."
      />
      <article className="panel-card space-y-4 p-6">
        <h2 className="font-display text-base font-semibold">Descargar APK</h2>
        {cargando ? (
          <p className="text-sm text-muted-foreground">Comprobando si hay un instalador…</p>
        ) : info?.disponible ? (
          <p className="text-sm text-muted-foreground">
            {info.version
              ? `Versión ${info.version}${info.versionCode != null ? ` (${info.versionCode})` : ""}`
              : "Lista para instalar"}
            {fecha ? ` · ${fecha}` : ""}
            {tamano ? ` · ${tamano}` : ""}. El archivo es {nombreArchivo}. Instálala encima de la
            anterior, sin borrar la app.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {info?.error ||
              "Aún no hay APK. En GitHub abre Actions → APK → Run workflow. Hace falta añadir los secretos SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void descargar()} disabled={bajando || !info?.disponible}>
            {bajando ? "Preparando…" : `Descargar ${nombreArchivo}`}
          </Button>
          <Button variant="outline" onClick={() => void cargar()} disabled={cargando}>
            Actualizar estado
          </Button>
        </div>
      </article>
      <article className="panel-card mt-6 space-y-2 p-6 text-sm text-muted-foreground">
        <p>
          Los usuarios inician sesión dentro de la app, no en esta web. Crea cuentas en{" "}
          <Link to="/admin/usuarios" className="text-foreground underline">
            Usuarios
          </Link>{" "}
          y pásales este APK.
        </p>
        <p>
          La versión se incrementa sola en cada publicación (Actions → APK, o un push que toque
          `android/`). No hay que editarla a mano. El archivo queda como Dilo-1.0.2.apk,
          Dilo-1.0.3.apk, etc.
        </p>
        <p>
          Solo vuelve a generar un APK si cambias icono, permisos, FCM o la URL de Vercel embebida
          en Android. El resto de la interfaz se actualiza con cada git push a Vercel, sin
          reinstalar.
        </p>
      </article>
    </div>
  );
}
