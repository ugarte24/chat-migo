import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, StatCard } from "@/components/panel/PageHeader";
import { contarTabla, listarPerfiles } from "@/lib/repositorio";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Administración | Dilo" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [usuarios, setUsuarios] = useState(0);
  const [tareas, setTareas] = useState(0);
  const [recordatorios, setRecordatorios] = useState(0);
  const [automatizaciones, setAutomatizaciones] = useState(0);

  useEffect(() => {
    void Promise.all([
      listarPerfiles(),
      contarTabla("tareas"),
      contarTabla("recordatorios"),
      contarTabla("automatizaciones"),
    ]).then(([perfiles, t, r, a]) => {
      setUsuarios(perfiles.length);
      setTareas(t);
      setRecordatorios(r);
      setAutomatizaciones(a);
    });
  }, []);

  return (
    <div>
      <PageHeader
        titulo="Dashboard administrativo"
        descripcion="Vista general: usuarios, actividad y automatizaciones. Sin acceso a la memoria personal."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Usuarios registrados" valor={usuarios} />
        <StatCard etiqueta="Tareas en el sistema" valor={tareas} tono="ai" />
        <StatCard etiqueta="Recordatorios" valor={recordatorios} tono="warning" />
        <StatCard etiqueta="Automatizaciones" valor={automatizaciones} tono="success" />
      </div>
      <div className="panel-card mt-8 p-5 text-sm text-muted-foreground">
        Este panel supervisa el sistema. La memoria de cada usuario permanece protegida y no se
        muestra aquí. Para promover un administrador:{" "}
        <code className="text-xs">update perfiles set rol = 'administrador' where correo = '…'</code>
      </div>
    </div>
  );
}
