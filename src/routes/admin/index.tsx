import { Link, createFileRoute } from "@tanstack/react-router";
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
        <p>
          El orbe vive en la{" "}
          <Link to="/admin/aplicacion" className="text-foreground underline">
            aplicación Android
          </Link>
          . Esta web es administración y la landing. La memoria de cada usuario no se muestra aquí.
        </p>
        <p className="mt-2">
          Los roles se asignan en{" "}
          <Link to="/admin/usuarios" className="text-foreground underline">
            Usuarios
          </Link>
          : usuario (app en el celular) o administrador (esta web).
        </p>
      </div>
    </div>
  );
}
