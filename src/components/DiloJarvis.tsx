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
  hablar,
  prefetchHablar,
  esperaFinHabla,
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
  const [indiceConsejo, setIndiceConsejo] = useState(0);
  const [enSesion, setEnSesion] = useState(false);
  const sesionRef = useRef(false);
  const grabandoRef = useRef(false);
  const arrancandoRef = useRef(false);
  const cicloRef = useRef(0);
  const dichoRef = useRef("");
  const prevPensando = useRef(false);
  const empezarEscuchaRef = useRef<() => Promise<void>>(async () => {});

  const visibles = mensajes.filter((m) => m.tipo !== "proceso" && m.tipo !== "analisis");
  const ultimoAsistente = [...visibles].reverse().find((m) => m.autor === "asistente");
  const hayConversacion = visibles.some((m) => m.autor === "usuario");
  const textoSaludo =
    visibles.find((m) => m.id === "msg-welcome")?.texto ??
    (perfil?.nombre
      ? `Hola, ${perfil.nombre}. Estoy aquí. Cuéntame qué tienes entre manos.`
      : "Hola. Estoy aquí. Cuéntame qué tienes entre manos.");
  const entradaDichaRef = useRef(false);

  useEffect(() => {
    grabandoRef.current = grabando;
  }, [grabando]);

  useEffect(() => {
    return () => {
      sesionRef.current = false;
      cicloRef.current += 1;
      silenciar();
      void detenerRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!configuracion.preferenciaVoz || !textoSaludo) return;
    void prefetchHablar(textoSaludo, configuracion.vozId);
  }, [configuracion.preferenciaVoz, configuracion.vozId, textoSaludo]);

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
      return "Te escucho. Habla cuando quieras; al callar, sigo yo. Pulsa el orbe para salir.";
    }
    if (transcribiendo || pensando) {
      return dichoVivo ? `Te oí: “${dichoVivo}”` : "Un momento, lo estoy viendo…";
    }
    if (hablando && ultimoAsistente) return ultimoAsistente.texto;
    if (enSesion) return "Sigo aquí. Un segundo…";
    if (!hayConversacion) return textoSaludo;
    if (!hayMic) return "Este navegador no puede usar el micrófono. Prueba en Chrome.";
    return CONSEJOS[indiceConsejo] ?? CONSEJOS[0];
  }, [aviso, dichoVivo, enSesion, grabando, hablando, hayConversacion, hayMic, indiceConsejo, pensando, textoSaludo, transcribiendo, ultimoAsistente]);

  const terminarGrabacion = async (origen: "auto" | "usuario") => {
    if (cortandoRef.current) return;
    cortandoRef.current = true;
    cicloRef.current += 1;
    const detener = detenerRef.current;
    detenerRef.current = null;
    grabandoRef.current = false;
    setGrabando(false);
    if (!detener) {
      cortandoRef.current = false;
      if (origen === "usuario") {
        sesionRef.current = false;
        setEnSesion(false);
      } else if (sesionRef.current) {
        void empezarEscuchaRef.current();
      }
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
        dichoRef.current = transcrito;
        setDichoVivo(transcrito);
        setAviso(null);
        enviarMensaje(transcrito, "voz");
      } else if (deWhisper.cuota) {
        setAviso("No pude transcribir. Usa Chrome y permite el micrófono.");
        sesionRef.current = false;
        setEnSesion(false);
      } else if (origen === "usuario") {
        sesionRef.current = false;
        setEnSesion(false);
      } else if (sesionRef.current) {
        void empezarEscuchaRef.current();
      }
    } catch {
      setAviso("Necesito permiso del micrófono. Ábrelo en el navegador y pulsa el orbe.");
      sesionRef.current = false;
      setEnSesion(false);
    } finally {
      setTranscribiendo(false);
      cortandoRef.current = false;
    }
  };

  const empezarEscucha = async () => {
    if (!sesionRef.current || grabandoRef.current || arrancandoRef.current || cortandoRef.current) return;
    arrancandoRef.current = true;
    const ciclo = ++cicloRef.current;
    setAviso(null);
    try {
      await desbloquearAudio();
      if (ciclo !== cicloRef.current || !sesionRef.current) return;
      const rec = await iniciarGrabacion(
        () => {
          void terminarGrabacion("auto");
        },
        (texto) => {
          dichoRef.current = texto;
          setDichoVivo(texto);
        },
        { continuo: true },
      );
      if (ciclo !== cicloRef.current || !sesionRef.current) {
        await rec.detener();
        return;
      }
      detenerRef.current = rec.detener;
      cortandoRef.current = false;
      dichoRef.current = "";
      setDichoVivo("");
      grabandoRef.current = true;
      setGrabando(true);
    } catch {
      setAviso("Necesito permiso del micrófono. Ábrelo en el navegador y pulsa otra vez.");
      sesionRef.current = false;
      setEnSesion(false);
    } finally {
      arrancandoRef.current = false;
    }
  };
  empezarEscuchaRef.current = empezarEscucha;

  useEffect(() => {
    const era = prevPensando.current;
    prevPensando.current = pensando;
    if (!era || pensando) return;
    if (!sesionRef.current) return;
    let cancelado = false;
    if (configuracion.preferenciaVoz) setHablando(true);
    void (async () => {
      await esperaFinHabla();
      if (cancelado) return;
      setHablando(false);
      await new Promise((r) => window.setTimeout(r, 400));
      if (cancelado || !sesionRef.current || grabandoRef.current) return;
      await empezarEscuchaRef.current();
    })();
    return () => {
      cancelado = true;
    };
  }, [pensando, configuracion.preferenciaVoz]);

  const pulsarOrbe = async () => {
    if (pensando || transcribiendo) return;
    if (grabando) {
      await terminarGrabacion("usuario");
      return;
    }
    if (hablando) {
      silenciar();
      setHablando(false);
      if (!sesionRef.current) {
        sesionRef.current = true;
        setEnSesion(true);
      }
      void empezarEscucha();
      return;
    }
    if (sesionRef.current) {
      sesionRef.current = false;
      setEnSesion(false);
      cicloRef.current += 1;
      silenciar();
      return;
    }

    sesionRef.current = true;
    setEnSesion(true);
    setAviso(null);
    dichoRef.current = "";
    setDichoVivo("");
    await desbloquearAudio();
    if (!entradaDichaRef.current && configuracion.preferenciaVoz && textoSaludo) {
      entradaDichaRef.current = true;
      setHablando(true);
      await hablar(textoSaludo, configuracion.vozId);
      setHablando(false);
      await new Promise((r) => window.setTimeout(r, 350));
    } else {
      silenciar();
      setHablando(false);
    }
    if (!sesionRef.current) return;
    await empezarEscucha();
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
