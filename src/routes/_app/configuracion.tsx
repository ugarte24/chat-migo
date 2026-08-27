import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/panel/PageHeader";
import { SelectorVoz } from "@/components/SelectorVoz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { esCascaraAndroid, versionCascaraAndroid } from "@/lib/nativo";
import { actualizarDatosPerfil } from "@/lib/repositorio";
import { useAsistente } from "@/lib/store";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración | Dilo" }] }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { usuario, usuarioId, memoria, configuracion, actualizarConfiguracion, limpiarMemoria } =
    useAsistente();
  const { perfil, cerrarSesion, refrescarPerfil } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState(perfil?.nombre ?? usuario);
  const [numero, setNumero] = useState(perfil?.numero ?? "");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Configuración"
        descripcion="Controla tu perfil, notificaciones, privacidad y el uso de la memoria."
      />

      <Seccion titulo="Perfil">
        <Campo label="Nombre">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Campo>
        <Campo label="Correo">
          <Input value={perfil?.correo ?? ""} readOnly />
        </Campo>
        <Campo label="Teléfono (opcional)">
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="+591 700 12345"
          />
        </Campo>
        <Button
          variant="outline"
          onClick={() => {
            void actualizarDatosPerfil(usuarioId, {
              nombre: nombre.trim() || usuario,
              numero: numero.trim() || null,
            }).then(() => {
              void refrescarPerfil();
              toast.success("Perfil actualizado");
            });
          }}
        >
          Guardar perfil
        </Button>
        <p className="text-xs text-muted-foreground">
          Los avisos llegan al celular con la app de Dilo. El teléfono es solo un dato de contacto.
        </p>
      </Seccion>

      <Seccion titulo="Notificaciones">
        <FilaSwitch
          titulo="Notificaciones"
          texto="Recibir avisos de recordatorios y automatizaciones en el celular."
          checked={configuracion.notificaciones}
          onChange={(v) => actualizarConfiguracion({ notificaciones: v })}
        />
        <FilaSwitch
          titulo="Avisos de recordatorios"
          texto="Cuando llega la hora de un recordatorio."
          checked={configuracion.avisosRecordatorios}
          onChange={(v) => actualizarConfiguracion({ avisosRecordatorios: v })}
        />
        <FilaSwitch
          titulo="Avisos de automatizaciones"
          texto="Cuando se ejecuta una acción programada."
          checked={configuracion.avisosAutomatizaciones}
          onChange={(v) => actualizarConfiguracion({ avisosAutomatizaciones: v })}
        />
      </Seccion>

      <Seccion titulo="Privacidad">
        <p className="text-sm text-muted-foreground">
          El administrador no accede a tu memoria personal sin autorización explícita. Los registros
          de actividad del sistema no incluyen el contenido privado de tus recuerdos.
        </p>
      </Seccion>

      <Seccion titulo="Memoria">
        <FilaSwitch
          titulo="Memoria activa"
          texto="Permitir que el asistente recuerde información que tú autorices."
          checked={configuracion.memoriaActiva}
          onChange={(v) => actualizarConfiguracion({ memoriaActiva: v })}
        />
        <p className="text-sm text-muted-foreground">{memoria.length} recuerdos almacenados.</p>
        <Button
          variant="outline"
          onClick={() => {
            limpiarMemoria();
            toast.success("Se eliminó toda la información de la memoria");
          }}
        >
          Eliminar información de la memoria
        </Button>
      </Seccion>

      <Seccion titulo="Preferencias">
        <FilaSwitch
          titulo="Dilo habla"
          texto="El asistente lee en voz alta las confirmaciones y avisos."
          checked={configuracion.preferenciaVoz}
          onChange={(v) => actualizarConfiguracion({ preferenciaVoz: v })}
        />
        <SelectorVoz
          valor={configuracion.vozId}
          onChange={(vozId) => actualizarConfiguracion({ vozId })}
        />
      </Seccion>

      <Seccion titulo="Cuenta">
        <Button
          variant="destructive"
          onClick={() => {
            void cerrarSesion().then(() => {
              toast.success("Sesión cerrada");
              void navigate({ to: "/" });
            });
          }}
        >
          Cerrar sesión
        </Button>
        {esCascaraAndroid() ? (
          <p className="text-xs text-muted-foreground">
            Aplicación Dilo {versionCascaraAndroid() ?? ""}
          </p>
        ) : null}
      </Seccion>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="panel-card mb-4 space-y-4 p-5">
      <h2 className="font-semibold">{titulo}</h2>
      {children}
    </section>
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

function FilaSwitch({
  titulo,
  texto,
  checked,
  onChange,
}: {
  titulo: string;
  texto: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-xs text-muted-foreground">{texto}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
