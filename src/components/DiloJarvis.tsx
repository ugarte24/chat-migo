import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Mic, Send, Settings, Shield, Volume2, VolumeX } from "lucide-react";
import { DiloOrbe, type EstadoOrbe } from "@/components/DiloOrbe";
import { useAuth } from "@/lib/auth";
import { useAsistente } from "@/lib/store";
import {
  iniciarGrabacion,
  microfonoDisponible,
  silenciar,
  transcribirAudio,
  desbloquearAudio,
  esMovil,
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
  const detenerRef = useRef<(() => Promise<{ blob: Blob; dicho: string }>) | null>(null);
  const cortandoRef = useRef(false);
  const hayMic = microfonoDisponible();
  const enMovil = esMovil();
  const hayTexto = texto.trim().length > 0;

  const visibles = mensajes.filter((m) => m.tipo !== "proceso" && m.tipo !== "analisis");
  const ultimoAsistente = [...visibles].reverse().find((m) => m.autor === "asistente");

  useEffect(() => {
    if (pensando || grabando || transcribiendo || !ultimoAsistente || ultimoAsistente.id === "msg-welcome") {
      setHablando(false);
      return;
    }
    setHablando(true);
    const ms = Math.min(14_000, Math.max(2_800, Math.round((ultimoAsistente.texto.length / 13) * 1000)));
    const id = window.setTimeout(() => setHablando(false), ms);
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
    if (grabando) {
      return enMovil
        ? "Te escucho. Pulsa otra vez el orbe o el micrófono cuando termines."
        : "Te escucho. Habla ahora; cuando pares, te respondo.";
    }
    if (transcribiendo) return "Entendiendo lo que dijiste…";
    if (pensando) return "Pensando…";
    if (hablando && ultimoAsistente && ultimoAsistente.id !== "msg-welcome") return ultimoAsistente.texto;
    if (ultimoAsistente && ultimoAsistente.id !== "msg-welcome") return ultimoAsistente.texto;
    return enMovil
      ? "Pulsa el orbe, habla y pulsa otra vez para enviar. También puedes escribir y tocar enviar."
      : "Pulsa el orbe o el micrófono y habla. Dilo te responde al callarte.";
  }, [aviso, enMovil, grabando, hablando, pensando, transcribiendo, ultimoAsistente]);

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
      const { blob, dicho } = await detener();
      const transcrito = dicho || (await transcribirAudio(blob));
      if (transcrito) {
        setAviso(null);
        enviarMensaje(transcrito, "voz");
        setTexto("");
      } else {
        setAviso("No te entendí. Pulsa el orbe, habla y pulsa otra vez para enviar, o escribe abajo.");
      }
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

  const colorEstado =
    estado === "escuchando"
      ? "text-[#1a73e8]"
      : estado === "pensando"
        ? "text-[#f9ab00]"
        : estado === "hablando"
          ? "text-[#188038]"
          : "text-[#5f6368]";

  return (
    <div className="font-dilo relative flex h-svh min-h-0 flex-col overflow-hidden bg-[#f8f9fa] text-[#202124]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <span className="dilo-mancha-fondo absolute -left-16 top-24 size-72 rounded-full bg-[#4285f4]/15 blur-3xl" />
        <span className="dilo-mancha-fondo absolute -right-10 top-40 size-64 rounded-full bg-[#ea4335]/12 blur-3xl [animation-delay:1.2s]" />
        <span className="dilo-mancha-fondo absolute bottom-10 left-1/3 size-80 rounded-full bg-[#34a853]/12 blur-3xl [animation-delay:2.1s]" />
        <span className="dilo-mancha-fondo absolute bottom-24 right-1/4 size-56 rounded-full bg-[#fbbc05]/16 blur-3xl [animation-delay:0.6s]" />
      </div>
      <header className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b border-[#dadce0]/80 bg-white/80 px-4 backdrop-blur-md">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#1a73e8] text-[13px] font-medium text-white shadow-[0_0_0_4px_rgb(26_115_232/0.15)]">
          D
        </span>
        <p className="text-[18px] font-normal tracking-tight text-[#202124]">Dilo</p>
        <span
          className={`ml-1 size-2 rounded-full ${
            estado === "espera" ? "bg-[#34a853]" : estado === "escuchando" ? "bg-[#1a73e8] animate-pulse" : estado === "pensando" ? "bg-[#fbbc05] animate-pulse" : "bg-[#34a853] animate-pulse"
          }`}
          aria-hidden
        />
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

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <DiloOrbe estado={estado} onActivar={() => void pulsarOrbe()} />
        <p
          key={estado}
          className={`mt-8 text-[13px] font-medium uppercase tracking-[0.22em] ${colorEstado}`}
          style={{ animation: "dilo-texto-entra 0.35s ease-out" }}
        >
          {ESTADO_TEXTO[estado]}
        </p>
        <p
          key={pie}
          className="mt-3 max-w-md text-center text-[15px] leading-6 text-[#3c4043]"
          style={{ animation: "dilo-texto-entra 0.4s ease-out" }}
        >
          {pie}
        </p>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
          className="flex items-center gap-3 rounded-full bg-white/90 px-2 py-2 shadow-[0_1px_3px_rgb(60_64_67/0.15),0_1px_2px_rgb(60_64_67/0.3)] backdrop-blur"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pregúntale a Dilo"
            aria-label="Escribirle a Dilo"
            enterKeyHint="send"
            disabled={pensando || grabando || transcribiendo}
            className="h-12 flex-1 border-0 bg-transparent px-4 text-[16px] text-[#202124] outline-none placeholder:text-[#80868b]"
          />
          {hayTexto && !grabando ? (
            <button
              type="submit"
              aria-label="Enviar"
              disabled={pensando || transcribiendo}
              className="inline-flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-[#1a73e8] text-white transition hover:bg-[#1557b0]"
            >
              <Send className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={grabando ? "Enviar voz" : "Hablar"}
              disabled={!hayMic && !grabando}
              onClick={() => void pulsarOrbe()}
              className={
                grabando
                  ? "inline-flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-[#ea4335] text-white shadow-[0_0_0_8px_rgb(234_67_53/0.18)]"
                  : transcribiendo || pensando
                    ? "inline-flex size-12 shrink-0 animate-pulse touch-manipulation items-center justify-center rounded-full bg-[#fbbc05] text-[#202124]"
                    : "inline-flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-[#1a73e8] text-white"
              }
            >
              <Mic className={`size-5 ${grabando ? "animate-pulse" : ""}`} />
            </button>
          )}
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
