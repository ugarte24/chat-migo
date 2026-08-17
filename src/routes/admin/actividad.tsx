import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACTIVIDAD_ADMIN } from "@/lib/datos";

export const Route = createFileRoute("/admin/actividad")({
  head: () => ({ meta: [{ title: "Actividad | Administración" }] }),
  component: ActividadPage,
});

function ActividadPage() {
  return (
    <div>
      <PageHeader
        titulo="Actividad del sistema"
        descripcion="Acciones recientes de los usuarios. No incluye el contenido de la memoria personal."
      />
      <div className="panel-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ACTIVIDAD_ADMIN.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.usuario}</TableCell>
                <TableCell>{a.accion}</TableCell>
                <TableCell className="whitespace-nowrap">{a.fecha}</TableCell>
                <TableCell>
                  <EstadoBadge valor={a.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
