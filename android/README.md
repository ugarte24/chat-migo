## Cáscara Android de Dilo

La APK **no lleva la interfaz**. Es un WebView que abre la web de Vercel (`/panel`): orbe, micrófono y avisos FCM. El administrador y la landing viven en el navegador. Cada `git push` a `main` actualiza lo que se ve en el celular, sin reinstalar.

Solo hace falta un APK nuevo si cambias algo nativo: icono, permisos, FCM o la URL embebida.

### Versiones

El número vive en `android/version.properties` (`VERSION_NAME` y `VERSION_CODE`). GitHub Actions lo **sube solo** en cada APK publicado (1.0.1 → 1.0.2, código 2 → 3) y deja el archivo `Dilo-1.0.2.apk` más `latest.json`.

No hace falta editar la versión a mano. En el celular aparece junto a “Dilo” y, si hay una más nueva, un aviso para instalarla encima.

### Generar el APK (sin Android Studio)

GitHub Actions compila en la nube.

1. En el repo: **Settings → Secrets and variables → Actions**. Añade:
   - `SUPABASE_URL` (la misma que en Vercel)
   - `SUPABASE_SERVICE_ROLE_KEY` (la misma que en Vercel)
2. Aplica en Supabase la migración `supabase/migrations/20260826220000_apk_storage.sql` (o deja que el workflow cree la cubeta `apk`).
3. **Actions → APK → Run workflow**, o un push a `main` que toque `android/`.
4. En Dilo, entra como administrador → **Aplicación Android** y descarga el APK versionado.
5. Pásala al celular e instálala (apps desconocidas). La siguiente vez, instala **encima**, sin borrar la app.

Si faltan los secretos, el workflow igual deja el APK como artefacto en Actions (solo visible en GitHub).

### URL de producción

En `android/app/src/main/res/values/strings.xml`, `dilo_url` debe ser tu dominio de Vercel (hoy `https://chat-migo.vercel.app`). La app abre `/panel`.

### Micrófono y avisos

La cáscara pide `RECORD_AUDIO` al abrir. El orbe usa `getUserMedia` de la web.

FCM (teléfono cerrado): Firebase + `google-services.json` en `android/app/` (no en git) + `FCM_SERVICE_ACCOUNT_JSON` en Vercel + migración `dispositivos_fcm.sql`. Sin eso la web carga igual; no hay push nativo.

### Android Studio (opcional)

Si quieres compilar en el PC: abre la carpeta `android/` en Android Studio → **Build APK**. El archivo queda en `android/app/build/outputs/apk/debug/app-debug.apk`. La versión será la de `version.properties` (la de la última publicación).
