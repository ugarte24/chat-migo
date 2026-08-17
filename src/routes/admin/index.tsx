import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/panel/PageHeader";
import { USUARIOS_ADMIN } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Administración | Dilo" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { tareas, recordatorios, automatizaciones } = useAsistente();
  const activos = USUARIOS_ADMIN.filter((u) => u.estado === "activo").length;
  const recordatoriosEjecutados = recordatorios.filter((r) => r.estado === "completado").length;

  return (
    <div>
      <PageHeader
        titulo="Dashboard administrativo"
        descripcion="Vista general del prototipo: usuarios, actividad y automatizaciones. Sin acceso a la memoria personal."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard etiqueta="Usuarios registrados" valor={USUARIOS_ADMIN.length} />
        <StatCard etiqueta="Usuarios activos" valor={activos} tono="success" />
        <StatCard etiqueta="Tareas creadas" valor={tareas.length} tono="ai" />
        <StatCard etiqueta="Recordatorios ejecutados" valor={recordatoriosEjecutados} tono="warning" />
        <StatCard
          etiqueta="Automatizaciones activas"
          valor={automatizaciones.filter((a) => a.activa).length}
          tono="success"
        />
      </div>
      <div className="panel-card mt-8 p-5 text-sm text-muted-foreground">
        Este panel supervisa el sistema. La memoria de cada usuario permanece protegida y no se
        muestra aquí.
      </div>
    </div>
  );
}
