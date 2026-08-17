import { useEffect, useRef, useState } from "react";

export function AutomationPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [fase, setFase] = useState<"idle" | "run" | "done">("idle");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && fase === "idle") {
          setFase("run");
        }
      },
      { threshold: 0.45 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [fase]);

  useEffect(() => {
    if (fase !== "run") return;
    const t = window.setTimeout(() => setFase("done"), 1600);
    return () => clearTimeout(t);
  }, [fase]);

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-white p-5 shadow-soft md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Automatización
      </p>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <Dato etiqueta="Nombre" valor="Reporte semanal" />
        <Dato etiqueta="Frecuencia" valor="Todos los viernes" />
        <Dato etiqueta="Hora" valor="17:00" />
        <Dato etiqueta="Acción" valor="Recordarme enviar el reporte" />
      </dl>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-[#F8FAFC] px-4 py-3">
        <span className="text-sm text-muted-foreground">Estado</span>
        <span className="text-xs font-semibold tracking-wide text-success">ACTIVA</span>
      </div>

      <div className="mt-5 min-h-[3.5rem] space-y-1.5 text-sm">
        {fase === "run" && <p className="landing-chat-in text-muted-foreground">Ejecutando…</p>}
        {fase === "done" && (
          <>
            <p className="landing-chat-in font-medium text-foreground">Automatización ejecutada</p>
            <p className="landing-chat-in text-success" style={{ animationDelay: "0.2s" }}>
              Recordatorio enviado
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 font-medium">{valor}</dd>
    </div>
  );
}
