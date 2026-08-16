import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Brain,
  CalendarDays,
  ListTodo,
  MessageCircle,
  Mic,
  Repeat,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asistente Diario | Automatiza tu día desde WhatsApp" },
      {
        name: "description",
        content:
          "Asistente inteligente en WhatsApp que convierte tus mensajes de texto o notas de voz en tareas, recordatorios, eventos y automatizaciones.",
      },
      { property: "og:title", content: "Asistente Diario | Automatiza tu día desde WhatsApp" },
      {
        property: "og:description",
        content:
          "Habla natural por WhatsApp y deja que la IA registre y ejecute tus actividades diarias: tareas, recordatorios, eventos, memoria y automatizaciones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

const FUNCIONES = [
  { icono: ListTodo, titulo: "Tareas", texto: "Crear, consultar, modificar, completar y eliminar tareas con prioridad y fecha." },
  { icono: Bell, titulo: "Recordatorios", texto: "“Recuérdame mañana a las 8 llevar los documentos” y recibe el aviso a tiempo." },
  { icono: CalendarDays, titulo: "Eventos", texto: "Reuniones, citas y compromisos con fecha, hora y persona identificada." },
  { icono: Brain, titulo: "Memoria", texto: "Guarda preferencias, personas frecuentes y horarios habituales que tú autorices." },
  { icono: Repeat, titulo: "Automatizaciones", texto: "Acciones recurrentes: “todos los viernes a las 6 recuérdame el reporte”." },
  { icono: Mic, titulo: "Notas de voz", texto: "La voz se transcribe y se procesa igual que un mensaje escrito." },
];

const FLUJO = [
  "Recepción del mensaje en WhatsApp",
  "Texto o transcripción de la nota de voz",
  "Interpretación con inteligencia artificial",
  "Consulta de la memoria del usuario",
  "Motor de automatización y base de datos",
  "Confirmación y aviso programado",
];

const ROLES = [
  { icono: Users, titulo: "Usuario", texto: "Gestiona sus actividades por WhatsApp, controla su memoria y recibe notificaciones." },
  { icono: UserCog, titulo: "Administrador", texto: "Supervisa usuarios, automatizaciones, registros e incidencias desde el panel." },
  { icono: Sparkles, titulo: "Sistema / IA", texto: "Interpreta instrucciones, ejecuta acciones y envía respuestas automáticamente." },
];

function Inicio() {
  return (
    <main className="min-h-screen bg-hero-glow">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 md:px-8">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-accent text-primary-foreground">
            <MessageCircle className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">Asistente Diario</span>
        </div>
        <Button asChild size="sm">
          <Link to="/panel">Abrir panel</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8 md:pt-16">
        <Badge variant="secondary" className="mb-5">Prototipo v1.0 · Agosto 2026</Badge>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Habla por WhatsApp,{" "}
          <span className="text-gradient-accent">tu día se organiza solo</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Un asistente inteligente que entiende lenguaje natural —texto o notas de voz— y lo
          convierte en tareas, recordatorios, eventos y automatizaciones reales. Sin comandos, sin
          formularios.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/panel">Probar el asistente</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#arquitectura">Ver cómo funciona</a>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { t: "🧠 Memoria", d: "Conserva la información que tú autorizas y la usa después." },
            { t: "⚙️ Acción", d: "No solo responde: registra y ejecuta lo que pediste." },
            { t: "🔄 Automatización", d: "Programa acciones recurrentes sin volver a pedirlas." },
          ].map((c) => (
            <div key={c.t} className="panel-card p-6">
              <p className="font-display text-lg font-semibold">{c.t}</p>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2 className="text-3xl font-bold">Funcionalidades del prototipo</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Todo lo necesario para demostrar la innovación central: una instrucción cotidiana se
          transforma en una acción automatizada.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
            <article key={titulo} className="panel-card p-6">
              <Icono className="size-5 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="arquitectura" className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Flujo del sistema</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Del mensaje a la ejecución: cada paso queda registrado en la base de datos.
            </p>
            <ol className="mt-6 space-y-3">
              {FLUJO.map((paso, i) => (
                <li key={paso} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-accent text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm">{paso}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="panel-card p-6">
            <h3 className="text-lg font-semibold">Ejemplo real</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-bubble-user px-4 py-2 text-bubble-user-foreground">
                Recuérdame mañana a las 8 llevar los documentos
              </p>
              <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-bubble-bot px-4 py-2 text-bubble-bot-foreground">
                Listo. Te recordaré mañana a las 08:00 llevar los documentos.
              </p>
              <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-bubble-bot px-4 py-2 text-bubble-bot-foreground">
                🔔 Recordatorio: llevar los documentos.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              {[
                ["Acción", "Recordatorio"],
                ["Fecha", "Mañana"],
                ["Hora", "08:00"],
                ["Actividad", "Llevar los documentos"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-surface px-3 py-2">
                  <span className="block text-[10px] uppercase tracking-wide">{k}</span>
                  <span className="text-sm text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2 className="text-3xl font-bold">Roles del sistema</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ROLES.map(({ icono: Icono, titulo, texto }) => (
            <article key={titulo} className="panel-card p-6">
              <Icono className="size-5 text-accent" />
              <h3 className="mt-4 text-lg font-semibold">{titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
            </article>
          ))}
        </div>
        <div className="panel-card mt-6 flex flex-wrap items-center gap-3 p-5 text-sm text-muted-foreground">
          <ShieldCheck className="size-5 text-primary" />
          El administrador no accede a la memoria personal del usuario sin autorización explícita.
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
        <div className="panel-card flex flex-col items-start gap-4 bg-gradient-accent p-8 text-primary-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Prueba la conversación ahora</h2>
            <p className="mt-1 text-sm opacity-80">
              Simula mensajes y notas de voz y observa cómo se registran las actividades.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link to="/panel">Abrir el panel</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Asistente Diario · Sistema inteligente de gestión y automatización de actividades por WhatsApp
      </footer>
    </main>
  );
}
