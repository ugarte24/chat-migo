import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Mic, Settings, Shield, Volume2, VolumeX } from "lucide-react";
import { DiloOrbe, type EstadoOrbe } from "@/components/DiloOrbe";
import { useAuth } from "@/lib/auth";
import { useAsistente } from "@/lib/store";
import {
  iniciarGrabacion,
  microfonoDisponible,
  silenciar,
  transcribirAudio,
  desbloquearAudio,
} from "@/lib/voz";

const ESTADO_TEXTO: Record<EstadoOrbe, string> = {
  espera: "En espera",
  escuchando: "Escuchando",
  pensando: "Pensando",
  hablando: "Hablando",
};

export function Dilo() {
  const { mensajes, enviarMensaje, configuracion, actualizarConfiguracion, pensando } =
    useAsistente();
  const { perfil, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const detenerRef = useRef<(() => Promise<Blob>) | null>(null);
  const cortandoRef = useRef(false);
  const hayMic = microfonoDisponible();

  const visibles = mensajes.filter((m) => m.tipo !== "proceso" && m.tipo !== "analisis");
  const ultimoAsistente = [...visibles].reverse().find((m) => m.autor === "asistente");

  useEffect(() => {
    if (pensando || grabando || transcribiendo || !ultimoAsistente || ultimoAsistente.id === "msg-welcome") {
      setHablando(false);
      return;
    }
    setHablando(true);
    const id = window.setTimeout(() => setHablando(false), 7000);
    return () => window.clearTimeout(id);
  }, [grabando, pensando, transcribiendo, ultimoAsistente?.id]);

  const estado: EstadoOrbe = grabando
    ? "escuchando"
    : transcribiendo || pensando
      ? "pensando"
      : hablando
        ? "hablando"
        : "espera";

  const pie = useMemo(() => {
    if (aviso) return aviso;
    if (grabando) return "Te escucho. Habla ahora; cuando pares, te respondo.";
    if (transcribiendo) return "Entendiendo lo que dijiste…";
    if (pensando) return "Pensando…";
    if (hablando && ultimoAsistente && ultimoAsistente.id !== "msg-welcome") return ultimoAsistente.texto;
    if (ultimoAsistente && ultimoAsistente.id !== "msg-welcome") return ultimoAsistente.texto;
    return "Pulsa el orbe o el micrófono y habla. Dilo te responde al callarte.";
  }, [aviso, grabando, hablando, pensando, transcribiendo, ultimoAsistente]);

  const enviar = (valor: string, tipo: "texto" | "voz" = "texto") => {
    const limpio = valor.trim();
    if (!limpio || pensando || transcribiendo) return;
    setAviso(null);
    enviarMensaje(limpio, tipo);
    setTexto("");
  };

  const terminarGrabacion = async () => {
    if (cortandoRef.current) return;
    cortandoRef.current = true;
    const detener = detenerRef.current;
    detenerRef.current = null;
    setGrabando(false);
    if (!detener) {
      cortandoRef.current = false;
      return;
    }
    setTranscribiendo(true);
    setAviso(null);
    try {
      const blob = await detener();
      const transcrito = await transcribirAudio(blob);
      if (transcrito) enviar(transcrito, "voz");
      else setAviso("No te entendí. Pulsa el orbe y habla más cerca, o escribe abajo.");
    } catch {
      setAviso("No pude usar el micrófono. Permite el acceso o escribe abajo.");
    } finally {
      setTranscribiendo(false);
      cortandoRef.current = false;
    }
  };

  const pulsarOrbe = async () => {
    if (pensando || transcribiendo) return;
    if (grabando) {
      await terminarGrabacion();
      return;
    }

    silenciar();
    setHablando(false);
    setAviso(null);
    await desbloquearAudio();
    try {
      const sesion = await iniciarGrabacion(() => {
        void terminarGrabacion();
      });
      detenerRef.current = sesion.detener;
      cortandoRef.current = false;
      setGrabando(true);
    } catch {
      setAviso("Necesito permiso del micrófono. Ábrelo en el navegador y pulsa otra vez.");
    }
  };

  return (
    <div className="font-dilo relative flex h-svh min-h-0 flex-col bg-[#f8f9fa] text-[#202124]">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#dadce0] bg-white px-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#1a73e8] text-[13px] font-medium text-white">
          D
        </span>
        <p className="text-[18px] font-normal tracking-tight text-[#202124]">Dilo</p>
        <div className="ml-auto flex items-center gap-0.5">
          <IconoBarra
            etiqueta={configuracion.preferenciaVoz ? "Silenciar a Dilo" : "Dilo habla"}
            onClick={() => {
              if (configuracion.preferenciaVoz) silenciar();
              actualizarConfiguracion({ preferenciaVoz: !configuracion.preferenciaVoz });
            }}
          >
            {configuracion.preferenciaVoz ? (
              <Volume2 className="size-5" />
            ) : (
              <VolumeX className="size-5" />
            )}
          </IconoBarra>
          <Link
            to="/configuracion"
            aria-label="Configuración"
            className="inline-flex size-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
          >
            <Settings className="size-5" />
          </Link>
          {perfil?.rol === "administrador" ? (
            <Link
              to="/admin"
              aria-label="Administración"
              className="inline-flex size-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
            >
              <Shield className="size-5" />
            </Link>
          ) : null}
          <IconoBarra
            etiqueta="Cerrar sesión"
            onClick={() => {
              silenciar();
              void cerrarSesion().then(() => navigate({ to: "/" }));
            }}
          >
            <LogOut className="size-5" />
          </IconoBarra>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <DiloOrbe estado={estado} onActivar={() => void pulsarOrbe()} />
        <p className="mt-8 text-[13px] font-medium uppercase tracking-[0.22em] text-[#5f6368]">
          {ESTADO_TEXTO[estado]}
        </p>
        <p className="mt-3 max-w-md text-center text-[15px] leading-6 text-[#3c4043]">{pie}</p>
      </div>

      <div className="mx-auto w-full max-w-xl px-4 pb-7">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
          className="flex items-center gap-3 rounded-full bg-white px-2 py-2 shadow-[0_1px_3px_rgb(60_64_67/0.15),0_1px_2px_rgb(60_64_67/0.3)]"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pregúntale a Dilo"
            aria-label="Escribirle a Dilo"
            disabled={pensando || grabando || transcribiendo}
            className="h-12 flex-1 border-0 bg-transparent px-4 text-[16px] text-[#202124] outline-none placeholder:text-[#80868b]"
          />
          <button
            type="button"
            aria-label={grabando ? "Enviar voz" : "Hablar"}
            disabled={!hayMic && !grabando}
            onClick={() => void pulsarOrbe()}
            className={
              grabando
                ? "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[#ea4335] text-white"
                : transcribiendo || pensando
                  ? "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fbbc05] text-[#202124]"
                  : "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white hover:bg-[#1557b0]"
            }
          >
            <Mic className="size-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export const DiloJarvis = Dilo;

function IconoBarra({
  etiqueta,
  onClick,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
    >
      {children}
    </button>
  );
}
