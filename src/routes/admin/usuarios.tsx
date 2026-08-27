import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fechaCorta } from "@/lib/datos";
import { crearUsuarioPorAdmin, listarPerfiles, type PerfilSesion } from "@/lib/repositorio";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios | Administración" }] }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const [perfiles, setPerfiles] = useState<PerfilSesion[]>([]);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    setPerfiles(await listarPerfiles());
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const fallo = await crearUsuarioPorAdmin(nombre, correo, clave);
    setEnviando(false);
    if (fallo) {
      toast.error(fallo);
      return;
    }
    toast.success("Cuenta creada. La persona ya puede iniciar sesión.");
    setNombre("");
    setCorreo("");
    setClave("");
    await cargar();
  }

  return (
    <div>
      <PageHeader
        titulo="Usuarios"
        descripcion="Solo el administrador puede crear cuentas. Esa persona inicia sesión en la APK, no en esta web."
      />
      <form onSubmit={(e) => void onSubmit(e)} className="panel-card mb-6 grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="font-display text-base font-semibold">Crear cuenta</h2>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="correo">Correo</Label>
          <Input
            id="correo"
            type="email"
            autoComplete="off"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="clave">Contraseña inicial</Label>
          <Input
            id="clave"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Creando…" : "Crear cuenta"}
          </Button>
        </div>
      </form>
      <div className="panel-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perfiles.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nombre}</TableCell>
                <TableCell>{u.correo ?? u.numero ?? "—"}</TableCell>
                <TableCell className="capitalize">{u.rol}</TableCell>
                <TableCell>{fechaCorta(u.registro)}</TableCell>
                <TableCell>
                  <EstadoBadge valor="activo" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
