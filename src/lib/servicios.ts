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
  "WhatsApp Business Platform (/api/whatsapp)",
  "API de inteligencia artificial (/api/interpretar)",
  "Servicio de reconocimiento de voz (navegador + /api/transcribir)",
  "Supabase (auth + RLS)",
  "Vercel (SSR + cron /api/ejecutar)",
  "Google Calendar",
  "Sistema de automatización (panel + cron)",
] as const;
