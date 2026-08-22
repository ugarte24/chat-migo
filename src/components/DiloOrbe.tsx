import { cn } from "@/lib/utils";

export type EstadoOrbe = "espera" | "escuchando" | "pensando" | "hablando";

export function DiloOrbe({
  estado,
  onActivar,
}: {
  estado: EstadoOrbe;
  onActivar: () => void;
}) {
  const etiqueta =
    estado === "escuchando"
      ? "Dejar de escuchar"
      : estado === "pensando"
        ? "Dilo está pensando"
        : "Hablarle a Dilo";

  return (
    <button
      type="button"
      onClick={onActivar}
      aria-label={etiqueta}
      className="relative flex size-[min(78vw,24rem)] items-center justify-center rounded-full bg-transparent"
    >
      <span className="dilo-halo" data-estado={estado} aria-hidden />
      <span className="dilo-anillo dilo-anillo-a" data-estado={estado} aria-hidden />
      <span className="dilo-anillo dilo-anillo-b" data-estado={estado} aria-hidden />
      <span className="dilo-anillo dilo-anillo-c" data-estado={estado} aria-hidden />
      <span className={cn("dilo-orbe relative block")} data-estado={estado}>
        <span className="dilo-orbe-brillo" />
        <span className="dilo-orbe-ondas" data-estado={estado} aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </span>
    </button>
  );
}
