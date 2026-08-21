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
      className="relative flex size-[min(72vw,22rem)] items-center justify-center rounded-full bg-transparent"
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-[8%] rounded-full border border-[#dadce0]",
          estado === "escuchando" && "border-[#1a73e8]/40",
        )}
        aria-hidden
      />
      <span
        className={cn("dilo-orbe relative block", estado === "escuchando" && "scale-[1.03]")}
        data-estado={estado}
      >
        <span className="dilo-orbe-brillo" />
      </span>
    </button>
  );
}
