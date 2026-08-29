import { useCallback, useEffect, useState } from "react";
import {
  abrirDescargaNativa,
  codigoCascaraAndroid,
  esCascaraAndroid,
  versionCascaraAndroid,
} from "@/lib/nativo";
import { supabase } from "@/lib/supabase";

const OMITIDA_KEY = "dilo-apk-omitida";

interface VersionRemota {
  version: string | null;
  versionCode: number | null;
}

function hayNueva(
  localCode: number | null,
  remotoCode: number | null,
  localName: string | null,
  remotoName: string | null,
) {
  if (localCode != null && remotoCode != null) return remotoCode > localCode;
  if (!localName || !remotoName) return false;
  return compararNombre(remotoName, localName) > 0;
}

function compararNombre(a: string, b: string) {
  const pa = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da - db;
  }
  return 0;
}

export function useActualizacionApk() {
  const enAndroid = esCascaraAndroid();
  const local = versionCascaraAndroid();
  const localCode = codigoCascaraAndroid();
  const [remota, setRemota] = useState<VersionRemota | null>(null);
  const [omitida, setOmitida] = useState<string | null>(null);
  const [bajando, setBajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setPulsoNativo] = useState(0);

  useEffect(() => {
    if (!enAndroid) return;
    const sync = () => setPulsoNativo((n) => n + 1);
    window.addEventListener("dilo-nativo", sync);
    return () => window.removeEventListener("dilo-nativo", sync);
  }, [enAndroid]);

  useEffect(() => {
    if (!enAndroid) return;
    try {
      setOmitida(window.localStorage.getItem(OMITIDA_KEY));
    } catch {
      /* sin storage */
    }
    let cancelado = false;
    void fetch("/api/apk?publica=1")
      .then(async (res) => {
        const cuerpo = (await res.json().catch(() => ({}))) as {
          version?: string;
          versionCode?: number;
        };
        if (cancelado || !res.ok) return;
        setRemota({
          version: cuerpo.version ?? null,
          versionCode: typeof cuerpo.versionCode === "number" ? cuerpo.versionCode : null,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [enAndroid]);

  const disponible = Boolean(
    enAndroid &&
      remota &&
      hayNueva(localCode, remota.versionCode, local, remota.version) &&
      omitida !== (remota.version ?? ""),
  );

  const omitir = useCallback(() => {
    const marca = remota?.version ?? "";
    setOmitida(marca);
    try {
      window.localStorage.setItem(OMITIDA_KEY, marca);
    } catch {
      /* sin storage */
    }
  }, [remota?.version]);

  const descargar = useCallback(async () => {
    if (!supabase) {
      setError("No se pudo preparar la descarga.");
      return;
    }
    setBajando(true);
    setError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setBajando(false);
      setError("Inicia sesión para actualizar.");
      return;
    }
    const res = await fetch("/api/apk", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cuerpo = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    setBajando(false);
    if (!res.ok || !cuerpo.url) {
      setError(cuerpo.error || "No se pudo descargar la actualización.");
      return;
    }
    if (!abrirDescargaNativa(cuerpo.url)) {
      window.location.assign(cuerpo.url);
    }
  }, []);

  return {
    enAndroid,
    local,
    localCode,
    remota: remota?.version ?? null,
    remotaCode: remota?.versionCode ?? null,
    disponible,
    bajando,
    error,
    descargar,
    omitir,
  };
}
