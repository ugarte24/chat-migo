import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, CheckCircle2, Repeat, Sparkles, Zap } from "lucide-react";
import { PageHeader, StatCard } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";
import { Button } from "@/components/ui/button";
import { fechaLegible } from "@/lib/asistente";
import { fechaCorta, hoyISO } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/panel")({
  head: () => ({
    meta: [
      { title: "Inicio | Dilo" },
      {
        name: "description",
        content: "Resumen de tareas, recordatorios, eventos, memoria y automatizaciones.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { usuario, tareas, recordatorios, eventos, memoria, automatizaciones, historial } =
    useAsistente();
  const hoy = hoyISO();
  const pendientes = tareas.filter((t) => t.estado !== "completada");
  const recHoy = recordatorios.filter((r) => r.fecha === hoy && r.estado === "pendiente");
  const eventosProx = eventos.filter((e) => e.fecha >= hoy && e.estado === "pendiente");
  const autosActivas = automatizaciones.filter((a) => a.activa);
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div>
      <PageHeader
        titulo={`${saludo}, ${usuario}`}
        descripcion="Así está tu día. El chat de WhatsApp crea estas actividades; aquí las administras."
        accion={
          <Button asChild>
            <Link to="/chat">Abrir chat</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Tareas pendientes" valor={pendientes.length} tono="primary" />
        <StatCard etiqueta="Recordatorios de hoy" valor={recHoy.length} tono="warning" />
        <StatCard etiqueta="Eventos próximos" valor={eventosProx.length} tono="ai" />
        <StatCard etiqueta="Automatizaciones activas" valor={autosActivas.length} tono="success" />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            icono: Brain,
            titulo: "Memoria",
            texto: "Información que el sistema recuerda.",
            to: "/memoria" as const,
            dato: `${memoria.length} recuerdos autorizados`,
          },
          {
            icono: Zap,
            titulo: "Acción",
            texto: "Actividades que el sistema puede ejecutar.",
            to: "/tareas" as const,
            dato: `${pendientes.length} pendientes de ejecutar`,
          },
          {
            icono: Repeat,
            titulo: "Automatización",
            texto: "Actividades que el sistema puede ejecutar posteriormente de forma programada.",
            to: "/automatizaciones" as const,
            dato: `${autosActivas.length} programadas y activas`,
          },
        ].map(({ icono: Icono, titulo, texto, to, dato }) => (
          <Link key={titulo} to={to} className="panel-card group p-6 transition-shadow hover:shadow-glow">
            <Icono className="size-5 text-ai" />
            <h2 className="mt-3 font-display text-lg font-semibold">{titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
            <p className="mt-3 text-xs font-medium text-primary">{dato}</p>
          </Link>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Lista
          titulo="Actividades de hoy"
          vacio="No hay actividades para hoy."
          items={tareas
            .filter((t) => t.fecha === hoy)
            .map((t) => ({ id: t.id, titulo: t.titulo, detalle: t.prioridad, estado: t.estado }))}
        />
        <Lista
          titulo="Próximos recordatorios"
          vacio="Sin recordatorios próximos."
          items={recordatorios
            .filter((r) => r.fecha >= hoy && r.estado === "pendiente")
            .map((r) => ({
              id: r.id,
              titulo: r.actividad,
              detalle: `${fechaLegible(r.fecha)} · ${r.hora}`,
              estado: r.activo ? "activo" : "inactivo",
            }))}
        />
        <Lista
          titulo="Próximos eventos"
          vacio="No hay eventos agendados."
          items={eventosProx.map((e) => ({
            id: e.id,
            titulo: e.titulo,
            detalle: `${fechaLegible(e.fecha)} · ${e.hora}${e.lugar ? ` · ${e.lugar}` : ""}`,
            estado: e.estado,
          }))}
        />
        <Lista
          titulo="Tareas pendientes"
          vacio="No hay tareas pendientes."
          items={pendientes.map((t) => ({
            id: t.id,
            titulo: t.titulo,
            detalle: `${fechaLegible(t.fecha)} · ${t.prioridad}`,
            estado: t.estado,
          }))}
        />
        <Lista
          titulo="Automatizaciones activas"
          vacio="Ninguna automatización activa."
          items={autosActivas.map((a) => ({
            id: a.id,
            titulo: a.nombre,
            detalle: `${a.frecuencia} · ${a.hora}`,
            estado: "activa",
          }))}
        />
        <div className="panel-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-ai" /> Resumen de memoria
          </h2>
          <p className="text-sm text-muted-foreground">
            El sistema conserva {memoria.length} recuerdos con tu autorización, agrupados en personas,
            preferencias, horarios y actividades frecuentes.
          </p>
          <ul className="mt-3 space-y-2">
            {memoria.slice(0, 3).map((m) => (
              <li key={m.id} className="rounded-lg bg-surface px-3 py-2 text-sm">
                <span className="text-xs text-ai">{m.categoria}</span>
                <p>{m.informacion}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="panel-card mt-8 p-5">
        <h2 className="mb-4 font-semibold">Actividad reciente</h2>
        <ul className="space-y-3">
          {historial.slice(0, 6).map((h) => (
            <li key={h.id} className="flex items-start gap-3 text-sm">
              <CheckCircle2
                className={`mt-0.5 size-4 shrink-0 ${h.estado === "exitoso" ? "text-success" : h.estado === "error" ? "text-destructive" : "text-warning"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{h.accion}</p>
                <p className="truncate text-xs text-muted-foreground">“{h.solicitud}”</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {fechaCorta(h.fecha)} {h.hora}
              </span>
              <EstadoBadge valor={h.estado} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Lista({
  titulo,
  vacio,
  items,
}: {
  titulo: string;
  vacio: string;
  items: { id: string; titulo: string; detalle: string; estado: string }[];
}) {
  return (
    <div className="panel-card p-5">
      <h2 className="mb-3 font-semibold">{titulo}</h2>
      {items.length === 0 && <p className="text-sm text-muted-foreground">{vacio}</p>}
      <ul className="space-y-2">
        {items.slice(0, 4).map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{i.titulo}</p>
              <p className="truncate text-xs text-muted-foreground">{i.detalle}</p>
            </div>
            <EstadoBadge valor={i.estado} />
          </li>
        ))}
      </ul>
    </div>
  );
}
