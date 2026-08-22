import { AudioLines, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { desbloquearAudio, hablar } from "@/lib/voz";
import { VOCES_DILO, vozPorId, type VozDilo } from "@/lib/voces";

const FRASE_MUESTRA = "Hola, soy Dilo. Así voy a hablarte a partir de ahora.";

const GRUPOS: { id: VozDilo["grupo"]; titulo: string }[] = [
  { id: "hombres", titulo: "Hombres" },
  { id: "mujeres", titulo: "Mujeres" },
  { id: "neutra", titulo: "Neutra" },
];

async function probarVoz(vozId: string) {
  await desbloquearAudio();
  await hablar(FRASE_MUESTRA, vozId);
}

export function SelectorVoz({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (vozId: string) => void;
}) {
  const actual = vozPorId(valor);

  return (
    <div className="space-y-2">
      <Label>Voz de Dilo</Label>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Select
            value={actual.id}
            onValueChange={(id) => {
              onChange(id);
            }}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Elige una voz" />
            </SelectTrigger>
          <SelectContent>
            {GRUPOS.map((g) => (
              <SelectGroup key={g.id}>
                <SelectLabel>{g.titulo}</SelectLabel>
                {VOCES_DILO.filter((v) => v.grupo === g.id).map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombre} — {v.detalle}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void probarVoz(actual.id)}
          aria-label="Escuchar esta voz"
        >
          <Play className="size-4" />
          Escuchar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Liam es la voz por defecto. Puedes cambiarla cuando quieras; se guarda en tu cuenta.
      </p>
    </div>
  );
}

export function SelectorVozBarra({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (vozId: string) => void;
}) {
  const actual = vozPorId(valor);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Voz de Dilo: ${actual.nombre}`}
          title={`Voz: ${actual.nombre}`}
          className="inline-flex size-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
        >
          <AudioLines className="size-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">Voz de Dilo</p>
        <div className="max-h-72 overflow-y-auto">
          {GRUPOS.map((g) => (
            <div key={g.id} className="mb-1">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {g.titulo}
              </p>
              {VOCES_DILO.filter((v) => v.grupo === g.id).map((v) => {
                const activa = v.id === actual.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onChange(v.id);
                      void probarVoz(v.id);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                      activa ? "bg-accent font-medium" : ""
                    }`}
                  >
                    <span>
                      {v.nombre}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">{v.detalle}</span>
                    </span>
                    {activa ? <span className="text-[11px] text-muted-foreground">actual</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
