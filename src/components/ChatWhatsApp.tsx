import { useEffect, useRef, useState } from "react";
import { Mic, Send, Phone, Video, MoreVertical, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Mensaje } from "@/lib/asistente";

interface Props {
  mensajes: Mensaje[];
  onEnviar: (texto: string, tipo: "texto" | "voz") => void;
  sugerencias: string[];
}

export function ChatWhatsApp({ mensajes, onEnviar, sugerencias }: Props) {
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  const enviar = (valor: string, tipo: "texto" | "voz" = "texto") => {
    const limpio = valor.trim();
    if (!limpio) return;
    onEnviar(limpio, tipo);
    setTexto("");
  };

  const simularVoz = () => {
    if (!texto.trim()) {
      setGrabando(true);
      setTimeout(() => {
        setGrabando(false);
        enviar("Mañana a las ocho recuérdame llevar los documentos", "voz");
      }, 1200);
      return;
    }
    enviar(texto, "voz");
  };

  return (
    <div className="flex h-[36rem] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-glow">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-accent text-primary-foreground">
          <Bot className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Asistente Diario</p>
          <p className="text-xs text-primary">en línea · responde al instante</p>
        </div>
        <Phone className="size-4 text-muted-foreground" />
        <Video className="size-4 text-muted-foreground" />
        <MoreVertical className="size-4 text-muted-foreground" />
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background/40 px-4 py-4">
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.autor === "usuario" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm shadow-soft ${
                m.autor === "usuario"
                  ? "rounded-br-sm bg-bubble-user text-bubble-user-foreground"
                  : "rounded-bl-sm bg-bubble-bot text-bubble-bot-foreground"
              }`}
            >
              {m.tipo === "voz" && (
                <span className="mb-1 flex items-center gap-2 text-xs opacity-80">
                  <Mic className="size-3" /> nota de voz transcrita
                </span>
              )}
              {m.texto}
              <span className="mt-1 block text-right text-[10px] opacity-60">{m.hora}</span>
            </div>
          </div>
        ))}
        <div ref={finRef} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border bg-surface/60 px-3 py-2">
        {sugerencias.map((s) => (
          <button
            key={s}
            onClick={() => enviar(s)}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
          placeholder={grabando ? "Grabando nota de voz…" : "Escribe un mensaje"}
          className="h-11 rounded-full border-border bg-card"
          aria-label="Mensaje para el asistente"
        />
        <Button
          type="button"
          onClick={simularVoz}
          size="icon"
          variant="secondary"
          className={`size-11 shrink-0 rounded-full ${grabando ? "animate-pulse" : ""}`}
          aria-label="Enviar nota de voz"
        >
          <Mic className="size-5" />
        </Button>
        <Button
          type="submit"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          aria-label="Enviar mensaje"
        >
          <Send className="size-5" />
        </Button>
      </form>
    </div>
  );
}
