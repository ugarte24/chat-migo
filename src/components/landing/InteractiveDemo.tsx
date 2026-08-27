import { useState } from "react";
import { cn } from "@/lib/utils";

const EJEMPLOS = [
  {
    frase: "Recuérdame mañana a las 8 enviar el informe.",
    respuesta: "Listo. Te recordaré mañana a las 08:00 enviar el informe.",
    tipo: "Recordatorio creado",
    detalle: "Mañana · 08:00",
  },
  {
    frase: "Agenda una reunión para el viernes a las 3.",
    respuesta: "Entendido. He registrado la reunión para el viernes a las 15:00.",
    tipo: "Evento creado",
    detalle: "Viernes · 15:00",
  },
  {
    frase: "¿Qué tengo pendiente hoy?",
    respuesta: "Hoy tienes 3 tareas pendientes y 2 recordatorios programados.",
    tipo: "Consulta",
    detalle: "3 pendientes · 2 avisos",
  },
  {
    frase: "Todos los lunes recuérdame revisar las ventas.",
    respuesta: "Automatización creada. Todos los lunes te recordaré revisar las ventas.",
    tipo: "Automatización activa",
    detalle: "Lunes · recurrente",
  },
] as const;

export function InteractiveDemo() {
  const [indice, setIndice] = useState(0);
  const actual = EJEMPLOS[indice]!;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
      <div className="flex flex-col gap-2">
        {EJEMPLOS.map((ejemplo, i) => (
          <button
            key={ejemplo.frase}
            type="button"
            onClick={() => setIndice(i)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm leading-relaxed transition-colors",
              i === indice
                ? "border-primary/25 bg-white text-foreground shadow-soft"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-white/70 hover:text-foreground",
            )}
          >
            {ejemplo.frase}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-soft md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Conversación en el orbe
        </p>
        <div className="mt-5 space-y-3">
          <p
            key={`u-${indice}`}
            className="landing-chat-in ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground"
          >
            {actual.frase}
          </p>
          <p
            key={`a-${indice}`}
            className="landing-chat-in max-w-[92%] rounded-2xl rounded-bl-md border border-border bg-[#F8FAFC] px-4 py-3 text-sm text-foreground"
            style={{ animationDelay: "0.18s" }}
          >
            {actual.respuesta}
          </p>
          <div
            key={`r-${indice}`}
            className="landing-chat-in rounded-xl border border-border p-4"
            style={{ animationDelay: "0.36s" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {actual.tipo}
            </p>
            <p className="mt-1 text-sm font-medium">{actual.detalle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
