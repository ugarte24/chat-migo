import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AudioLines,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  HelpCircle,
  ListTodo,
  Mic,
  Repeat,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fechaLegible } from "@/lib/asistente";
import { hoyISO, type MensajeChat } from "@/lib/datos";
import { useAsistente } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  iniciarEscuchaContinua,
  reconocimientoVozDisponible,
  silenciar,
  transcribirEnNavegador,
} from "@/lib/voz";

const SUGERENCIAS = [
  "¿Qué tengo para hoy?",
  "Recuérdame mañana a las 8 enviar el informe.",
  "Agenda una reunión con Carlos el viernes a las 3.",
  "Marca como hecha la tarea pendiente.",
];

export function DiloJarvis() {
  const {
    usuario,
    mensajes,
    enviarMensaje,
    tareas,
    recordatorios,
    eventos,
    memoria,
    automatizaciones,
    configuracion,
    actualizarConfiguracion,
  } = useAsistente();
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [escuchaActiva, setEscuchaActiva] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const vozReal = reconocimientoVozDisponible();
  const hoy = hoyISO();

  const visibles = mensajes.filter((m) => m.tipo !== "proceso" && m.tipo !== "analisis");
  const pendientes = tareas.filter((t) => t.estado !== "completada");
  const recHoy = recordatorios.filter((r) => r.fecha === hoy && r.estado === "pendiente");
  const proximo = [...recordatorios]
    .filter((r) => r.activo && r.estado === "pendiente")
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))[0];
  const eventosHoy = eventos.filter((e) => e.fecha === hoy && e.estado === "pendiente");

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibles.length]);

  useEffect(() => {
    if (!escuchaActiva) return;
    const detener = iniciarEscuchaContinua((frase) => enviarMensaje(frase, "voz"));
    return detener;
  }, [escuchaActiva, enviarMensaje]);

  const enviar = (valor: string, tipo: "texto" | "voz" = "texto") => {
    const limpio = valor.trim();
    if (!limpio) return;
    enviarMensaje(limpio, tipo);
    setTexto("");
  };

  const pulsarMic = async () => {
    if (escuchaActiva || grabando) return;
    setGrabando(true);
    try {
      if (vozReal) {
        const transcrito = await transcribirEnNavegador();
        enviar(transcrito, "voz");
      } else if (texto.trim()) {
        enviar(texto, "voz");
      }
    } catch {
      if (texto.trim()) enviar(texto, "voz");
    } finally {
      setGrabando(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col lg:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="relative flex size-11 items-center justify-center rounded-full bg-gradient-accent text-primary-foreground">
            <AudioLines className="size-5" />
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-success" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold leading-tight">Dilo</p>
            <p className="text-xs text-muted-foreground">
              En línea · {usuario}, habla o escribe. Yo me encargo.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={escuchaActiva ? "default" : "outline"}
            disabled={!vozReal}
            onClick={() => setEscuchaActiva((v) => !v)}
            className="shrink-0"
          >
            <Mic className="mr-1.5 size-4" />
            {escuchaActiva ? "Escuchando" : "Escuchar"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={configuracion.preferenciaVoz ? "default" : "outline"}
            onClick={() => {
              if (configuracion.preferenciaVoz) silenciar();
              actualizarConfiguracion({ preferenciaVoz: !configuracion.preferenciaVoz });
            }}
            className="shrink-0"
          >
            {configuracion.preferenciaVoz ? (
              <Volume2 className="mr-1.5 size-4" />
            ) : (
              <VolumeX className="mr-1.5 size-4" />
            )}
            {configuracion.preferenciaVoz ? "Habla" : "Silencio"}
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {visibles.map((m) => (
            <Burbuja key={m.id} mensaje={m} />
          ))}
          {(grabando || escuchaActiva) && (
            <p className="text-center text-xs text-ai">
              {escuchaActiva ? "Te escucho. Habla cuando quieras." : "Escuchando…"}
            </p>
          )}
          <div ref={finRef} />
        </div>

        <div className="border-t border-border bg-card/80 px-4 py-3 backdrop-blur">
          <div className="mb-2 flex flex-wrap gap-2">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="rounded-full border border-border bg-background px-3 py-1 text-left text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Dime qué hacer…"
              className="h-12 rounded-full"
              aria-label="Instrucción para Dilo"
              disabled={grabando}
            />
            <Button
              type="button"
              size="icon"
              variant={escuchaActiva ? "default" : "secondary"}
              className={cn(
                "size-12 shrink-0 rounded-full",
                (grabando || escuchaActiva) && "animate-pulse",
              )}
              aria-label="Hablarle a Dilo"
              onClick={() => void pulsarMic()}
            >
              <Mic className="size-5" />
            </Button>
            <Button type="submit" size="icon" className="size-12 shrink-0 rounded-full" aria-label="Enviar">
              <Send className="size-5" />
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Micrófono: una frase. Escuchar: manos libres, como un asistente siempre atento.
          </p>
        </div>
      </section>

      <aside className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-surface/60 p-4 lg:flex">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tu día
        </p>
        <HudCard
          icono={ListTodo}
          titulo="Tareas"
          dato={`${pendientes.length} pendientes`}
          onClick={() => void navigate({ to: "/tareas" })}
        >
          {pendientes.slice(0, 3).map((t) => (
            <li key={t.id}>{t.titulo}</li>
          ))}
        </HudCard>
        <HudCard
          icono={Bell}
          titulo="Recordatorios"
          dato={proximo ? `${fechaLegible(proximo.fecha)} · ${proximo.hora}` : "Ninguno"}
          onClick={() => void navigate({ to: "/recordatorios" })}
        >
          {recHoy.slice(0, 3).map((r) => (
            <li key={r.id}>
              {r.hora} · {r.actividad}
            </li>
          ))}
        </HudCard>
        <HudCard
          icono={CalendarDays}
          titulo="Eventos de hoy"
          dato={`${eventosHoy.length}`}
          onClick={() => void navigate({ to: "/eventos" })}
        >
          {eventosHoy.slice(0, 3).map((e) => (
            <li key={e.id}>
              {e.hora} · {e.titulo}
            </li>
          ))}
        </HudCard>
        <HudCard
          icono={Repeat}
          titulo="Automatizaciones"
          dato={`${automatizaciones.filter((a) => a.activa).length} activas`}
          onClick={() => void navigate({ to: "/automatizaciones" })}
        />
        <HudCard
          icono={Brain}
          titulo="Memoria"
          dato={`${memoria.length} recuerdos`}
          onClick={() => void navigate({ to: "/memoria" })}
        >
          {memoria.slice(0, 2).map((m) => (
            <li key={m.id} className="truncate">
              {m.informacion}
            </li>
          ))}
        </HudCard>
      </aside>
    </div>
  );
}

function HudCard({
  icono: Icono,
  titulo,
  dato,
  children,
  onClick,
}: {
  icono: typeof ListTodo;
  titulo: string;
  dato: string;
  children?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border bg-card p-3 text-left transition-shadow hover:shadow-soft"
    >
      <div className="flex items-center gap-2">
        <Icono className="size-4 text-ai" />
        <span className="text-sm font-medium">{titulo}</span>
        <span className="ml-auto text-xs text-muted-foreground">{dato}</span>
      </div>
      {children ? (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{children}</ul>
      ) : null}
    </button>
  );
}

function Burbuja({ mensaje: m }: { mensaje: MensajeChat }) {
  const esUsuario = m.autor === "usuario";
  const tono =
    m.tipo === "error"
      ? "border border-destructive/20 bg-destructive/5"
      : m.tipo === "aclaracion"
        ? "border border-warning/20 bg-warning/10"
        : m.tipo === "confirmacion"
          ? "border border-success/20 bg-success/5"
          : esUsuario
            ? "bg-bubble-user text-bubble-user-foreground"
            : "bg-card text-foreground border border-border";

  return (
    <div className={cn("flex", esUsuario ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm shadow-soft",
          tono,
          esUsuario ? "rounded-br-sm" : "rounded-bl-sm",
        )}
      >
        {m.tipo === "voz" && (
          <span className="mb-1 flex items-center gap-1.5 text-[11px] opacity-80">
            <Mic className="size-3" /> Por voz
          </span>
        )}
        {m.tipo === "confirmacion" && <CheckCircle2 className="mb-0.5 inline size-3.5 text-success" />}
        {m.tipo === "error" && <CircleAlert className="mb-0.5 inline size-3.5 text-destructive" />}
        {m.tipo === "aclaracion" && <HelpCircle className="mb-0.5 inline size-3.5 text-warning" />}
        <span className={m.tipo === "confirmacion" || m.tipo === "error" || m.tipo === "aclaracion" ? "ml-1" : ""}>
          {m.texto}
        </span>
        <span className="mt-1 block text-right text-[10px] opacity-50">{m.hora}</span>
      </div>
    </div>
  );
}
