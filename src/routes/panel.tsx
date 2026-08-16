import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  Repeat,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatWhatsApp } from "@/components/ChatWhatsApp";
import {
  fechaLegible,
  horaAhora,
  interpretar,
  uid,
  type Automatizacion,
  type Evento,
  type MemoriaItem,
  type Mensaje,
  type Recordatorio,
  type Tarea,
} from "@/lib/asistente";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel del asistente | Asistente Diario" },
      {
        name: "description",
        content:
          "Panel de control del asistente de WhatsApp: tareas, recordatorios, eventos, memoria y automatizaciones creadas con lenguaje natural.",
      },
      { property: "og:title", content: "Panel del asistente | Asistente Diario" },
      {
        property: "og:description",
        content:
          "Simula una conversación de WhatsApp y observa cómo se registran tareas, recordatorios, eventos y automatizaciones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Panel,
});

const SUGERENCIAS = [
  "Recuérdame mañana a las 8 llevar los documentos",
  "Agenda una reunión con Carlos el viernes a las 3 de la tarde",
  "Agrega a mis tareas comprar materiales mañana",
  "Todos los lunes a las 8 recuérdame revisar mis tareas",
  "Recuerda que mi reunión semanal con Carlos es los lunes",
  "¿Qué tengo pendiente?",
];

function Panel() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: uid(),
      autor: "asistente",
      texto:
        "¡Hola! Soy tu asistente. Escríbeme o envíame una nota de voz con lo que necesitas: “Recuérdame mañana a las 8 llevar los documentos”.",
      tipo: "texto",
      hora: horaAhora(),
    },
  ]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [memoria, setMemoria] = useState<MemoriaItem[]>([]);
  const [automatizaciones, setAutomatizaciones] = useState<Automatizacion[]>([]);

  const responder = (texto: string) =>
    setMensajes((prev) => [
      ...prev,
      { id: uid(), autor: "asistente", texto, tipo: "texto", hora: horaAhora() },
    ]);

  const procesar = (texto: string, tipo: "texto" | "voz") => {
    setMensajes((prev) => [
      ...prev,
      { id: uid(), autor: "usuario", texto, tipo, hora: horaAhora() },
    ]);

    const r = interpretar(texto);
    const hoyISO = new Date().toISOString().slice(0, 10);

    setTimeout(() => {
      switch (r.intencion) {
        case "automatizacion": {
          setAutomatizaciones((p) => [
            ...p,
            {
              id: uid(),
              accion: r.actividad,
              frecuencia: r.frecuencia ?? "Semanal",
              hora: r.hora ?? "08:00",
              estado: "activa",
            },
          ]);
          responder(
            `Automatización creada 🔄\n${r.frecuencia ?? "Semanal"} a las ${r.hora ?? "08:00"}: ${r.actividad}.`,
          );
          break;
        }
        case "memoria": {
          setMemoria((p) => [
            ...p,
            {
              id: uid(),
              informacion: r.actividad,
              categoria: r.persona ? "Personas frecuentes" : "Preferencias",
              fecha: hoyISO,
            },
          ]);
          responder(`Guardado en tu memoria 🧠: “${r.actividad}”. Puedes pedirme que lo elimine cuando quieras.`);
          break;
        }
        case "evento": {
          if (!r.fecha || !r.hora) {
            responder("¿Para qué día y a qué hora agendo el evento?");
            break;
          }
          setEventos((p) => [
            ...p,
            {
              id: uid(),
              titulo: r.actividad,
              persona: r.persona,
              fecha: r.fecha!,
              hora: r.hora!,
              estado: "pendiente",
            },
          ]);
          responder(
            `Evento registrado 📅 ${r.actividad}${r.persona ? ` con ${r.persona}` : ""}, el ${fechaLegible(r.fecha)} a las ${r.hora}.`,
          );
          break;
        }
        case "recordatorio": {
          if (!r.fecha || !r.hora) {
            responder(
              `Entendí “${r.actividad}”, pero me falta ${!r.fecha ? "la fecha" : "la hora"}. ¿Cuándo te lo recuerdo?`,
            );
            break;
          }
          setRecordatorios((p) => [
            ...p,
            { id: uid(), actividad: r.actividad, fecha: r.fecha!, hora: r.hora!, estado: "pendiente" },
          ]);
          responder(`Listo. Te recordaré el ${fechaLegible(r.fecha)} a las ${r.hora}: ${r.actividad}. 🔔`);
          break;
        }
        case "consulta": {
          const lineas = [
            `Tareas pendientes: ${tareas.filter((t) => t.estado === "pendiente").length}`,
            `Recordatorios programados: ${recordatorios.length}`,
            `Eventos agendados: ${eventos.length}`,
            `Automatizaciones activas: ${automatizaciones.filter((a) => a.estado === "activa").length}`,
          ];
          responder(`Esto es lo que tengo registrado:\n• ${lineas.join("\n• ")}`);
          break;
        }
        case "tarea":
        default: {
          setTareas((p) => [
            ...p,
            {
              id: uid(),
              titulo: r.actividad,
              fecha: r.fecha,
              prioridad: r.prioridad,
              estado: "pendiente",
            },
          ]);
          responder(
            `Tarea agregada ✅ “${r.actividad}”${r.fecha ? ` para el ${fechaLegible(r.fecha)}` : ""} (prioridad ${r.prioridad}).`,
          );
        }
      }
    }, 450);
  };

  const resumen = [
    { icono: ListTodo, etiqueta: "Tareas", valor: tareas.length },
    { icono: Bell, etiqueta: "Recordatorios", valor: recordatorios.length },
    { icono: CalendarDays, etiqueta: "Eventos", valor: eventos.length },
    { icono: Brain, etiqueta: "Memoria", valor: memoria.length },
    { icono: Repeat, etiqueta: "Automatizaciones", valor: automatizaciones.length },
  ];

  return (
    <main className="min-h-screen bg-hero-glow px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-3" /> Volver al inicio
            </Link>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Panel del asistente</h1>
            <p className="text-sm text-muted-foreground">
              Escribe como lo harías en WhatsApp y observa cómo se convierte en acciones.
            </p>
          </div>
          <Badge variant="secondary" className="hidden md:inline-flex">
            Prototipo demostrativo
          </Badge>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {resumen.map(({ icono: Icono, etiqueta, valor }) => (
            <div key={etiqueta} className="panel-card p-4">
              <Icono className="mb-2 size-4 text-primary" />
              <p className="text-2xl font-semibold">{valor}</p>
              <p className="text-xs text-muted-foreground">{etiqueta}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <ChatWhatsApp mensajes={mensajes} onEnviar={procesar} sugerencias={SUGERENCIAS} />

          <Tabs defaultValue="tareas" className="panel-card p-4">
            <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-surface">
              <TabsTrigger value="tareas">Tareas</TabsTrigger>
              <TabsTrigger value="recordatorios">Recordatorios</TabsTrigger>
              <TabsTrigger value="eventos">Eventos</TabsTrigger>
              <TabsTrigger value="memoria">Memoria</TabsTrigger>
              <TabsTrigger value="automatizaciones">Automatizaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="tareas" className="mt-4 space-y-2">
              {tareas.length === 0 && <Vacio texto="Aún no hay tareas registradas." />}
              {tareas.map((t) => (
                <Fila
                  key={t.id}
                  titulo={t.titulo}
                  detalle={`${fechaLegible(t.fecha)} · prioridad ${t.prioridad}`}
                  completado={t.estado === "completada"}
                  onCompletar={() =>
                    setTareas((p) =>
                      p.map((x) =>
                        x.id === t.id
                          ? { ...x, estado: x.estado === "completada" ? "pendiente" : "completada" }
                          : x,
                      ),
                    )
                  }
                  onEliminar={() => setTareas((p) => p.filter((x) => x.id !== t.id))}
                />
              ))}
            </TabsContent>

            <TabsContent value="recordatorios" className="mt-4 space-y-2">
              {recordatorios.length === 0 && <Vacio texto="Sin recordatorios programados." />}
              {recordatorios.map((r) => (
                <Fila
                  key={r.id}
                  titulo={r.actividad}
                  detalle={`${fechaLegible(r.fecha)} a las ${r.hora}`}
                  onEliminar={() => setRecordatorios((p) => p.filter((x) => x.id !== r.id))}
                />
              ))}
            </TabsContent>

            <TabsContent value="eventos" className="mt-4 space-y-2">
              {eventos.length === 0 && <Vacio texto="No hay eventos agendados." />}
              {eventos.map((e) => (
                <Fila
                  key={e.id}
                  titulo={e.titulo}
                  detalle={`${fechaLegible(e.fecha)} a las ${e.hora}${e.persona ? ` · con ${e.persona}` : ""}`}
                  onEliminar={() => setEventos((p) => p.filter((x) => x.id !== e.id))}
                />
              ))}
            </TabsContent>

            <TabsContent value="memoria" className="mt-4 space-y-2">
              {memoria.length === 0 && <Vacio texto="La memoria está vacía." />}
              {memoria.map((m) => (
                <Fila
                  key={m.id}
                  titulo={m.informacion}
                  detalle={m.categoria}
                  onEliminar={() => setMemoria((p) => p.filter((x) => x.id !== m.id))}
                />
              ))}
            </TabsContent>

            <TabsContent value="automatizaciones" className="mt-4 space-y-2">
              {automatizaciones.length === 0 && <Vacio texto="No hay automatizaciones activas." />}
              {automatizaciones.map((a) => (
                <Fila
                  key={a.id}
                  titulo={a.accion}
                  detalle={`${a.frecuencia} a las ${a.hora} · ${a.estado}`}
                  onEliminar={() => setAutomatizaciones((p) => p.filter((x) => x.id !== a.id))}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {texto}
    </p>
  );
}

function Fila({
  titulo,
  detalle,
  completado,
  onCompletar,
  onEliminar,
}: {
  titulo: string;
  detalle: string;
  completado?: boolean;
  onCompletar?: () => void;
  onEliminar: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${completado ? "line-through opacity-60" : ""}`}>
          {titulo}
        </p>
        <p className="truncate text-xs text-muted-foreground">{detalle}</p>
      </div>
      {onCompletar && (
        <Button variant="ghost" size="icon" onClick={onCompletar} aria-label="Completar">
          <CheckCircle2 className={`size-4 ${completado ? "text-primary" : ""}`} />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={onEliminar} aria-label="Eliminar">
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}
