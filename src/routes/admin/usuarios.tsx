import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fechaCorta } from "@/lib/datos";
import {
  actualizarUsuarioPorAdmin,
  crearUsuarioPorAdmin,
  etiquetaRol,
  listarPerfiles,
  ROLES_PERFIL,
  type PerfilSesion,
  type RolPerfil,
} from "@/lib/repositorio";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios | Administración" }] }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const [perfiles, setPerfiles] = useState<PerfilSesion[]>([]);
  const [dialogo, setDialogo] = useState<"crear" | PerfilSesion | null>(null);

  async function cargar() {
    setPerfiles(await listarPerfiles());
  }

  useEffect(() => {
    void cargar();
  }, []);

  return (
    <div>
      <PageHeader
        titulo="Usuarios"
        descripcion="Usuario usa Dilo en el celular. Administrador gestiona esta web y la APK."
        accion={
          <Button onClick={() => setDialogo("crear")}>
            <Plus />
            Crear cuenta
          </Button>
        }
      />
      <div className="panel-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[1%] text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Aún no hay cuentas.
                </TableCell>
              </TableRow>
            ) : (
              perfiles.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell>{u.correo ?? u.numero ?? "—"}</TableCell>
                  <TableCell>{etiquetaRol(u.rol)}</TableCell>
                  <TableCell>{fechaCorta(u.registro)}</TableCell>
                  <TableCell>
                    <EstadoBadge valor="activo" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDialogo(u)}>
                      <Pencil />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <DialogoCuenta
        abierto={dialogo != null}
        perfil={dialogo === "crear" ? null : dialogo}
        onCerrar={() => setDialogo(null)}
        onGuardado={() => void cargar()}
      />
    </div>
  );
}

function DialogoCuenta({
  abierto,
  perfil,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  perfil: PerfilSesion | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const editando = perfil != null;
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState<RolPerfil>("usuario");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setNombre(perfil?.nombre ?? "");
    setCorreo(perfil?.correo ?? "");
    setClave("");
    setRol(perfil?.rol ?? "usuario");
  }, [abierto, perfil]);

  const ayudaRol = ROLES_PERFIL.find((r) => r.valor === rol)?.texto;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const fallo = editando
      ? await actualizarUsuarioPorAdmin(perfil.id, {
          nombre,
          correo,
          rol,
          clave: clave.trim() || undefined,
        })
      : await crearUsuarioPorAdmin(nombre, correo, clave, rol);
    setEnviando(false);
    if (fallo) {
      toast.error(fallo);
      return;
    }
    toast.success(editando ? "Cuenta actualizada." : "Cuenta creada. Ya puede iniciar sesión.");
    onCerrar();
    onGuardado();
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) window.setTimeout(onCerrar, 0);
      }}
    >
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuario" : "Crear cuenta"}</DialogTitle>
            <DialogDescription>
              {editando
                ? "Cambia nombre, correo, rol o la contraseña."
                : "El usuario entra en la app Android. El administrador entra en esta web."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="usuario-nombre">Nombre</Label>
            <Input
              id="usuario-nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usuario-correo">Correo</Label>
            <Input
              id="usuario-correo"
              type="email"
              autoComplete="off"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usuario-clave">
              {editando ? "Nueva contraseña (opcional)" : "Contraseña inicial"}
            </Label>
            <Input
              id="usuario-clave"
              type="password"
              autoComplete="new-password"
              minLength={editando ? undefined : 6}
              required={!editando}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usuario-rol">Rol</Label>
            <Select value={rol} onValueChange={(v) => setRol(v as RolPerfil)}>
              <SelectTrigger id="usuario-rol" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[70]">
                {ROLES_PERFIL.map((r) => (
                  <SelectItem key={r.valor} value={r.valor}>
                    {r.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ayudaRol ? <p className="text-xs text-muted-foreground">{ayudaRol}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear cuenta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
