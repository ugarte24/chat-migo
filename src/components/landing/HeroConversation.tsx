import { useEffect, useState } from "react";
import { DiloIcono } from "@/components/DiloIcono";
import { cn } from "@/lib/utils";

type Paso = 0 | 1 | 2 | 3 | 4 | 5;

export function HeroConversation() {
  const [paso, setPaso] = useState<Paso>(0);
  const [ciclo, setCiclo] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPaso(1), 450),
      window.setTimeout(() => setPaso(2), 1500),
      window.setTimeout(() => setPaso(3), 2800),
      window.setTimeout(() => setPaso(4), 4000),
      window.setTimeout(() => setPaso(5), 5200),
      window.setTimeout(() => {
        setPaso(0);
        setCiclo((c) => c + 1);
      }, 9800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [ciclo]);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgb(79_70_229/0.16),transparent_55%),radial-gradient(circle_at_80%_80%,rgb(124_58_237/0.12),transparent_50%)] blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_60px_-32px_rgb(79_70_229/0.45)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="size-2 rounded-full bg-primary/30" />
          <span className="size-2 rounded-full bg-ai/30" />
          <span className="size-2 rounded-full bg-border" />
          <DiloIcono className="size-4" />
          <p className="text-xs font-medium text-muted-foreground">Dilo</p>
        </div>

        <div className="min-h-[22rem] space-y-3 bg-[#F8FAFC] px-4 py-5">
          {paso >= 1 && (
            <p className="landing-chat-in ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
              Mañana a las 8 recuérdame enviar el informe.
            </p>
          )}

          {paso === 2 && (
            <div className="landing-chat-in flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-white px-4 py-3">
              <span className="landing-dot" />
              <span className="landing-dot" style={{ animationDelay: "0.15s" }} />
              <span className="landing-dot" style={{ animationDelay: "0.3s" }} />
              <span className="sr-only">Procesando</span>
            </div>
          )}

          {paso >= 3 && (
            <p className="landing-chat-in max-w-[88%] rounded-2xl rounded-bl-md border border-border bg-white px-4 py-3 text-sm leading-relaxed text-foreground">
              Listo. Te recordaré mañana a las 08:00 enviar el informe.
            </p>
          )}

          {paso >= 4 && (
            <div
              className={cn(
                "landing-chat-in max-w-[92%] rounded-xl border bg-white p-4",
                paso >= 5 ? "border-success/25" : "border-border",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Recordatorio creado
              </p>
              <p className="mt-1.5 text-sm font-semibold">Enviar el informe</p>
              <p className="mt-1 text-sm text-muted-foreground">Mañana · 08:00</p>
              {paso >= 5 && (
                <p className="mt-3 text-xs font-medium text-success">Completado</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
