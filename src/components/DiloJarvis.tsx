import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, Shield, Volume2, VolumeX } from "lucide-react";
import { DiloOrbe, type EstadoOrbe } from "@/components/DiloOrbe";
import { SelectorVozBarra } from "@/components/SelectorVoz";
import { useAuth } from "@/lib/auth";
import { useAsistente } from "@/lib/store";
import {
  iniciarGrabacion,
  microfonoDisponible,
  silenciar,
  transcribirAudio,
  desbloquearAudio,
  esMovil,
  hablar,
} from "@/lib/voz";

const ESTADO_TEXTO: Record<EstadoOrbe, string> = {
  espera: "En espera",
  escuchando: "Te escucho",
  pensando: "Un momento",
  hablando: "Hablando",
};

const CONSEJOS = [
  "Pídeme que te recuerde algo a una hora.",
  "Pregúntame qué tienes pendiente hoy.",
  "Dime que anote una tarea.",
  "Cuéntame cómo te fue el día. Te escucho.",
  "Pídeme que agende una reunión.",
  "Dime que marque algo como hecho.",
  "Pregúntame qué recuerdos tengo de ti.",
  "Pídeme un plan corto para la tarde.",
  "Dime que te avise todos los días a la misma hora.",
  "Pídeme que recuerde un dato importante.",
];

export function Dilo() {
  const { mensajes, enviarMensaje, configuracion, actualizarConfiguracion, pensando } =
    useAsistente();
  const { perfil, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [grabando, setGrabando] = useState(false);
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [dichoVivo, setDichoVivo] = useState("");
  const detenerRef = useRef<(() => Promise<{ blob: Blob; dicho: string }>) | null>(null);
  const cortandoRef = useRef(false);
  const hayMic = microfonoDisponible();
  const enMovil = esMovil();
  const [indiceConsejo, setIndiceConsejo] = useState(0);

  const visibles = mensajes.filter((m) => m.tipo !== "proceso" && m.tipo !== "analisis");
  const ultimoAsistente = [...visibles].reverse().find((m) => m.autor === "asistente");
  const hayConversacion = visibles.some((m) => m.autor === "usuario");
  const saludoTexto = !hayConversacion
    ? (visibles.find((m) => m.id === "msg-welcome")?.texto ?? ultimoAsistente?.texto)
    : undefined;
  const entradaDichaRef = useRef(false);
  const mensajeAlEntrarRef = useRef<string | undefined>(undefined);
  if (mensajeAlEntrarRef.current === undefined && ultimoAsistente) {
    mensajeAlEntrarRef.current = ultimoAsistente.id;
  }

  useEffect(() => {
    const prime = () => {
      void desbloquearAudio();
    };
    window.addEventListener("pointerdown", prime, { once: true });
    return () => window.removeEventListener("pointerdown", prime);
  }, []);

  useEffect(() => {
    if (pensando || grabando || transcribiendo || !ultimoAsistente) {
      setHablando(false);
      return;
    }
    if (ultimoAsistente.id === mensajeAlEntrarRef.current) {
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

  useEffect(() => {
    if (estado !== "espera") return;
    const id = window.setInterval(() => {
      setIndiceConsejo((i) => (i + 1) % CONSEJOS.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [estado]);

  const pie = useMemo(() => {
    if (aviso) return aviso;
    if (grabando) {
      if (dichoVivo) return `Te oigo: “${dichoVivo}”`;
      return enMovil
        ? "El micrófono está abierto. Habla y pulsa el orbe otra vez cuando termines."
        : "El micrófono está abierto. Habla: aquí va a aparecer lo que te oigo.";
    }
    if (transcribiendo || pensando) {
      return dichoVivo ? `Te oí: “${dichoVivo}”` : "Un momento, lo estoy viendo…";
    }
    if (hablando && ultimoAsistente) return ultimoAsistente.texto;
    if (saludoTexto) return saludoTexto;
    if (!hayMic) return "Este navegador no puede usar el micrófono. Prueba en Chrome.";
    return CONSEJOS[indiceConsejo] ?? CONSEJOS[0];
  }, [aviso, dichoVivo, enMovil, grabando, hablando, hayMic, indiceConsejo, pensando, saludoTexto, transcribiendo, ultimoAsistente]);

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
      const deNavegador = dicho.trim();
      const deWhisper = deNavegador ? { texto: null, cuota: false } : await transcribirAudio(blob);
      const transcrito = deNavegador || deWhisper.texto;
      if (transcrito) {
        setDichoVivo(transcrito);
        setAviso(null);
        enviarMensaje(transcrito, "voz");
      } else if (deWhisper.cuota) {
        setAviso("No pude transcribir. Usa Chrome y permite el micrófono.");
      } else {
        setAviso("No alcancé a escucharte. Pulsa el orbe e inténtalo otra vez.");
      }
    } catch {
      setAviso("Necesito permiso del micrófono. Ábrelo en el navegador y pulsa el orbe.");
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
    setDichoVivo("");
    await desbloquearAudio();
    if (
      !entradaDichaRef.current &&
      configuracion.preferenciaVoz &&
      saludoTexto &&
      !hayConversacion
    ) {
      entradaDichaRef.current = true;
      setHablando(true);
      await hablar(saludoTexto, configuracion.vozId);
      setHablando(false);
    }
    try {
      const sesion = await iniciarGrabacion(
        () => {
          void terminarGrabacion();
        },
        (texto) => setDichoVivo(texto),
      );
      detenerRef.current = sesion.detener;
      cortandoRef.current = false;
      setGrabando(true);
    } catch {
      setAviso("Necesito permiso del micrófono. Ábrelo en el navegador y pulsa otra vez.");
    }
  };

  const colorEstado =
    estado === "escuchando"
      ? "text-[#2563eb]"
      : estado === "pensando"
        ? "text-[#f59e0b]"
        : estado === "hablando"
          ? "text-[#0891b2]"
          : "text-[#5f6368]";

  return (
    <div className="font-dilo relative flex h-svh min-h-0 flex-col overflow-hidden bg-[#f8f9fa] text-[#202124]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <span className="dilo-mancha-fondo absolute -left-16 top-24 size-72 rounded-full bg-[#00e5ff]/18 blur-3xl" />
        <span className="dilo-mancha-fondo absolute -right-10 top-40 size-64 rounded-full bg-[#3b82f6]/16 blur-3xl [animation-delay:1.2s]" />
        <span className="dilo-mancha-fondo absolute bottom-10 left-1/3 size-80 rounded-full bg-[#0ea5e9]/14 blur-3xl [animation-delay:2.1s]" />
        <span className="dilo-mancha-fondo absolute bottom-24 right-1/4 size-56 rounded-full bg-[#22d3ee]/16 blur-3xl [animation-delay:0.6s]" />
      </div>
      <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 px-4 sm:px-5">
        <span className="text-[17px] font-medium tracking-tight text-[#202124]">Dilo</span>
        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-white/70 p-0.5 shadow-[0_1px_2px_rgb(60_64_67/0.12)] ring-1 ring-[#dadce0]/70 backdrop-blur-md">
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
          <SelectorVozBarra
            valor={configuracion.vozId}
            onChange={(vozId) => actualizarConfiguracion({ vozId })}
          />
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

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <DiloOrbe estado={estado} onActivar={() => void pulsarOrbe()} />
        <p
          key={estado}
          className={`mt-7 text-[15px] font-medium ${colorEstado}`}
          style={{ animation: "dilo-texto-entra 0.35s ease-out" }}
        >
          {ESTADO_TEXTO[estado]}
        </p>
        <p
          key={pie}
          className={`mt-2 max-w-md text-center text-[15px] leading-6 ${
            grabando ? "text-[#2563eb]" : "text-[#5f6368]"
          }`}
          style={{ animation: "dilo-texto-entra 0.4s ease-out" }}
        >
          {pie}
        </p>
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
