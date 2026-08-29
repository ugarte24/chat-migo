import { Button } from "@/components/ui/button";
import { useActualizacionApk } from "@/lib/apk-actualizacion";

export function AvisoActualizacionApk({ compacto = false }: { compacto?: boolean }) {
  const apk = useActualizacionApk();
  if (!apk.disponible) return null;

  return (
    <div
      role="status"
      className={
        compacto
          ? "relative z-10 mx-4 mb-1 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[13px] text-[#202124] shadow-[0_1px_2px_rgb(60_64_67/0.12)] ring-1 ring-[#dadce0]/80"
          : "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
      }
    >
      <p className={compacto ? "min-w-0 flex-1 truncate" : "min-w-0 flex-1 text-sm"}>
        Nueva versión {apk.remota}
        {apk.local ? ` · tienes ${apk.local}` : ""}. Instálala encima, sin borrar la app.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {compacto ? (
          <>
            <button type="button" className="text-[#5f6368]" onClick={apk.omitir}>
              Ahora no
            </button>
            <button
              type="button"
              className="font-medium text-[#2563eb]"
              disabled={apk.bajando}
              onClick={() => void apk.descargar()}
            >
              {apk.bajando ? "Preparando…" : "Actualizar"}
            </button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={apk.omitir}>
              Ahora no
            </Button>
            <Button size="sm" disabled={apk.bajando} onClick={() => void apk.descargar()}>
              {apk.bajando ? "Preparando…" : "Actualizar"}
            </Button>
          </>
        )}
      </div>
      {apk.error ? <p className="w-full text-xs text-destructive">{apk.error}</p> : null}
    </div>
  );
}
