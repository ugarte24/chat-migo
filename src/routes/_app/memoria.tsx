import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Vacio } from "@/components/panel/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIAS_MEMORIA,
  fechaCorta,
  type CategoriaMemoria,
  type MemoriaItem,
} from "@/lib/datos";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/memoria")({
  head: () => ({ meta: [{ title: "Memoria | Dilo" }] }),
  component: MemoriaPage,
});

function MemoriaPage() {
  const { memoria, agregarMemoria, actualizarMemoria, eliminarMemoria } = useAsistente();
  const [abierto, setAbierto] = useState(false);
  const [consultando, setConsultando] = useState<MemoriaItem | null>(null);
  const [editando, setEditando] = useState<MemoriaItem | null>(null);
  const [informacion, setInformacion] = useState("");
  const [categoria, setCategoria] = useState<CategoriaMemoria>("Preferencias");

  const abrirNueva = () => {
    setEditando(null);
    setInformacion("");
    setCategoria("Preferencias");
    setAbierto(true);
  };

  const abrirEditar = (m: MemoriaItem) => {
    setEditando(m);
    setInformacion(m.informacion);
    setCategoria(m.categoria);
    setAbierto(true);
  };

  const guardar = () => {
    if (!informacion.trim()) {
      toast.error("Escribe la información a recordar");
      return;
    }
    if (editando) {
      actualizarMemoria(editando.id, { informacion, categoria });
      toast.success("Memoria actualizada");
    } else {
      agregarMemoria({ informacion, categoria, fecha: new Date().toISOString().slice(0, 10) });
      toast.success("Memoria agregada");
    }
    setAbierto(false);
  };

  return (
    <div>
      <PageHeader
        titulo="Memoria"
        descripcion="Lo que el sistema recuerda de ti — solo con tu autorización — para personalizar recordatorios y automatizaciones."
        accion={
          <Button onClick={abrirNueva}>
            <Plus className="size-4" /> Agregar memoria
          </Button>
        }
      />

      <Alert className="mb-6 border-ai/20 bg-ai-soft">
        <ShieldCheck className="size-4 text-ai" />
        <AlertTitle>Privacidad</AlertTitle>
        <AlertDescription>
          La información almacenada en la memoria solo se utiliza con autorización del usuario. El
          administrador no puede consultarla sin tu permiso explícito.
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        {CATEGORIAS_MEMORIA.map((cat) => {
          const items = memoria.filter((m) => m.categoria === cat);
          return (
            <section key={cat}>
              <h2 className="mb-3 font-display text-lg font-semibold">{cat}</h2>
              {items.length === 0 && <Vacio texto={`Aún no hay recuerdos en “${cat}”.`} />}
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((m) => (
                  <article key={m.id} className="panel-card p-4">
                    <p className="text-sm">{m.informacion}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Guardado el {fechaCorta(m.fecha)}</p>
                    <div className="mt-3 flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setConsultando(m)}>
                        Consultar
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => abrirEditar(m)} aria-label="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          eliminarMemoria(m.id);
                          toast.success("Memoria eliminada");
                        }}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar memoria" : "Agregar memoria"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaMemoria)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_MEMORIA.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Información</Label>
              <Textarea value={informacion} onChange={(e) => setInformacion(e.target.value)} rows={4} />
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

      <Dialog open={!!consultando} onOpenChange={() => setConsultando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{consultando?.categoria}</DialogTitle>
          </DialogHeader>
          <p className="text-sm">{consultando?.informacion}</p>
          <p className="text-xs text-muted-foreground">
            Registrado el {consultando ? fechaCorta(consultando.fecha) : ""}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
