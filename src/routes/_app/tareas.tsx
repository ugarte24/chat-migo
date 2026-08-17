import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Vacio } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fechaLegible } from "@/lib/asistente";
import { hoyISO, type EstadoTarea, type PrioridadTarea, type Tarea } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/tareas")({
  head: () => ({ meta: [{ title: "Tareas | Dilo" }] }),
  component: TareasPage,
});

const VACIA: Omit<Tarea, "id"> = {
  titulo: "",
  descripcion: "",
  fecha: hoyISO(),
  prioridad: "media",
  estado: "pendiente",
  origen: "panel",
};

function TareasPage() {
  const { tareas, agregarTarea, actualizarTarea, eliminarTarea } = useAsistente();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("todas");
  const [prioridad, setPrioridad] = useState<string>("todas");
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Tarea | null>(null);
  const [form, setForm] = useState(VACIA);

  const filtradas = useMemo(
    () =>
      tareas.filter((t) => {
        const texto = `${t.titulo} ${t.descripcion}`.toLowerCase();
        if (q && !texto.includes(q.toLowerCase())) return false;
        if (estado !== "todas" && t.estado !== estado) return false;
        if (prioridad !== "todas" && t.prioridad !== prioridad) return false;
        return true;
      }),
    [tareas, q, estado, prioridad],
  );

  const abrirNueva = () => {
    setEditando(null);
    setForm(VACIA);
    setAbierto(true);
  };

  const abrirEditar = (t: Tarea) => {
    setEditando(t);
    setForm({
      titulo: t.titulo,
      descripcion: t.descripcion,
      fecha: t.fecha,
      prioridad: t.prioridad,
      estado: t.estado,
      origen: t.origen,
    });
    setAbierto(true);
  };

  const guardar = () => {
    if (!form.titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (editando) {
      actualizarTarea(editando.id, form);
      toast.success("Tarea actualizada");
    } else {
      agregarTarea(form);
      toast.success("Tarea creada");
    }
    setAbierto(false);
  };

  return (
    <div>
      <PageHeader
        titulo="Tareas"
        descripcion="Crea, edita, completa y elimina las tareas registradas por el chat o desde el panel."
        accion={
          <Button onClick={abrirNueva}>
            <Plus className="size-4" /> Crear tarea
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tareas…"
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en progreso">En progreso</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={prioridad} onValueChange={setPrioridad}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las prioridades</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtradas.length === 0 && <Vacio texto="No hay tareas con esos filtros." />}
      <div className="space-y-3">
        {filtradas.map((t) => (
          <article key={t.id} className="panel-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className={`font-medium ${t.estado === "completada" ? "line-through opacity-60" : ""}`}>
                {t.titulo}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t.descripcion}</p>
              <p className="mt-2 text-xs text-muted-foreground">Fecha: {fechaLegible(t.fecha)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EstadoBadge valor={t.prioridad} />
              <EstadoBadge valor={t.estado} />
              {t.estado !== "completada" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    actualizarTarea(t.id, { estado: t.estado === "pendiente" ? "en progreso" : "completada" });
                    toast.success(t.estado === "pendiente" ? "Tarea en progreso" : "Tarea completada");
                  }}
                >
                  {t.estado === "pendiente" ? "Iniciar" : "Completar"}
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => abrirEditar(t)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  eliminarTarea(t.id);
                  toast.success("Tarea eliminada");
                }}
                aria-label="Eliminar"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar tarea" : "Crear tarea"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Campo label="Título">
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </Campo>
            <Campo label="Descripción">
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </Campo>
            <Campo label="Fecha">
              <Input
                type="date"
                value={form.fecha ?? ""}
                onChange={(e) => setForm({ ...form, fecha: e.target.value || null })}
              />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Prioridad">
                <Select
                  value={form.prioridad}
                  onValueChange={(v) => setForm({ ...form, prioridad: v as PrioridadTarea })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </Campo>
              <Campo label="Estado">
                <Select
                  value={form.estado}
                  onValueChange={(v) => setForm({ ...form, estado: v as EstadoTarea })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en progreso">En progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </Campo>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
