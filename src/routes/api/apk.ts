import { createFileRoute } from "@tanstack/react-router";
import { exigirAdministrador, supabaseServicio } from "@/lib/supabase-servidor";

const CUBETA = "apk";
const MANIFESTO = "latest.json";
const LEGADO = "dilo.apk";

interface ManifestoApk {
  version: string;
  versionCode: number;
  archivo: string;
}

interface ArchivoStorage {
  name: string;
  updated_at?: string;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
}

function extraerVersion(nombre: string) {
  const marca = nombre.match(/^Dilo-(.+)\.apk$/i)?.[1];
  return marca ?? null;
}

function tamanoDe(item: ArchivoStorage) {
  const size = item.metadata?.["size"];
  return typeof size === "number" ? size : null;
}

async function leerManifesto(
  db: NonNullable<ReturnType<typeof supabaseServicio>>,
): Promise<ManifestoApk | null> {
  const { data, error } = await db.storage.from(CUBETA).download(MANIFESTO);
  if (error || !data) return null;
  try {
    const parsed = JSON.parse(await data.text()) as ManifestoApk;
    if (parsed.archivo && parsed.version) return parsed;
  } catch {
    return null;
  }
  return null;
}

export const Route = createFileRoute("/api/apk")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const adminId = await exigirAdministrador(request);
        if (!adminId) {
          return Response.json({ error: "Solo el administrador puede descargar la APK." }, { status: 403 });
        }
        const db = supabaseServicio();
        if (!db) {
          return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 });
        }

        const info = new URL(request.url).searchParams.has("info");
        const { data: lista, error: errorLista } = await db.storage.from(CUBETA).list("", { limit: 100 });
        if (errorLista) {
          return Response.json(
            { error: errorLista.message, disponible: false },
            { status: errorLista.message.includes("not found") ? 404 : 400 },
          );
        }
        const items = (lista ?? []) as ArchivoStorage[];
        const manifesto = await leerManifesto(db);

        let nombre = manifesto?.archivo;
        if (nombre && !items.some((item) => item.name === nombre)) nombre = undefined;
        if (!nombre) {
          const versionados = items
            .filter((item) => /^Dilo-.+\.apk$/i.test(item.name))
            .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
          nombre = versionados[0]?.name;
        }
        if (!nombre && items.some((item) => item.name === LEGADO)) nombre = LEGADO;

        const archivo = items.find((item) => item.name === nombre);
        if (!nombre || !archivo) {
          return Response.json(
            {
              disponible: false,
              error: "Aún no hay APK. En GitHub: Actions → APK → Run workflow.",
            },
            { status: 404 },
          );
        }

        const version =
          manifesto?.archivo === nombre ? manifesto.version : extraerVersion(nombre);
        const versionCode = manifesto?.archivo === nombre ? manifesto.versionCode : null;

        if (info) {
          return Response.json({
            disponible: true,
            version,
            versionCode,
            archivo: nombre,
            actualizado: archivo.updated_at ?? archivo.created_at,
            tamano: tamanoDe(archivo),
          });
        }

        const { data, error } = await db.storage.from(CUBETA).createSignedUrl(nombre, 120);
        if (error || !data?.signedUrl) {
          return Response.json({ error: error?.message || "No se pudo firmar la descarga." }, { status: 400 });
        }
        return Response.json({ url: data.signedUrl, archivo: nombre, version });
      },
    },
  },
});
