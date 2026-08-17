import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAPA: Record<string, string> = {
  pendiente: "bg-warning/15 text-warning border-warning/20",
  "en progreso": "bg-primary/10 text-primary border-primary/20",
  completada: "bg-success/15 text-success border-success/20",
  completado: "bg-success/15 text-success border-success/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
  activa: "bg-success/15 text-success border-success/20",
  activo: "bg-success/15 text-success border-success/20",
  inactivo: "bg-muted text-muted-foreground border-border",
  suspendido: "bg-destructive/10 text-destructive border-destructive/20",
  exitoso: "bg-success/15 text-success border-success/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  alta: "bg-destructive/10 text-destructive border-destructive/20",
  media: "bg-warning/15 text-warning border-warning/20",
  baja: "bg-muted text-muted-foreground border-border",
};

export function EstadoBadge({ valor }: { valor: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", MAPA[valor.toLowerCase()] ?? "text-muted-foreground")}
    >
      {valor}
    </Badge>
  );
}
