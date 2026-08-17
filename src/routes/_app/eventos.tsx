import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Vacio } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fechaLegible } from "@/lib/asistente";
import { hoyISO, type Evento } from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/eventos")({
  head: () => ({ meta: [{ title: "Eventos | Dilo" }] }),
  component: EventosPage,
});

const VACIO: Omit<Evento, "id"> = {
  titulo: "",
  descripcion: "",
  persona: null,
  lugar: "",
  fecha: hoyISO(),
  hora: "09:00",
  estado: "pendiente",
};

function EventosPage() {
  const { eventos, agregarEvento, actualizarEvento, eliminarEvento } = useAsistente();
  const [dia, setDia] = useState<Date | undefined>(new Date());
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [form, setForm] = useState(VACIO);

  const diasConEventos = useMemo(
    () => eventos.map((e) => new Date(e.fecha + "T00:00:00")),
    [eventos],
  );

  const isoDia = dia
    ? `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`
    : hoyISO();
  const delDia = eventos.filter((e) => e.fecha === isoDia);

  const abrir = (e?: Evento) => {
    setEditando(e ?? null);
    setForm(
      e
        ? {
            titulo: e.titulo,
            descripcion: e.descripcion,
            persona: e.persona,
            lugar: e.lugar,
            fecha: e.fecha,
            hora: e.hora,
            estado: e.estado,
          }
        : VACIO,
    );
    setAbierto(true);
  };

  const guardar = () => {
    if (!form.titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (editando) {
      actualizarEvento(editando.id, form);
      toast.success("Evento actualizado");
    } else {
      agregarEvento(form);
      toast.success("Evento creado");
    }
    setAbierto(false);
  };

  const Tarjeta = ({ e }: { e: Evento }) => (
    <article className="panel-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{e.titulo}</p>
        <p className="text-sm text-muted-foreground">{e.descripcion}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {fechaLegible(e.fecha)} · {e.hora} · {e.lugar || "Sin lugar"}
          {e.persona ? ` · con ${e.persona}` : ""}
        </p>
      </div>
      <EstadoBadge valor={e.estado} />
      <Button size="icon" variant="ghost" onClick={() => abrir(e)} aria-label="Editar">
        <Pencil className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          eliminarEvento(e.id);
          toast.success("Evento eliminado");
        }}
        aria-label="Eliminar"
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </article>
  );

  return (
    <div>
      <PageHeader
        titulo="Eventos"
        descripcion="Reuniones y compromisos en lista o en el calendario mensual."
        accion={
          <Button onClick={() => abrir()}>
            <Plus className="size-4" /> Crear evento
          </Button>
        }
      />

      <Tabs defaultValue="lista">
        <TabsList className="mb-4">
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="calendario">Calendario mensual</TabsTrigger>
        </TabsList>
        <TabsContent value="lista" className="space-y-3">
          {eventos.length === 0 && <Vacio texto="No hay eventos agendados." />}
          {eventos.map((e) => (
            <Tarjeta key={e.id} e={e} />
          ))}
        </TabsContent>
        <TabsContent value="calendario">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <div className="panel-card w-fit p-2">
              <Calendar
                mode="single"
                selected={dia}
                onSelect={setDia}
                modifiers={{ evento: diasConEventos }}
                modifiersClassNames={{ evento: "bg-primary/15 font-semibold text-primary" }}
              />
            </div>
            <div>
              <h2 className="mb-3 font-semibold">{fechaLegible(isoDia)}</h2>
              {delDia.length === 0 && <Vacio texto="No hay eventos en este día." />}
              <div className="space-y-3">
                {delDia.map((e) => (
                  <Tarjeta key={e.id} e={e} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar evento" : "Crear evento"}</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fecha">
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </Campo>
              <Campo label="Hora">
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </Campo>
            </div>
            <Campo label="Lugar">
              <Input value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
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
