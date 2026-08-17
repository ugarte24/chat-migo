import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { proximaEjecucion, type Automatizacion } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones | Dilo" }] }),
  component: AutomatizacionesPage,
});

const VACIA: Omit<Automatizacion, "id"> = {
  nombre: "",
  accion: "",
  cuando: "",
  frecuencia: "Todos los viernes",
  hora: "17:00",
  activa: true,
};

function AutomatizacionesPage() {
  const { automatizaciones, agregarAutomatizacion, actualizarAutomatizacion, eliminarAutomatizacion } =
    useAsistente();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Automatizacion | null>(null);
  const [form, setForm] = useState(VACIA);

  const abrir = (a?: Automatizacion) => {
    setEditando(a ?? null);
    setForm(
      a
        ? {
            nombre: a.nombre,
            accion: a.accion,
            cuando: a.cuando,
            frecuencia: a.frecuencia,
            hora: a.hora,
            activa: a.activa,
          }
        : VACIA,
    );
    setAbierto(true);
  };

  const guardar = () => {
    if (!form.nombre.trim() || !form.accion.trim()) {
      toast.error("Nombre y acción son obligatorios");
      return;
    }
    const payload = { ...form, cuando: form.cuando || form.frecuencia };
    if (editando) {
      actualizarAutomatizacion(editando.id, payload);
      toast.success("Automatización actualizada");
    } else {
      agregarAutomatizacion(payload);
      toast.success("Automatización creada");
    }
    setAbierto(false);
  };

  return (
    <div>
      <PageHeader
        titulo="Automatizaciones"
        descripcion="Acciones recurrentes que el sistema ejecutará sin que vuelvas a pedirlas."
        accion={
          <Button onClick={() => abrir()}>
            <Plus className="size-4" /> Crear automatización
          </Button>
        }
      />

      {automatizaciones.length === 0 && <Vacio texto="No hay automatizaciones." />}
      <div className="grid gap-4 md:grid-cols-2">
        {automatizaciones.map((a) => (
          <article key={a.id} className="panel-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{a.nombre}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{a.accion}</p>
              </div>
              <EstadoBadge valor={a.activa ? "activa" : "inactivo"} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-surface px-3 py-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Cuándo</dt>
                <dd>{a.cuando}</dd>
              </div>
              <div className="rounded-lg bg-surface px-3 py-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Frecuencia</dt>
                <dd>{a.frecuencia}</dd>
              </div>
              <div className="rounded-lg bg-surface px-3 py-2">
                <dt className="text-[10px] uppercase text-muted-foreground">Hora</dt>
                <dd>{a.hora}</dd>
              </div>
              <div className="rounded-lg bg-success/10 px-3 py-2">
                <dt className="text-[10px] uppercase text-success">Próxima ejecución</dt>
                <dd className="text-sm">{proximaEjecucion(a.frecuencia, a.hora)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={a.activa}
                  className="data-[state=checked]:bg-success"
                  onCheckedChange={(v) => {
                    actualizarAutomatizacion(a.id, { activa: v });
                    toast.success(v ? "Automatización activada" : "Automatización pausada");
                  }}
                />
                {a.activa ? "Activa" : "Pausada"}
              </label>
              <div>
                <Button size="icon" variant="ghost" onClick={() => abrir(a)} aria-label="Editar">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    eliminarAutomatizacion(a.id);
                    toast.success("Automatización eliminada");
                  }}
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar automatización" : "Crear automatización"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Campo label="Nombre">
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Campo>
            <Campo label="Cuándo">
              <Input
                value={form.cuando}
                onChange={(e) => setForm({ ...form, cuando: e.target.value })}
                placeholder="Viernes"
              />
            </Campo>
            <Campo label="Frecuencia">
              <Input
                value={form.frecuencia}
                onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
                placeholder="Todos los viernes"
              />
            </Campo>
            <Campo label="Hora">
              <Input
                type="time"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
              />
            </Campo>
            <Campo label="Acción">
              <Textarea
                value={form.accion}
                onChange={(e) => setForm({ ...form, accion: e.target.value })}
              />
            </Campo>
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
