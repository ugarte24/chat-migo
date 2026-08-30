import { PageHeader, Vacio } from "@/components/panel/PageHeader";
import { EstadoBadge } from "@/components/panel/EstadoBadge";

export function ListaAgenda({
  titulo,
  descripcion,
  vacio,
  items,
}: {
  titulo: string;
  descripcion: string;
  vacio: string;
  items: { id: string; titulo: string; detalle: string; estado: string }[];
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader titulo={titulo} descripcion={descripcion} />
      {items.length === 0 ? (
        <Vacio texto={vacio} />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgb(15_23_42/0.06)] ring-1 ring-[#E2E8F0]/80"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-[#111827]">{item.titulo}</p>
                {item.detalle ? (
                  <p className="mt-0.5 text-[13px] text-[#64748B]">{item.detalle}</p>
                ) : null}
              </div>
              <EstadoBadge valor={item.estado} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
