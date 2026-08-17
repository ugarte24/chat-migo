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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fechaLegible } from "@/lib/asistente";
import { hoyISO, type Recordatorio } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/recordatorios")({
  head: () => ({ meta: [{ title: "Recordatorios | Dilo" }] }),
  component: RecordatoriosPage,
});

const VACIO: Omit<Recordatorio, "id"> = {
  actividad: "",
  fecha: hoyISO(),
  hora: "08:00",
  estado: "pendiente",
  activo: true,
};

function RecordatoriosPage() {
  const { recordatorios, agregarRecordatorio, actualizarRecordatorio, eliminarRecordatorio } =
    useAsistente();
  const hoy = hoyISO();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Recordatorio | null>(null);
  const [form, setForm] = useState(VACIO);

  const abrir = (r?: Recordatorio) => {
    setEditando(r ?? null);
    setForm(
      r
        ? { actividad: r.actividad, fecha: r.fecha, hora: r.hora, estado: r.estado, activo: r.activo }
        : VACIO,
    );
    setAbierto(true);
  };

  const guardar = () => {
    if (!form.actividad.trim()) {
      toast.error("La actividad es obligatoria");
      return;
    }
    if (editando) {
      actualizarRecordatorio(editando.id, form);
      toast.success("Recordatorio actualizado");
    } else {
      agregarRecordatorio(form);
      toast.success("Recordatorio creado");
    }
    setAbierto(false);
  };

  const Grupo = ({ items }: { items: Recordatorio[] }) =>
    items.length === 0 ? (
      <Vacio texto="No hay recordatorios en esta sección." />
    ) : (
      <div className="space-y-3">
        {items.map((r) => (
          <article key={r.id} className="panel-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{r.actividad}</p>
              <p className="text-sm text-muted-foreground">
                {fechaLegible(r.fecha)} · {r.hora}
              </p>
            </div>
            <EstadoBadge valor={r.estado} />
            <div className="flex items-center gap-2">
              <Switch
                checked={r.activo}
                onCheckedChange={(v) => {
                  actualizarRecordatorio(r.id, { activo: v });
                  toast.success(v ? "Recordatorio activado" : "Recordatorio desactivado");
                }}
                aria-label="Activar o desactivar"
              />
              <Button size="icon" variant="ghost" onClick={() => abrir(r)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  eliminarRecordatorio(r.id);
                  toast.success("Recordatorio eliminado");
                }}
                aria-label="Eliminar"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    );

  return (
    <div>
      <PageHeader
        titulo="Recordatorios"
        descripcion="Avisos programados para hoy, próximos y ya completados."
        accion={
          <Button onClick={() => abrir()}>
            <Plus className="size-4" /> Crear recordatorio
          </Button>
        }
      />

      <Tabs defaultValue="hoy">
        <TabsList className="mb-4">
          <TabsTrigger value="hoy">De hoy</TabsTrigger>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="completados">Completados</TabsTrigger>
        </TabsList>
        <TabsContent value="hoy">
          <Grupo items={recordatorios.filter((r) => r.fecha === hoy && r.estado !== "completado")} />
        </TabsContent>
        <TabsContent value="proximos">
          <Grupo items={recordatorios.filter((r) => r.fecha > hoy && r.estado !== "completado")} />
        </TabsContent>
        <TabsContent value="completados">
          <Grupo items={recordatorios.filter((r) => r.estado === "completado")} />
        </TabsContent>
      </Tabs>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar recordatorio" : "Crear recordatorio"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Actividad</Label>
              <Input
                value={form.actividad}
                onChange={(e) => setForm({ ...form, actividad: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </div>
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
