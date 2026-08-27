// Contratos de integración e implementaciones actuales.

import type { Interpretacion } from "./asistente";
import type { Automatizacion, Evento, MemoriaItem, Recordatorio, Tarea } from "./datos";

export interface WhatsAppBusinessClient {
  enviarMensaje(numero: string, texto: string): Promise<void>;
  recibirWebhook(payload: unknown): Promise<void>;
}

export interface MotorInterpretacion {
  interpretar(texto: string): Promise<Interpretacion>;
}

export interface TranscriptorVoz {
  transcribir(audio: Blob): Promise<string>;
}

/** Persistencia sobre Supabase (src/lib/repositorio.ts). */
export interface RepositorioActividades {
  listarTareas(usuarioId: string): Promise<Tarea[]>;
  listarRecordatorios(usuarioId: string): Promise<Recordatorio[]>;
  listarEventos(usuarioId: string): Promise<Evento[]>;
  listarMemoria(usuarioId: string): Promise<MemoriaItem[]>;
  listarAutomatizaciones(usuarioId: string): Promise<Automatizacion[]>;
}

export interface CalendarioExterno {
  sincronizarEvento(evento: Evento): Promise<void>;
}

export interface MotorAutomatizacion {
  programar(auto: Automatizacion): Promise<void>;
  cancelar(id: string): Promise<void>;
}

/** Implementaciones vivas en el código. */
export const SERVICIOS_FUTUROS = [
  "Dilo / Gemini o ChatGPT con herramientas (/api/dilo)",
  "Voz ElevenLabs (/api/hablar) · Voice ID copiado",
  "Whisper (/api/transcribir)",
  "Avisos FCM a la APK (/api/ejecutar)",
  "Supabase (auth + RLS)",
  "Vercel (SSR + cron /api/ejecutar)",
] as const;
