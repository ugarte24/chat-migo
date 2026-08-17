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
import { fechaCorta } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/historial")({
  head: () => ({ meta: [{ title: "Historial | Dilo" }] }),
  component: HistorialPage,
});

function HistorialPage() {
  const { historial } = useAsistente();

  return (
    <div>
      <PageHeader
        titulo="Historial"
        descripcion="Registro de las solicitudes recibidas y las acciones ejecutadas por el sistema."
      />
      <div className="panel-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Acción realizada</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historial.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="whitespace-nowrap">{fechaCorta(h.fecha)}</TableCell>
                <TableCell>{h.hora}</TableCell>
                <TableCell className="max-w-xs truncate">“{h.solicitud}”</TableCell>
                <TableCell>{h.accion}</TableCell>
                <TableCell>
                  <EstadoBadge valor={h.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
