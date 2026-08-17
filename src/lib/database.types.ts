export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      automatizaciones: {
        Row: {
          accion: string;
          activa: boolean;
          created_at: string;
          cuando: string;
          frecuencia: string;
          hora: string;
          id: string;
          nombre: string;
          usuario_id: string;
        };
        Insert: {
          accion: string;
          activa?: boolean;
          created_at?: string;
          cuando: string;
          frecuencia: string;
          hora: string;
          id?: string;
          nombre: string;
          usuario_id: string;
        };
        Update: {
          accion?: string;
          activa?: boolean;
          created_at?: string;
          cuando?: string;
          frecuencia?: string;
          hora?: string;
          id?: string;
          nombre?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      conversaciones: {
        Row: {
          autor: string;
          created_at: string;
          id: string;
          mensaje: string;
          tipo: string;
          usuario_id: string;
        };
        Insert: {
          autor: string;
          created_at?: string;
          id?: string;
          mensaje: string;
          tipo?: string;
          usuario_id: string;
        };
        Update: {
          autor?: string;
          created_at?: string;
          id?: string;
          mensaje?: string;
          tipo?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      eventos: {
        Row: {
          created_at: string;
          descripcion: string;
          estado: string;
          fecha: string;
          hora: string;
          id: string;
          lugar: string;
          persona: string | null;
          titulo: string;
          usuario_id: string;
        };
        Insert: {
          created_at?: string;
          descripcion?: string;
          estado?: string;
          fecha: string;
          hora: string;
          id?: string;
          lugar?: string;
          persona?: string | null;
          titulo: string;
          usuario_id: string;
        };
        Update: {
          created_at?: string;
          descripcion?: string;
          estado?: string;
          fecha?: string;
          hora?: string;
          id?: string;
          lugar?: string;
          persona?: string | null;
          titulo?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      historial: {
        Row: {
          accion: string;
          created_at: string;
          estado: string;
          fecha: string;
          hora: string;
          id: string;
          solicitud: string;
          usuario_id: string;
        };
        Insert: {
          accion: string;
          created_at?: string;
          estado?: string;
          fecha?: string;
          hora?: string;
          id?: string;
          solicitud: string;
          usuario_id: string;
        };
        Update: {
          accion?: string;
          created_at?: string;
          estado?: string;
          fecha?: string;
          hora?: string;
          id?: string;
          solicitud?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      memoria: {
        Row: {
          categoria: string;
          created_at: string;
          fecha: string;
          id: string;
          informacion: string;
          usuario_id: string;
        };
        Insert: {
          categoria: string;
          created_at?: string;
          fecha?: string;
          id?: string;
          informacion: string;
          usuario_id: string;
        };
        Update: {
          categoria?: string;
          created_at?: string;
          fecha?: string;
          id?: string;
          informacion?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      perfiles: {
        Row: {
          configuracion: Json;
          created_at: string;
          id: string;
          nombre: string;
          numero: string | null;
        };
        Insert: {
          configuracion?: Json;
          created_at?: string;
          id?: string;
          nombre: string;
          numero?: string | null;
        };
        Update: {
          configuracion?: Json;
          created_at?: string;
          id?: string;
          nombre?: string;
          numero?: string | null;
        };
        Relationships: [];
      };
      recordatorios: {
        Row: {
          actividad: string;
          activo: boolean;
          created_at: string;
          estado: string;
          fecha: string;
          hora: string;
          id: string;
          usuario_id: string;
        };
        Insert: {
          actividad: string;
          activo?: boolean;
          created_at?: string;
          estado?: string;
          fecha: string;
          hora: string;
          id?: string;
          usuario_id: string;
        };
        Update: {
          actividad?: string;
          activo?: boolean;
          created_at?: string;
          estado?: string;
          fecha?: string;
          hora?: string;
          id?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      tareas: {
        Row: {
          created_at: string;
          descripcion: string;
          estado: string;
          fecha: string | null;
          id: string;
          origen: string;
          prioridad: string;
          titulo: string;
          usuario_id: string;
        };
        Insert: {
          created_at?: string;
          descripcion?: string;
          estado?: string;
          fecha?: string | null;
          id?: string;
          origen?: string;
          prioridad?: string;
          titulo: string;
          usuario_id: string;
        };
        Update: {
          created_at?: string;
          descripcion?: string;
          estado?: string;
          fecha?: string | null;
          id?: string;
          origen?: string;
          prioridad?: string;
          titulo?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
