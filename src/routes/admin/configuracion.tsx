import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/panel/PageHeader";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/configuracion")({
  head: () => ({ meta: [{ title: "Configuración | Administración" }] }),
  component: AdminConfig,
});

function AdminConfig() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Configuración del sistema"
        descripcion="Parámetros globales. No otorgan acceso a la memoria de los usuarios."
      />
      <section className="panel-card space-y-4 p-5">
        <Fila titulo="Registro de actividad" texto="Guardar cada acción del sistema en el historial." />
        <Fila
          titulo="Acceso a memoria de usuarios"
          texto="Bloqueado por diseño. Requiere autorización explícita del usuario."
          locked
        />
      </section>
    </div>
  );
}

function Fila({
  titulo,
  texto,
  defaultOn = true,
  locked = false,
}: {
  titulo: string;
  texto: string;
  defaultOn?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label className="text-sm font-medium">{titulo}</Label>
        <p className="text-xs text-muted-foreground">{texto}</p>
      </div>
      <Switch defaultChecked={locked ? false : defaultOn} disabled={locked} />
    </div>
  );
}
