import type { SupabaseClient } from "@supabase/supabase-js";
import { hoyISO } from "./datos";
import type { Database } from "./database.types";
import { interpretar, type Interpretacion } from "./asistente";
import { nuevoId } from "./repositorio";

type DB = SupabaseClient<Database>;

function horaCorta() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export async function persistirInterpretacion(
  db: DB,
  usuarioId: string,
  texto: string,
  r: Interpretacion = interpretar(texto),
): Promise<string> {
  const registrar = async (accion: string, estado: "exitoso" | "pendiente" | "error" = "exitoso") => {
    await db.from("historial").insert({
      id: nuevoId(),
      usuario_id: usuarioId,
      fecha: hoyISO(),
      hora: horaCorta(),
      solicitud: texto,
      accion,
      estado,
    });
  };

  const responder = async (mensaje: string) => {
    await db.from("conversaciones").insert({
      id: nuevoId(),
      usuario_id: usuarioId,
      autor: "asistente",
      mensaje,
      tipo: "texto",
    });
    return mensaje;
  };

  await db.from("conversaciones").insert({
    id: nuevoId(),
    usuario_id: usuarioId,
    autor: "usuario",
    mensaje: texto,
    tipo: "texto",
  });

  switch (r.intencion) {
    case "recordatorio": {
      if (!r.fecha || !r.hora) {
        await registrar("Se solicitó aclaración de fecha y hora", "pendiente");
        return responder(`Entendí “${r.actividad}”, pero me falta fecha u hora.`);
      }
      await db.from("recordatorios").insert({
        id: nuevoId(),
        usuario_id: usuarioId,
        actividad: r.actividad,
        fecha: r.fecha,
        hora: r.hora,
        estado: "pendiente",
        activo: true,
      });
      await registrar("Recordatorio creado");
      return responder(`Listo. Te recordaré el ${r.fecha} a las ${r.hora}: ${r.actividad}.`);
    }
    case "evento": {
      if (!r.fecha || !r.hora) {
        await registrar("Se solicitó aclaración de fecha y hora", "pendiente");
        return responder(`Entendí “${r.actividad}”, pero me falta fecha u hora.`);
      }
      await db.from("eventos").insert({
        id: nuevoId(),
        usuario_id: usuarioId,
        titulo: r.actividad,
        descripcion: "Creado desde Dilo.",
        persona: r.persona,
        lugar: "",
        fecha: r.fecha,
        hora: r.hora,
        estado: "pendiente",
      });
      await registrar("Evento agendado");
      return responder(`Evento agendado: ${r.actividad} el ${r.fecha} a las ${r.hora}.`);
    }
    case "automatizacion": {
      const frecuencia = r.frecuencia ?? "Todos los días";
      const hora = r.hora ?? "08:00";
      await db.from("automatizaciones").insert({
        id: nuevoId(),
        usuario_id: usuarioId,
        nombre: r.actividad,
        accion: r.actividad,
        cuando: frecuencia.replace(/^Todos los /i, ""),
        frecuencia,
        hora,
        activa: true,
      });
      await registrar("Automatización creada");
      return responder(`Automatización creada: ${frecuencia} a las ${hora} — ${r.actividad}.`);
    }
    case "memoria": {
      await db.from("memoria").insert({
        id: nuevoId(),
        usuario_id: usuarioId,
        informacion: r.actividad,
        categoria: r.persona ? "Personas" : "Preferencias",
        fecha: hoyISO(),
      });
      await registrar("Información guardada en memoria");
      return responder(`Guardado en tu memoria: “${r.actividad}”.`);
    }
    case "consulta": {
      await registrar("Consulta respondida");
      return responder("Consulta recibida. Revisa tu panel para ver tareas, recordatorios y eventos.");
    }
    case "desconocida": {
      await registrar("Conversación");
      return responder("Te escucho. Puedo anotarte algo, recordártelo o seguir la conversación. ¿Qué tienes entre manos?");
    }
    default: {
      await db.from("tareas").insert({
        id: nuevoId(),
        usuario_id: usuarioId,
        titulo: r.actividad,
        descripcion: "Creada desde Dilo.",
        fecha: r.fecha,
        prioridad: r.prioridad,
        estado: "pendiente",
        origen: "chat",
      });
      await registrar("Tarea creada");
      return responder(`Tarea creada: “${r.actividad}”.`);
    }
  }
}
