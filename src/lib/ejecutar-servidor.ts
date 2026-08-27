import { hoyISO } from "./datos";
import { enviarFcm, fcmConfigurado } from "./fcm";
import { avisosPendientes } from "./motor";
import { supabaseServicio } from "./supabase-servidor";
import { enviarWhatsApp, whatsappConfigurado } from "./whatsapp";

function horaCorta(valor: string) {
  return valor.slice(0, 5);
}

export async function ejecutarAvisosSistema() {
  const db = supabaseServicio();
  if (!db) return { ok: false, motivo: "Falta SUPABASE_SERVICE_ROLE_KEY", ejecutados: 0 };

  const [recordatorios, automatizaciones, perfiles, dispositivosRes] = await Promise.all([
    db.from("recordatorios").select("*"),
    db.from("automatizaciones").select("*"),
    db.from("perfiles").select("id, numero, configuracion"),
    db.from("dispositivos").select("usuario_id, token"),
  ]);
  if (dispositivosRes.error) {
    console.error("[fcm] dispositivos", dispositivosRes.error.message);
  }
  const dispositivos = dispositivosRes.data ?? [];
  const servicio = db;

  async function avisarUsuario(usuarioId: string, texto: string) {
    const perfil = perfiles.data?.find((p) => p.id === usuarioId);
    if (whatsappConfigurado() && perfil?.numero) {
      try {
        await enviarWhatsApp(perfil.numero, texto);
      } catch (error) {
        console.error("[whatsapp] aviso", error);
      }
    }
    if (!fcmConfigurado()) return;
    const tokens = dispositivos.filter((d) => d.usuario_id === usuarioId).map((d) => d.token);
    for (const token of tokens) {
      try {
        const resultado = await enviarFcm(token, "Dilo", texto);
        if (resultado === "invalido") {
          await servicio.from("dispositivos").delete().eq("token", token);
        }
      } catch (error) {
        console.error("[fcm] aviso", error);
      }
    }
  }

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
      await avisarUsuario(fila.usuario_id, `🔔 ${aviso.texto}`);
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
      await avisarUsuario(fila.usuario_id, `⚙️ ${aviso.texto}`);
      ejecutados += 1;
    }
  }

  return { ok: true, ejecutados };
}
