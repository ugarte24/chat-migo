import { useEffect, useState, type CSSProperties } from "react";
import { suscribirNivelVoz } from "@/lib/voz";

export type EstadoOrbe = "espera" | "escuchando" | "pensando" | "hablando";

export function DiloOrbe({
  estado,
  onActivar,
}: {
  estado: EstadoOrbe;
  onActivar: () => void;
}) {
  const [nivel, setNivel] = useState(0);
  const [eco, setEco] = useState(0);
  const etiqueta =
    estado === "escuchando"
      ? "Salir de la conversación"
      : estado === "pensando"
        ? "Dilo está pensando"
        : estado === "hablando"
          ? "Interrumpir a Dilo"
          : "Empezar a hablar con Dilo";

  useEffect(() => suscribirNivelVoz(setNivel), []);

  return (
    <button
      type="button"
      onClick={() => {
        setEco((n) => n + 1);
        onActivar();
      }}
      aria-label={etiqueta}
      className="relative flex size-[min(78vw,24rem)] touch-manipulation items-center justify-center rounded-full bg-transparent"
      style={{ "--dilo-nivel": nivel } as CSSProperties}
    >
      <span className="dilo-halo" data-estado={estado} aria-hidden />
      <span className="dilo-anillo dilo-anillo-a" data-estado={estado} aria-hidden />
      <span className="dilo-anillo dilo-anillo-b" data-estado={estado} aria-hidden />
      <span className="dilo-anillo dilo-anillo-c" data-estado={estado} aria-hidden />
      {eco > 0 ? <span key={eco} className="dilo-orbe-eco" aria-hidden /> : null}
      <span className="dilo-orbe relative block" data-estado={estado}>
        <span className="dilo-orbe-caustica" />
        <span className="dilo-orbe-nucleo" />
        <span className="dilo-orbe-onda" />
        <span className="dilo-orbe-sheen" />
        <span className="dilo-orbe-destello" />
        <span className="dilo-orbe-destello-fino" />
        <span className="dilo-orbe-rim" />
      </span>
    </button>
  );
}
