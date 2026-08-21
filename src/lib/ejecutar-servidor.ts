import { hoyISO } from "./datos";
import { avisosPendientes } from "./motor";
import { supabaseServicio } from "./supabase-servidor";
import { enviarWhatsApp, whatsappConfigurado } from "./whatsapp";

function horaCorta(valor: string) {
  return valor.slice(0, 5);
}

export async function ejecutarAvisosSistema() {
  const db = supabaseServicio();
  if (!db) return { ok: false, motivo: "Falta SUPABASE_SERVICE_ROLE_KEY", ejecutados: 0 };

  const [recordatorios, automatizaciones, perfiles] = await Promise.all([
    db.from("recordatorios").select("*"),
    db.from("automatizaciones").select("*"),
    db.from("perfiles").select("id, numero, configuracion"),
  ]);

  const recs = (recordatorios.data ?? []).map((fila) => ({
    id: fila.id,
    usuario_id: fila.usuario_id,
    actividad: fila.actividad,
    fecha: fila.fecha,
    hora: horaCorta(fila.hora),
    estado: fila.estado as "pendiente" | "completado" | "cancelado",
    activo: fila.activo,
  }));
  const autos = (automatizaciones.data ?? []).map((fila) => ({
    id: fila.id,
    usuario_id: fila.usuario_id,
    nombre: fila.nombre,
    accion: fila.accion,
    cuando: fila.cuando,
    frecuencia: fila.frecuencia,
    hora: horaCorta(fila.hora),
    activa: fila.activa,
    ultimaEjecucion: fila.ultima_ejecucion,
  }));

  const avisos = avisosPendientes(
    recs.map(({ usuario_id: _u, ...r }) => r),
    autos.map(({ usuario_id: _u, ...a }) => a),
  );

  let ejecutados = 0;
  for (const aviso of avisos) {
    if (aviso.tipo === "recordatorio") {
      const fila = recs.find((r) => r.id === aviso.id);
      if (!fila) continue;
      await db
        .from("recordatorios")
        .update({ estado: "completado", activo: false })
        .eq("id", aviso.id);
      await db.from("historial").insert({
        usuario_id: fila.usuario_id,
        fecha: hoyISO(),
        hora: new Date().toISOString().slice(11, 16),
        solicitud: aviso.texto,
        accion: "Recordatorio ejecutado",
        estado: "exitoso",
      });
      await db.from("conversaciones").insert({
        usuario_id: fila.usuario_id,
        autor: "asistente",
        mensaje: `🔔 ${aviso.texto}`,
        tipo: "texto",
      });
      const perfil = perfiles.data?.find((p) => p.id === fila.usuario_id);
      if (whatsappConfigurado() && perfil?.numero) {
        try {
          await enviarWhatsApp(perfil.numero, `🔔 ${aviso.texto}`);
        } catch (error) {
          console.error("[whatsapp] aviso", error);
        }
      }
      ejecutados += 1;
    } else {
      const fila = autos.find((a) => a.id === aviso.id);
      if (!fila) continue;
      await db.from("automatizaciones").update({ ultima_ejecucion: hoyISO() }).eq("id", aviso.id);
      await db.from("historial").insert({
        usuario_id: fila.usuario_id,
        fecha: hoyISO(),
        hora: new Date().toISOString().slice(11, 16),
        solicitud: aviso.texto,
        accion: "Automatización ejecutada",
        estado: "exitoso",
      });
      await db.from("conversaciones").insert({
        usuario_id: fila.usuario_id,
        autor: "asistente",
        mensaje: `⚙️ ${aviso.texto}`,
        tipo: "texto",
      });
      const perfil = perfiles.data?.find((p) => p.id === fila.usuario_id);
      if (whatsappConfigurado() && perfil?.numero) {
        try {
          await enviarWhatsApp(perfil.numero, `⚙️ ${aviso.texto}`);
        } catch (error) {
          console.error("[whatsapp] auto", error);
        }
      }
      ejecutados += 1;
    }
  }

  return { ok: true, ejecutados };
}
