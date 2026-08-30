import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { suscribirNivelVoz } from "@/lib/voz";

export type EstadoOrbe = "espera" | "escuchando" | "pensando" | "hablando";

const BARRAS = 14;
const PUNTOS = 36;
const ANILLOS = [0.58, 0.68, 0.78, 0.86, 0.93, 0.995];

function campana(lado: "izq" | "der") {
  return Array.from({ length: BARRAS }, (_, i) => {
    const t = lado === "izq" ? i / (BARRAS - 1) : 1 - i / (BARRAS - 1);
    return 0.12 + 0.88 * t * t * (3 - 2 * t);
  });
}

const BARRAS_IZQ = campana("izq");
const BARRAS_DER = campana("der");

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

  const puntos = useMemo(
    () =>
      Array.from({ length: PUNTOS }, (_, i) => {
        const a = (i / PUNTOS) * Math.PI * 2 - Math.PI / 2;
        return { cx: 50 + Math.cos(a) * 46.6, cy: 50 + Math.sin(a) * 46.6 };
      }),
    [],
  );

  useEffect(() => suscribirNivelVoz(setNivel), []);

  return (
    <button
      type="button"
      onClick={() => {
        setEco((n) => n + 1);
        onActivar();
      }}
      aria-label={etiqueta}
      className="dilo-core touch-manipulation"
      style={{ "--dilo-nivel": nivel } as CSSProperties}
      data-estado={estado}
    >
      <span className="dilo-core-escena" aria-hidden>
        <span className="dilo-core-fondo" />
        <svg className="dilo-core-anillos" viewBox="0 0 200 200">
          {ANILLOS.map((t) => (
            <circle key={t} cx="100" cy="100" r={t * 98} fill="none" />
          ))}
        </svg>
        <Ondas lado="izq" barras={BARRAS_IZQ} />
        <Ondas lado="der" barras={BARRAS_DER} />
        <svg className="dilo-core-puntos" viewBox="0 0 100 100">
          {puntos.map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy} r="1.15" fill="currentColor" />
          ))}
        </svg>
        <span className="dilo-core-halo" />
        <span className="dilo-core-mic">
          <span className="dilo-core-mic-luz" />
          <MicGlifo />
        </span>
        {eco > 0 ? <span key={eco} className="dilo-core-eco" /> : null}
      </span>
    </button>
  );
}

function MicGlifo() {
  return (
    <svg className="dilo-core-mic-icono" viewBox="0 0 24 24">
      <rect x="9" y="2.4" width="6" height="11.2" rx="3" fill="currentColor" />
      <path
        d="M7.2 11.6a4.8 4.8 0 0 0 9.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 16.4v3.2M8.6 20.4h6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Ondas({ lado, barras }: { lado: "izq" | "der"; barras: number[] }) {
  return (
    <span className={`dilo-core-ondas dilo-core-ondas-${lado}`}>
      {barras.map((factor, i) => (
        <span
          key={`${lado}-${i}`}
          className="dilo-core-barra"
          style={{ "--dilo-barra": factor } as CSSProperties}
        />
      ))}
    </span>
  );
}

export function DiloNucleoMini({ activo = false }: { activo?: boolean }) {
  return (
    <span className="dilo-core-mini" data-activo={activo ? "si" : "no"} aria-hidden>
      <span />
    </span>
  );
}
