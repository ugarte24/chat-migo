import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}

export function StatCard({
  etiqueta,
  valor,
  detalle,
  tono = "primary",
}: {
  etiqueta: string;
  valor: number | string;
  detalle?: string;
  tono?: "primary" | "ai" | "success" | "warning";
}) {
  const color = {
    primary: "text-primary",
    ai: "text-ai",
    success: "text-success",
    warning: "text-warning",
  }[tono];

  return (
    <div className="panel-card animate-rise p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <p className={cn("mt-2 text-3xl font-semibold", color)}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
    </div>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
      {texto}
    </p>
  );
}
