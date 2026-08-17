import { useState } from "react";

const INICIAL = [
  { id: "1", titulo: "Carlos", detalle: "Contacto frecuente" },
  { id: "2", titulo: "Reunión semanal", detalle: "Lunes · 09:00" },
  { id: "3", titulo: "Preferencia", detalle: "Revisar tareas por la mañana" },
];

export function MemoryPreview() {
  const [items, setItems] = useState(INICIAL);
  const [editando, setEditando] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Memoria autorizada
      </p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border px-4 py-3">
            {editando === item.id ? (
              <input
                autoFocus
                defaultValue={item.detalle}
                className="w-full bg-transparent text-sm outline-none"
                onBlur={(e) => {
                  const valor = e.target.value.trim();
                  setItems((prev) =>
                    prev.map((x) => (x.id === item.id ? { ...x, detalle: valor || x.detalle } : x)),
                  );
                  setEditando(null);
                }}
                aria-label={`Editar ${item.titulo}`}
              />
            ) : (
              <>
                <p className="text-sm font-semibold">{item.titulo}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.detalle}</p>
              </>
            )}
            <div className="mt-3 flex gap-4">
              <button
                type="button"
                className="text-xs font-medium text-primary"
                onClick={() => setEditando(item.id)}
              >
                Editar
              </button>
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground hover:text-destructive"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-muted-foreground">Tú decides qué información conservar.</p>
    </div>
  );
}
