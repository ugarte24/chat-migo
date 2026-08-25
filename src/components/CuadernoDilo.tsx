import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Mic, Search, Send, X } from "lucide-react";
import { DiloIcono } from "@/components/DiloIcono";
import { useAsistente } from "@/lib/store";
import type { MensajeChat } from "@/lib/datos";
import { cn } from "@/lib/utils";

function etiquetaDia(iso?: string) {
  if (!iso) return "Hoy";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Hoy";
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  const ese = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((hoy - ese) / 86_400_000);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  const texto = d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function agruparPorDia(mensajes: MensajeChat[]) {
  const grupos: { dia: string; items: MensajeChat[] }[] = [];
  for (const m of mensajes) {
    const dia = etiquetaDia(m.creadoEn);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.items.push(m);
    else grupos.push({ dia, items: [m] });
  }
  return grupos;
}

export function CuadernoDilo() {
  const { mensajes, enviarMensaje, pensando } = useAsistente();
  const [busqueda, setBusqueda] = useState("");
  const [buscar, setBuscar] = useState(false);
  const [borrador, setBorrador] = useState("");
  const finRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const buscarRef = useRef<HTMLInputElement>(null);
  const entroRef = useRef(false);

  const visibles = useMemo(
    () => mensajes.filter((m) => m.tipo !== "proceso" && m.tipo !== "analisis"),
    [mensajes],
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return visibles;
    return visibles.filter((m) => m.texto.toLowerCase().includes(q));
  }, [busqueda, visibles]);

  const grupos = useMemo(() => agruparPorDia(filtrados), [filtrados]);

  useLayoutEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const alFinal = (suave: boolean) => {
      if (suave) {
        finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        return;
      }
      lista.scrollTop = lista.scrollHeight;
    };
    if (!entroRef.current) {
      alFinal(false);
      requestAnimationFrame(() => alFinal(false));
      if (visibles.length > 0) entroRef.current = true;
      return;
    }
    alFinal(true);
  }, [visibles.length, pensando]);

  useEffect(() => {
    if (buscar) buscarRef.current?.focus();
  }, [buscar]);

  const ajustarAlto = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const enviar = () => {
    const limpio = borrador.trim();
    if (!limpio || pensando) return;
    enviarMensaje(limpio, "texto");
    setBorrador("");
    if (campoRef.current) {
      campoRef.current.style.height = "";
    }
  };

  return (
    <div className="font-dilo flex h-svh min-h-0 flex-col bg-[#f8f9fa] text-[#202124]">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#dadce0] bg-white px-2 sm:px-4">
        <Link
          to="/panel"
          className="inline-flex size-10 items-center justify-center rounded-full text-[#2563eb] hover:bg-[#eff6ff]"
          aria-label="Volver a Dilo"
        >
          <ArrowLeft className="size-5" />
        </Link>
        {buscar ? (
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#80868b]" />
            <input
              ref={buscarRef}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar"
              className="h-10 w-full rounded-full border-0 bg-[#f1f3f4] pl-9 pr-3 text-[15px] outline-none placeholder:text-[#80868b]"
              aria-label="Buscar en la conversación"
            />
          </label>
        ) : (
          <p className="min-w-0 flex-1 truncate text-[16px] font-medium">Conversación</p>
        )}
        <button
          type="button"
          onClick={() => {
            if (buscar) setBusqueda("");
            setBuscar((v) => !v);
          }}
          className="inline-flex size-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
          aria-label={buscar ? "Cerrar búsqueda" : "Buscar en la conversación"}
        >
          {buscar ? <X className="size-5" /> : <Search className="size-5" />}
        </button>
      </header>

      {busqueda.trim() ? (
        <p className="shrink-0 px-4 py-1.5 text-center text-[12px] text-[#80868b]">
          {filtrados.length === 1 ? "1 resultado" : `${filtrados.length} resultados`}
        </p>
      ) : null}

      <div ref={listaRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        {grupos.length === 0 ? (
          <p className="mt-10 text-center text-sm text-[#5f6368]">
            {busqueda.trim()
              ? "No encontré eso en la conversación."
              : "Aún no hay nada aquí. Escribe abajo o vuelve al orbe para hablar."}
          </p>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.dia} className="mb-5">
              <p className="sticky top-0 z-[1] mb-3 bg-[#f8f9fa]/90 py-1 text-center text-[11px] font-medium uppercase tracking-wide text-[#80868b] backdrop-blur-sm">
                {grupo.dia}
              </p>
              <div className="space-y-2">
                {grupo.items.map((m, i) => (
                  <Burbuja
                    key={m.id}
                    mensaje={m}
                    anterior={grupo.items[i - 1]}
                    siguiente={grupo.items[i + 1]}
                  />
                ))}
              </div>
            </section>
          ))
        )}
        {pensando ? <BurbujaPensando /> : null}
        <div ref={finRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="shrink-0 border-t border-[#dadce0] bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <Link
            to="/panel"
            aria-label="Hablar con Dilo"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
          >
            <Mic className="size-5" />
          </Link>
          <textarea
            ref={campoRef}
            value={borrador}
            onChange={(e) => {
              setBorrador(e.target.value);
              ajustarAlto(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            rows={1}
            placeholder="Escribe a Dilo"
            aria-label="Escribirle a Dilo"
            disabled={pensando}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-[1.4rem] border-0 bg-[#f1f3f4] px-4 py-2.5 text-[15px] leading-5 outline-none placeholder:text-[#80868b] focus:ring-2 focus:ring-[#0891b2]/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pensando || !borrador.trim()}
            aria-label="Enviar"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0891b2] text-white disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function BurbujaPensando() {
  return (
    <div className="flex items-end justify-start gap-2">
      <DiloIcono className="mb-0.5 size-7" />
      <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-[0_1px_2px_rgb(60_64_67/0.12)] ring-1 ring-[#dadce0]/70">
        <span className="flex h-4 items-center gap-1" aria-label="Dilo está pensando">
          <span className="size-1.5 rounded-full bg-[#80868b] [animation:dilo-punto_1.1s_ease-in-out_infinite]" />
          <span className="size-1.5 rounded-full bg-[#80868b] [animation:dilo-punto_1.1s_ease-in-out_0.15s_infinite]" />
          <span className="size-1.5 rounded-full bg-[#80868b] [animation:dilo-punto_1.1s_ease-in-out_0.3s_infinite]" />
        </span>
      </div>
    </div>
  );
}

function Burbuja({
  mensaje: m,
  anterior,
  siguiente,
}: {
  mensaje: MensajeChat;
  anterior?: MensajeChat;
  siguiente?: MensajeChat;
}) {
  const esUsuario = m.autor === "usuario";
  const mostrarHora = !(siguiente && siguiente.autor === m.autor && siguiente.hora === m.hora);
  const mostrarOrbe = !esUsuario && (!anterior || anterior.autor !== m.autor);

  return (
    <div className={cn("flex items-end gap-2", esUsuario ? "justify-end" : "justify-start")}>
      {!esUsuario ? (
        mostrarOrbe ? (
          <DiloIcono className="mb-0.5 size-7" />
        ) : (
          <span className="size-7 shrink-0" aria-hidden />
        )
      ) : null}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] leading-5",
          esUsuario
            ? "rounded-br-md bg-[#0891b2] text-white"
            : m.tipo === "error"
              ? "rounded-bl-md bg-white text-[#202124] ring-1 ring-[#fca5a5]"
              : "rounded-bl-md bg-white text-[#202124] shadow-[0_1px_2px_rgb(60_64_67/0.12)] ring-1 ring-[#dadce0]/70",
        )}
      >
        {m.tipo === "voz" ? (
          <span className="mb-1 flex items-center gap-1 text-[11px] opacity-80">
            <Mic className="size-3" />
            Voz
          </span>
        ) : null}
        {m.tipo === "confirmacion" ? (
          <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[#0891b2]">
            <Check className="size-3" />
            Hecho
          </span>
        ) : null}
        <p className="whitespace-pre-line">{m.texto}</p>
        {mostrarHora ? (
          <span className={cn("mt-1 block text-right text-[10px]", esUsuario ? "text-white/70" : "text-[#80868b]")}>
            {m.hora}
          </span>
        ) : null}
      </div>
    </div>
  );
}
