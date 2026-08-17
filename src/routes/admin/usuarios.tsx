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
import { fechaCorta, USUARIOS_ADMIN } from "@/lib/datos";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios | Administración" }] }),
  component: UsuariosPage,
});

function UsuariosPage() {
  return (
    <div>
      <PageHeader
        titulo="Usuarios"
        descripcion="Cuentas registradas en el prototipo. El número corresponde al WhatsApp vinculado."
      />
      <div className="panel-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Fecha de registro</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {USUARIOS_ADMIN.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nombre}</TableCell>
                <TableCell>{u.numero}</TableCell>
                <TableCell>{fechaCorta(u.registro)}</TableCell>
                <TableCell>
                  <EstadoBadge valor={u.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
