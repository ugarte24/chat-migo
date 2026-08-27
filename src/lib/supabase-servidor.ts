import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

function env(clave: string) {
  if (typeof process === "undefined" || process.env == null) return "";
  return process.env[clave]?.trim() ?? "";
}

export function urlSupabaseServidor() {
  return env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
}

export function supabaseServicio(): SupabaseClient<Database> | null {
  const url = urlSupabaseServidor();
  const clave = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url.startsWith("https://") || clave.length < 20) return null;
  return createClient<Database>(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function servicioRoleConfigurado() {
  return supabaseServicio() != null;
}

export function claveAnonServidor() {
  return env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
}

async function usuarioDesdeBearer(request: Request): Promise<string | null> {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const url = urlSupabaseServidor();
  const anon = claveAnonServidor();
  if (!url.startsWith("https://") || anon.length < 20) return null;
  const cliente = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await cliente.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/** Devuelve el id del usuario si el Bearer JWT es válido. */
export async function exigirUsuario(request: Request): Promise<string | null> {
  return usuarioDesdeBearer(request);
}

/** Devuelve el id del usuario si el Bearer JWT corresponde a un administrador. */
export async function exigirAdministrador(request: Request): Promise<string | null> {
  const id = await usuarioDesdeBearer(request);
  if (!id) return null;
  const db = supabaseServicio();
  if (!db) return null;
  const { data: perfil } = await db.from("perfiles").select("rol").eq("id", id).maybeSingle();
  if (perfil?.rol !== "administrador") return null;
  return id;
}
