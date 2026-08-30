import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Brain,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  LogOut,
  MessageSquare,
  MoreVertical,
  Settings,
  Shield,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { AvisoActualizacionApk } from "@/components/AvisoActualizacionApk";
import { DiloNucleoMini, DiloOrbe, type EstadoOrbe } from "@/components/DiloOrbe";
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
import { fechaCorta, hoyISO } from "@/lib/datos";
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

const ESTADO_UI: Record<EstadoOrbe, { titulo: string; sub: string }> = {
  espera: { titulo: "Toca para hablar", sub: "Estoy listo para escucharte" },
  escuchando: { titulo: "Te escucho", sub: "Decime qué necesitás" },
  pensando: { titulo: "Un momento...", sub: "Estoy pensando" },
  hablando: { titulo: "Dilo está hablando", sub: "Toca para interrumpir" },
};

const ATAJOS = [
  { to: "/tareas", etiqueta: "Tareas", Icono: CheckSquare, caja: "bg-[#ECFDF5] text-[#059669]" },
  { to: "/recordatorios", etiqueta: "Recordatorios", Icono: Bell, caja: "bg-[#EFF6FF] text-[#2563EB]" },
  { to: "/eventos", etiqueta: "Eventos", Icono: CalendarDays, caja: "bg-[#F5F3FF] text-[#7C3AED]" },
] as const;

const GRUPOS_VOZ = [
  { id: "hombres" as const, titulo: "Hombres" },
  { id: "mujeres" as const, titulo: "Mujeres" },
  { id: "neutra" as const, titulo: "Neutra" },
];

function mananaISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function etiquetaCuando(fecha: string, hora: string) {
  const hoy = hoyISO();
  const manana = mananaISO();
  const dia = fecha === hoy ? "Hoy" : fecha === manana ? "Mañana" : fechaCorta(fecha);
  return `${dia}, ${hora}`;
}

export function Dilo() {
  const {
    mensajes,
    enviarMensaje,
    configuracion,
    actualizarConfiguracion,
    pensando,
    recordatorios,
    eventos,
  } = useAsistente();
  const { perfil, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [grabando, setGrabando] = useState(false);
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const detenerRef = useRef<(() => Promise<{ blob: Blob; dicho: string }>) | null>(null);
  const cortandoRef = useRef(false);
  const hayMic = microfonoDisponible();
  const [enAndroid, setEnAndroid] = useState(false);

  useEffect(() => {
    setEnAndroid(esCascaraAndroid());
  }, []);
  const [enSesion, setEnSesion] = useState(false);
  const sesionRef = useRef(false);
  const grabandoRef = useRef(false);
  const arrancandoRef = useRef(false);
  const cicloRef = useRef(0);
  const dichoRef = useRef("");
  const prevPensando = useRef(false);
  const empezarEscuchaRef = useRef<() => Promise<void>>(async () => {});

  const visibles = mensajes.filter((m) => m.tipo !== "proceso" && m.tipo !== "analisis");
  const pila = nombreDePila(perfil?.nombre);
  const textoSaludo = pila
    ? `Hola, ${pila}. Estoy aquí. Cuéntame qué tienes entre manos.`
    : (visibles.find((m) => m.id === "msg-welcome")?.texto ??
      "Hola. Estoy aquí. Cuéntame qué tienes entre manos.");
  const entradaDichaRef = useRef(false);
  const hayChat = visibles.some((m) => m.autor === "usuario");

  const recientes = useMemo(() => {
    const recs = recordatorios
      .filter((r) => r.activo && r.estado === "pendiente")
      .slice(0, 2)
      .map((r) => ({
        id: r.id,
        tipo: "recordatorio" as const,
        titulo: r.actividad,
        cuando: etiquetaCuando(r.fecha, r.hora),
        estado: "Activa",
        to: "/recordatorios" as const,
      }));
    const evs = eventos
      .filter((e) => e.estado === "pendiente")
      .slice(0, 2)
      .map((e) => ({
        id: e.id,
        tipo: "evento" as const,
        titulo: e.titulo,
        cuando: etiquetaCuando(e.fecha, e.hora),
        estado: "Confirmado",
        to: "/eventos" as const,
      }));
    return [...recs, ...evs].slice(0, 2);
  }, [recordatorios, eventos]);

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
      setAviso("Necesito permiso del micrófono. Ábrelo y pulsa el micrófono.");
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
      grabandoRef.current = true;
      setGrabando(true);
    } catch {
      setAviso("Necesito permiso del micrófono. Ábrelo y pulsa otra vez.");
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

  const ui = ESTADO_UI[estado];
  const tituloEstado = aviso ?? (!hayMic ? "Este navegador no puede usar el micrófono." : ui.titulo);
  const subEstado = aviso || !hayMic ? "" : ui.sub;

  return (
    <div className="relative flex h-svh min-h-0 flex-col overflow-hidden bg-[#F8FAFC] text-[#111827]">
      <header className="relative z-10 flex shrink-0 items-center justify-between px-5 pt-4 pb-2">
        <p className="min-w-0 text-[22px] font-semibold tracking-tight">Dilo</p>
        <div className="flex items-center gap-2">
          <IconoBarra
            etiqueta={configuracion.preferenciaVoz ? "Silenciar a Dilo" : "Dilo habla"}
            onClick={() => {
              if (configuracion.preferenciaVoz) silenciar();
              actualizarConfiguracion({ preferenciaVoz: !configuracion.preferenciaVoz });
            }}
          >
            {configuracion.preferenciaVoz ? (
              <Volume2 className="size-[18px]" />
            ) : (
              <VolumeX className="size-[18px]" />
            )}
          </IconoBarra>
          <MenuMas
            vozId={configuracion.vozId}
            esAdmin={perfil?.rol === "administrador"}
            versionApp={enAndroid ? versionCascaraAndroid() : null}
            onVoz={(vozId) => actualizarConfiguracion({ vozId })}
            onSalir={() => {
              silenciar();
              void cerrarSesion().then(() => navigate({ to: "/" }));
            }}
          />
        </div>
      </header>

      <AvisoActualizacionApk compacto />

      <div className="flex min-h-0 flex-1 flex-col px-5">
        <section className="shrink-0 rounded-[1.35rem] bg-white/80 px-4 py-3.5 shadow-[0_1px_3px_rgb(15_23_42/0.06)] ring-1 ring-white/80 backdrop-blur-md">
          <nav className="flex justify-around gap-2" aria-label="Accesos rápidos">
            {ATAJOS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
              >
                <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${a.caja}`}>
                  <a.Icono className="size-[18px]" strokeWidth={2.1} />
                </span>
                <span className="max-w-full text-center text-[12px] leading-[1.15] text-[#475569]">
                  {a.etiqueta}
                </span>
              </Link>
            ))}
          </nav>
        </section>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-visible py-1">
          <DiloOrbe estado={estado} onActivar={() => void pulsarOrbe()} />
          <p
            key={aviso ?? `estado-${estado}`}
            className="mt-2 text-center text-[17px] font-semibold tracking-tight text-[#111827]"
            style={{ animation: "dilo-texto-entra 0.35s ease-out" }}
          >
            {tituloEstado}
          </p>
          {subEstado ? (
            <p className="mt-0.5 text-center text-[13px] text-[#64748B]">{subEstado}</p>
          ) : null}
        </div>

        {recientes.length > 0 ? (
          <section className="mb-2 shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Próximo</h2>
              <Link to="/historial" className="inline-flex items-center text-[13px] font-medium text-[#2563EB]">
                Ver todo
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-[1.2rem] bg-white/80 shadow-[0_1px_3px_rgb(15_23_42/0.06)] ring-1 ring-white/80">
              {recientes.map((item, i) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-3 ${i > 0 ? "border-t border-[#F1F5F9]" : ""}`}
                >
                  <span
                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      item.tipo === "recordatorio"
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : "bg-[#F5F3FF] text-[#7C3AED]"
                    }`}
                  >
                    {item.tipo === "recordatorio" ? (
                      <Bell className="size-4" />
                    ) : (
                      <CalendarDays className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">
                      {item.tipo === "recordatorio" ? "Recordatorio: " : "Evento: "}
                      {item.titulo}
                    </span>
                    <span className="block text-[12px] text-[#64748B]">{item.cuando}</span>
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-medium ${
                      item.tipo === "recordatorio" ? "text-[#2563EB]" : "text-[#16A34A]"
                    }`}
                  >
                    {item.estado}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <nav
        className="relative z-10 shrink-0 border-t border-[#E2E8F0]/80 bg-white/90 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgb(15_23_42/0.04)] backdrop-blur-md"
        aria-label="Principal"
      >
        <div className="grid grid-cols-3 px-2 pt-1.5">
          <span className="flex flex-col items-center gap-0.5 py-1.5 text-[#2563EB]">
            <DiloNucleoMini activo />
            <span className="text-[11px] font-medium">Asistente</span>
          </span>
          <Link
            to="/chat"
            className="relative flex flex-col items-center gap-0.5 py-1.5 text-[#64748B]"
            aria-label="Chat"
          >
            <span className="relative">
              <MessageSquare className="size-5" />
              {hayChat ? (
                <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-[#2563EB]" aria-hidden />
              ) : null}
            </span>
            <span className="text-[11px]">Chat</span>
          </Link>
          <Link
            to="/configuracion"
            className="flex flex-col items-center gap-0.5 py-1.5 text-[#64748B]"
            aria-label="Ajustes"
          >
            <Settings className="size-5" />
            <span className="text-[11px]">Ajustes</span>
          </Link>
        </div>
      </nav>
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
      className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[#64748B] shadow-[0_1px_3px_rgb(15_23_42/0.08)] ring-1 ring-[#E2E8F0]/80"
    >
      {children}
    </button>
  );
}

function MenuMas({
  vozId,
  esAdmin,
  versionApp,
  onVoz,
  onSalir,
}: {
  vozId: string;
  esAdmin?: boolean;
  versionApp?: string | null;
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
          className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[#64748B] shadow-[0_1px_3px_rgb(15_23_42/0.08)] ring-1 ring-[#E2E8F0]/80"
        >
          <MoreVertical className="size-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/memoria">
            <Brain className="size-4" />
            Memoria
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/automatizaciones">
            <Zap className="size-4" />
            Automatizaciones
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Voz: {actual.nombre}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-72 w-56 overflow-y-auto">
            {GRUPOS_VOZ.map((g) => (
              <DropdownMenuGroup key={g.id}>
                <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.titulo}
                </DropdownMenuLabel>
                {VOCES_DILO.filter((v) => v.grupo === g.id).map((v) => (
                  <DropdownMenuItem key={v.id} onSelect={() => onVoz(v.id)}>
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
        {versionApp ? (
          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
            App {versionApp}
          </DropdownMenuLabel>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
