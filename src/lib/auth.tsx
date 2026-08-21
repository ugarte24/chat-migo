import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { cargarPerfil, asegurarPerfil, type PerfilSesion } from "./repositorio";
import { supabase } from "./supabase";

interface Ctx {
  cargando: boolean;
  sesion: Session | null;
  perfil: PerfilSesion | null;
  iniciarSesion: (correo: string, clave: string) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
}

const AuthContext = createContext<Ctx | null>(null);

async function perfilDeUsuario(id: string, correo: string | undefined, nombreMeta?: string) {
  const existente = await cargarPerfil(id);
  if (existente) return existente;
  return asegurarPerfil(id, nombreMeta || correo?.split("@")[0] || "Usuario", correo ?? null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilSesion | null>(null);

  useEffect(() => {
    if (!supabase) {
      setCargando(false);
      return;
    }

    let cancelado = false;
    const cliente = supabase;

    void cliente.auth.getSession().then(async ({ data }) => {
      if (cancelado) return;
      setSesion(data.session);
      const user = data.session?.user;
      if (user) {
        setPerfil(
          await perfilDeUsuario(user.id, user.email, user.user_metadata["nombre"] as string | undefined),
        );
      }
      setCargando(false);
    });

    const { data } = cliente.auth.onAuthStateChange((_evento, siguiente) => {
      setSesion(siguiente);
      const user = siguiente?.user;
      if (user) {
        void perfilDeUsuario(user.id, user.email, user.user_metadata["nombre"] as string | undefined).then(
          setPerfil,
        );
      } else {
        setPerfil(null);
      }
    });

    return () => {
      cancelado = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const iniciarSesion = useCallback(async (correo: string, clave: string) => {
    if (!supabase) return "Supabase no está configurado.";
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (error) return error.message;
    const user = data.user;
    if (user) {
      setPerfil(
        await perfilDeUsuario(user.id, user.email, user.user_metadata["nombre"] as string | undefined),
      );
    }
    return null;
  }, []);

  const cerrarSesion = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setPerfil(null);
  }, []);

  const refrescarPerfil = useCallback(async () => {
    const id = sesion?.user.id;
    if (!id) return;
    setPerfil(await perfilDeUsuario(id, sesion.user.email));
  }, [sesion]);

  const valor = useMemo<Ctx>(
    () => ({
      cargando,
      sesion,
      perfil,
      iniciarSesion,
      cerrarSesion,
      refrescarPerfil,
    }),
    [cargando, sesion, perfil, iniciarSesion, cerrarSesion, refrescarPerfil],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function destinoTrasLogin(_rol: PerfilSesion["rol"] | undefined) {
  return "/panel";
}
