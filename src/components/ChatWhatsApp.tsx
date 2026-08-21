import { useEffect, useRef, useState } from "react";
import { AudioLines, CheckCircle2, CircleAlert, HelpCircle, Mic, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MensajeChat } from "@/lib/store";
import { cn } from "@/lib/utils";
import { reconocimientoVozDisponible, transcribirEnNavegador } from "@/lib/voz";

interface Props {
  mensajes: MensajeChat[];
  onEnviar: (texto: string, tipo: "texto" | "voz") => void;
  sugerencias: string[];
}

export const SUGERENCIAS_CHAT = [
  "Recuérdame mañana a las 8 enviar el informe.",
  "Agenda una reunión con Carlos el viernes a las 3.",
  "¿Qué tareas tengo para hoy?",
  "Marca como hecha comprar materiales.",
  "Elimina el recordatorio de llamar al banco.",
];

export function ChatWhatsApp({ mensajes, onEnviar, sugerencias }: Props) {
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const vozReal = reconocimientoVozDisponible();

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  const enviar = (valor: string, tipo: "texto" | "voz" = "texto") => {
    const limpio = valor.trim();
    if (!limpio) return;
    onEnviar(limpio, tipo);
    setTexto("");
  };

  const enviarVoz = async () => {
    if (grabando) return;
    setGrabando(true);
    try {
      if (vozReal) {
        const transcrito = await transcribirEnNavegador();
        enviar(transcrito, "voz");
        return;
      }
      const frase = texto.trim() || "mañana a las ocho recuérdame llevar los documentos";
      await new Promise((r) => setTimeout(r, 900));
      enviar(frase, "voz");
    } catch {
      const frase = texto.trim();
      if (frase) enviar(frase, "voz");
    } finally {
      setGrabando(false);
    }
  };

  return (
    <div className="flex h-full min-h-[32rem] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-glow">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-accent text-primary-foreground">
          <AudioLines className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Dilo</p>
          <p className="text-xs text-primary">en línea · interpreta texto y voz</p>
        </div>
        <span className="hidden rounded-full bg-ai-soft px-2.5 py-1 text-[10px] font-medium text-ai sm:inline">
          {vozReal ? "Voz del navegador" : "Voz local"}
        </span>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,#e2e8f0_1px,transparent_0)] bg-[size:18px_18px] px-4 py-4">
        {mensajes.map((m) => (
          <Burbuja key={m.id} mensaje={m} />
        ))}
        {grabando && (
          <div className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-bubble-user px-3.5 py-2 text-sm text-bubble-user-foreground">
              <span className="flex items-center gap-2 text-xs">
                <Mic className="size-3 animate-pulse" />{" "}
                {vozReal ? "Escuchando…" : "Grabando nota de voz…"}
              </span>
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border bg-surface/60 px-3 py-2">
        {sugerencias.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => enviar(s)}
            className="rounded-full border border-border bg-card px-3 py-1 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
        className="flex items-center gap-2 border-t border-border bg-surface px-3 py-3"
      >
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={grabando ? "Escuchando…" : "Escribe una instrucción…"}
          className="h-11 rounded-full border-border bg-card"
          aria-label="Mensaje para el asistente"
          disabled={grabando}
        />
        <Button
          type="button"
          onClick={() => void enviarVoz()}
          size="icon"
          variant="secondary"
          className={cn("size-11 shrink-0 rounded-full", grabando && "animate-pulse bg-ai/20")}
          aria-label="Enviar nota de voz"
        >
          <Mic className="size-5" />
        </Button>
        <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" aria-label="Enviar mensaje">
          <Send className="size-5" />
        </Button>
      </form>
    </div>
  );
}

function Burbuja({ mensaje: m }: { mensaje: MensajeChat }) {
  if (m.tipo === "analisis" && m.analisis) {
    return (
      <div className="animate-rise w-full max-w-md">
        <div className="rounded-2xl border border-ai/20 bg-gradient-ai p-4 shadow-soft">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ai">
            <Sparkles className="size-3.5" /> Inteligencia artificial
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Campo etiqueta="Intención" valor={m.analisis.intencion} />
            <Campo etiqueta="Actividad" valor={m.analisis.actividad} />
            <Campo etiqueta="Fecha" valor={m.analisis.fecha} />
            <Campo etiqueta="Hora" valor={m.analisis.hora} />
          </dl>
          <p
            className={cn(
              "mt-3 text-xs font-medium",
              m.analisis.correcto ? "text-success" : "text-warning",
            )}
          >
            Estado: {m.analisis.estado}
          </p>
        </div>
      </div>
    );
  }

  if (m.tipo === "proceso") {
    return (
      <div className="animate-rise w-fit max-w-[90%] rounded-2xl border border-ai/15 bg-ai-soft px-3.5 py-2 text-sm text-foreground">
        <p className="text-xs">{m.texto}</p>
        {m.transcripcion && (
          <p className="mt-1 text-xs text-muted-foreground">
            Transcripción: “{m.transcripcion.charAt(0).toUpperCase()}
            {m.transcripcion.slice(1)}
            {m.transcripcion.endsWith(".") ? "" : "."}”
          </p>
        )}
      </div>
    );
  }

  const esUsuario = m.autor === "usuario";
  const tono =
    m.tipo === "error"
      ? "border border-destructive/20 bg-destructive/5 text-foreground"
      : m.tipo === "aclaracion"
        ? "border border-warning/20 bg-warning/10 text-foreground"
        : m.tipo === "confirmacion"
          ? "border border-success/20 bg-success/5 text-foreground"
          : esUsuario
            ? "bg-bubble-user text-bubble-user-foreground"
            : "bg-bubble-bot text-bubble-bot-foreground border border-border";

  return (
    <div className={cn("flex", esUsuario ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm shadow-soft", tono, esUsuario ? "rounded-br-sm" : "rounded-bl-sm")}>
        {m.tipo === "voz" && (
          <span className="mb-1 flex items-center gap-2 text-xs opacity-90">
            <Mic className="size-3" />
            <span className="flex h-4 items-end gap-0.5">
              {[4, 8, 5, 10, 6, 9, 4].map((h, i) => (
                <span key={i} className="w-0.5 rounded-full bg-current" style={{ height: h }} />
              ))}
            </span>
            nota de voz
          </span>
        )}
        {m.tipo === "confirmacion" && (
          <CheckCircle2 className="mb-1 inline size-3.5 text-success" />
        )}
        {m.tipo === "error" && <CircleAlert className="mb-1 inline size-3.5 text-destructive" />}
        {m.tipo === "aclaracion" && <HelpCircle className="mb-1 inline size-3.5 text-warning" />}
        <span className={m.tipo === "confirmacion" || m.tipo === "error" || m.tipo === "aclaracion" ? "ml-1" : ""}>
          {m.texto}
        </span>
        <span className="mt-1 block text-right text-[10px] opacity-60">{m.hora}</span>
      </div>
    </div>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg bg-card/80 px-2.5 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 font-medium">{valor}</dd>
    </div>
  );
}
