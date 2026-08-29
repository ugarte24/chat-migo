import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, MessageSquare, MoreHorizontal, Send, Settings, Shield, Volume2, VolumeX } from "lucide-react";
import { AvisoActualizacionApk } from "@/components/AvisoActualizacionApk";
import { DiloOrbe, type EstadoOrbe } from "@/components/DiloOrbe";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useAsistente } from "@/lib/store";
import { esCascaraAndroid, versionCascaraAndroid } from "@/lib/nativo";
import { nombreDePila } from "@/lib/utils";
import { VOCES_DILO, vozPorId } from "@/lib/voces";
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
  espera: "Toca para hablar",
  escuchando: "Te escucho",
  pensando: "Un momento",
  hablando: "Toca para interrumpir",
};

const GRUPOS_VOZ = [
  { id: "hombres" as const, titulo: "Hombres" },
  { id: "mujeres" as const, titulo: "Mujeres" },
  { id: "neutra" as const, titulo: "Neutra" },
];

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
  const [enAndroid, setEnAndroid] = useState(false);

  useEffect(() => {
    setEnAndroid(esCascaraAndroid());
  }, []);
  const [indiceConsejo, setIndiceConsejo] = useState(0);
  const [borrador, setBorrador] = useState("");
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
  const pila = nombreDePila(perfil?.nombre);
  const textoSaludo = pila
    ? `Hola, ${pila}. Estoy aquí. Cuéntame qué tienes entre manos.`
    : (visibles.find((m) => m.id === "msg-welcome")?.texto ??
      "Hola. Estoy aquí. Cuéntame qué tienes entre manos.");
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
      if (dichoVivo) return `“${dichoVivo}”`;
      return "Habla cuando quieras. Al callar, sigo yo.";
    }
    if (transcribiendo || pensando) {
      return dichoVivo ? `Te oí: “${dichoVivo}”` : "Lo estoy viendo…";
    }
    if (hablando && ultimoAsistente) return ultimoAsistente.texto;
    if (enSesion) return "Sigo aquí…";
    if (!hayMic) return "Este navegador no puede usar el micrófono. Prueba en Chrome.";
    if (!hayConversacion) return textoSaludo;
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
    let cancelado = false;
    if (configuracion.preferenciaVoz) setHablando(true);
    void (async () => {
      await esperaFinHabla();
      if (cancelado) return;
      setHablando(false);
      if (!sesionRef.current) return;
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

  const enviarTexto = () => {
    const limpio = borrador.trim();
    if (!limpio || pensando || transcribiendo || grabando) return;
    if (hablando) {
      silenciar();
      setHablando(false);
    }
    enviarMensaje(limpio, "texto");
    setBorrador("");
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
      <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 px-4 sm:px-5">
        <span className="text-[17px] font-medium tracking-tight text-[#202124]">
          Dilo
          {enAndroid && versionCascaraAndroid() ? (
            <span className="ml-2 text-[12px] font-normal text-[#80868b]">
              {versionCascaraAndroid()}
            </span>
          ) : null}
        </span>
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
          <Link
            to="/chat"
            aria-label="Conversación"
            className="inline-flex size-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
          >
            <MessageSquare className="size-5" />
          </Link>
          <MenuMas
            vozId={configuracion.vozId}
            esAdmin={perfil?.rol === "administrador"}
            onVoz={(vozId) => actualizarConfiguracion({ vozId })}
            onSalir={() => {
              silenciar();
              void cerrarSesion().then(() => navigate({ to: "/" }));
            }}
          />
        </div>
      </header>

      <AvisoActualizacionApk compacto />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <DiloOrbe estado={estado} onActivar={() => void pulsarOrbe()} />
          <p
            key={`estado-${estado}`}
            className={`mt-7 text-[16px] font-medium ${colorEstado}`}
            style={{ animation: "dilo-texto-entra 0.35s ease-out" }}
          >
            {ESTADO_TEXTO[estado]}
          </p>
          <p
            key={grabando || transcribiendo || pensando || hablando ? "dilo-pie" : pie}
            className={`mt-1.5 max-w-md text-center text-[13px] leading-5 ${
              aviso || grabando ? "text-[#2563eb]" : "text-[#80868b]"
            }`}
            style={{ animation: "dilo-texto-entra 0.4s ease-out" }}
          >
            {pie}
          </p>
        </div>
        <form
          className="mx-auto mt-4 w-full max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            enviarTexto();
          }}
        >
          <label className="flex items-center gap-2 rounded-full bg-white/80 py-1.5 pl-4 pr-1.5 shadow-[0_1px_2px_rgb(60_64_67/0.12)] ring-1 ring-[#dadce0]/80 backdrop-blur-md">
            <span className="sr-only">Escribe a Dilo</span>
            <input
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              placeholder={grabando ? "Habla, o toca el orbe para salir" : "O escribe aquí"}
              disabled={pensando || transcribiendo || grabando}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[#202124] outline-none placeholder:text-[#80868b] disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Enviar"
              disabled={!borrador.trim() || pensando || transcribiendo || grabando}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </label>
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

function MenuMas({
  vozId,
  esAdmin,
  onVoz,
  onSalir,
}: {
  vozId: string;
  esAdmin?: boolean;
  onVoz: (vozId: string) => void;
  onSalir: () => void;
}) {
  const actual = vozPorId(vozId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Más opciones"
          className="inline-flex size-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            Voz: {actual.nombre}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-72 w-56 overflow-y-auto">
            {GRUPOS_VOZ.map((g) => (
              <DropdownMenuGroup key={g.id}>
                <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.titulo}
                </DropdownMenuLabel>
                {VOCES_DILO.filter((v) => v.grupo === g.id).map((v) => (
                  <DropdownMenuItem
                    key={v.id}
                    onSelect={() => onVoz(v.id)}
                  >
                    {v.nombre}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {v.id === actual.id ? "actual" : v.detalle}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/configuracion">
            <Settings className="size-4" />
            Configuración
          </Link>
        </DropdownMenuItem>
        {esAdmin ? (
          <DropdownMenuItem asChild>
            <Link to="/admin">
              <Shield className="size-4" />
              Administración
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSalir}>
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
