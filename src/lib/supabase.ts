import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

function credencialesListas(origen: string, clave: string): boolean {
  return (
    origen.startsWith("https://") &&
    !origen.includes("TU-PROYECTO") &&
    clave.length > 20 &&
    clave !== "tu-anon-key"
  );
}

export const supabaseConfigurado = credencialesListas(url, anonKey);

/** Cliente listo cuando existen las variables de entorno. Si no, se usan datos locales. */
export const supabase: SupabaseClient<Database> | null = supabaseConfigurado
  ? createClient<Database>(url, anonKey)
  : null;

export function obtenerSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local",
    );
  }
  return supabase;
}
