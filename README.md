# Dilo

PRD — PRODUCT REQUIREMENTS DOCUMENT

Asistente de voz para la automatización de actividades diarias

Producto: sistema inteligente de gestión y automatización de actividades mediante voz y conversación en el celular  
Versión: 2.0  
Fecha: agosto 2026

El canal de uso es la **aplicación Android (orbe)**. WhatsApp **no forma parte del producto**.

---

## 1. Descripción del proyecto

Dilo es un asistente que entiende instrucciones en español y las convierte en acciones: tareas, recordatorios, eventos, memoria y automatizaciones.

El usuario habla con el **orbe** en el teléfono. Dilo responde en voz y por escrito **al vuelo** (el texto aparece y la voz arranca frase a frase, sin esperar a terminar de generar). La conversación larga está en el **icono de chat**.

Ejemplo:

> Recuérdame mañana a las ocho enviar el informe.

El sistema interpreta la solicitud, guarda el recordatorio y, a la hora, avisa en el celular (notificación FCM), aunque la app esté cerrada.

No hace falta un comando rígido: se habla como en una conversación cotidiana.

## 2. Problema

Las personas reparte su día entre calendarios, notas y apps de tareas. Cada una pide cargar los datos a mano. Con las manos ocupadas, escribir un recordatorio no es práctico.

Dilo permite **decirlo** y que el sistema lo deje registrado, lo recuerde y avise.

## 3. Objetivo del producto

Un asistente en el teléfono que, con voz (o texto en el chat), interprete instrucciones, ejecute la agenda del usuario, conserve memoria autorizada y envíe avisos a la hora programada.

## 4. Usuarios objetivo

Estudiantes, profesionales, docentes, emprendedores, comerciantes, trabajadores independientes y cualquiera que organice actividades personales o repetitivas. No está limitado a una empresa, institución o ciudad.

Roles:

- **Usuario:** usa Dilo en la APK (orbe y chat).
- **Administrador:** gestiona la plataforma en la web (`/admin`).
- **Sistema / IA:** interpreta, actúa y avisa (actor en diagramas, no una persona).

## 5. Propuesta de valor

La diferencia no es “otra IA que conversa”, sino **delegar el día** con tres piezas:

- **Memoria.** Conserva información y preferencias autorizadas y las usa después.
- **Acción.** De una frase sale una tarea, un recordatorio o un evento.
- **Automatización.** “Todos los lunes a las 8…” queda programado y se ejecuta solo.

La voz y el texto salen **en el acto**, como en un asistente hablado.

Ejemplo:

> Todos los lunes a las 8 de la mañana recuérdame revisar mis tareas.

## 6. Cómo se usa

| Superficie | Función |
| --- | --- |
| **APK (`/panel`)** | Orbe. Tocás, hablás, Dilo responde. Estados: *Toca para hablar*, *Te escucho*, *Un momento*, *Toca para interrumpir*. Sin párrafo largo debajo del orbe. |
| **Chat (`/chat`)** | Conversación escrita, streaming, historial. |
| **Web pública** | Landing, inicio de sesión. En producción el orbe **no** se abre en el navegador: el usuario instala la app. |
| **Admin** | Usuarios, APK, integraciones, actividad, configuración. |

La APK es una cáscara (WebView) de `https://chat-migo.vercel.app/panel`. Un push a `main` actualiza lo que se ve en el celular **sin reinstalar**, salvo cambios nativos (micrófono, FCM, URL embebida).

## 7. Funcionalidades principales

### 7.1. Comunicación

- Voz en el orbe (micrófono del teléfono).
- Texto en el chat.
- Respuesta hablada (ElevenLabs; si no hay clave, voz del sistema) y escrita en streaming.

### 7.2. Inteligencia artificial

Comprende lenguaje natural, identifica intención, fechas, horas, actividades y personas, determina acciones, pide lo que falta y genera respuestas naturales.

Ejemplo: *“El viernes a las 3 tengo reunión con Juan.”*  
Acción: registrar evento. Fecha: viernes. Hora: 15:00. Actividad: reunión. Persona: Juan.

### 7.3. Tareas

Crear, consultar, modificar, completar, eliminar; fechas y prioridades.

> Agrega a mis tareas comprar materiales mañana.

### 7.4. Recordatorios

Lenguaje natural → registro → confirmación → aviso a la hora (FCM).

> Recuérdame mañana a las 10 llamar a Pedro.

### 7.5. Eventos

Reuniones, citas, compromisos, actividades académicas o laborales.

> Agenda una reunión con Carlos el viernes a las 3 de la tarde.

### 7.6. Memoria

Preferencias, personas frecuentes, horarios, actividades recurrentes. El usuario consulta, modifica, borra o pide que algo no se recuerde.

> Mi reunión semanal con Carlos es todos los lunes a las 9.

### 7.7. Automatizaciones

Acción, frecuencia, hora, estado.

> Todos los viernes a las 6 recuérdame hacer el reporte.

## 8. Procesamiento de voz

```
Usuario toca el orbe
        ↓
Grabación / reconocimiento
        ↓
Texto (navegador o Whisper)
        ↓
IA (stream)
        ↓
Texto en el chat + voz por frases
        ↓
Acciones en la agenda
        ↓
Aviso FCM cuando toque
```

Ejemplo: *“Mañana a las ocho recuérdame llevar los documentos.”*

## 9. Arquitectura general

```
                 USUARIO
                    │
                    ▼
           APK Android (orbe)
           WebView → /panel
                    │
              ┌─────┴─────┐
              ▼           ▼
           VOZ         CHAT
              │           │
         voz → texto      │
              └─────┬─────┘
                    ▼
          /api/dilo (SSE)
                    │
          Gemini → OpenAI → local
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       Memoria   Acciones  Automatización
          │         │         │
          └─────────┼─────────┘
                    ▼
               Supabase
                    │
                    ▼
          /api/ejecutar + FCM
                    │
                    ▼
              Teléfono (aviso)
```

**Stack**

| Pieza | Función |
| --- | --- |
| TanStack Start (Vercel) | UI y APIs |
| APK (WebView) | Orbe, mic, parlante, FCM |
| Supabase | Cuentas, RLS, agenda, chat |
| Gemini / OpenAI | Interpretar y conversar |
| ElevenLabs / Whisper | Hablar y transcribir |
| FCM | Avisos con el teléfono cerrado |
| GitHub Actions | Compilar y versionar la APK |

WhatsApp no es canal de uso. Puede quedar código legado; no entra en alcance ni en la experiencia.

## 10. Base de datos (modelo)

**Usuarios / perfiles:** id, nombre, correo, rol (`usuario` \| `administrador`), configuración, fecha de registro.

**Tareas, recordatorios, eventos, memoria, automatizaciones, mensajes de chat, historial, dispositivos FCM:** siempre ligados a `usuario_id`, con RLS.

## 11. Requerimientos funcionales

| Código | Requerimiento |
| --- | --- |
| RF01 | Registrar e iniciar sesión (cuentas creadas por el administrador) |
| RF02 | Usar Dilo en la APK (orbe) |
| RF03 | Conversar por texto en el chat |
| RF04 | Recibir voz y convertirla a texto |
| RF05 | Interpretar lenguaje natural (stream) |
| RF06–RF09 | Crear, consultar, modificar, eliminar tareas |
| RF10 | Crear recordatorios |
| RF11 | Crear eventos |
| RF12–RF14 | Consultar, modificar, eliminar actividades |
| RF15–RF16 | Guardar y consultar memoria autorizada |
| RF17–RF18 | Crear y ejecutar automatizaciones |
| RF19 | Enviar avisos al celular (FCM) |
| RF20 | Confirmar acciones |
| RF21 | Pedir información faltante |
| RF22 | Hablar la respuesta al vuelo (frases en cola) |
| RF23 | Publicar APK desde administración |

## 12. Requerimientos no funcionales

- **Usabilidad:** lenguaje natural; orbe limpio; chat para lo largo.
- **Seguridad:** secretos solo en servidor; RLS por usuario; la service role nunca va como `VITE_*`.
- **Privacidad:** la memoria solo con autorización del usuario. El admin no lee memoria personal.
- **Disponibilidad:** web en Vercel; APK abre esa URL.
- **Rendimiento:** texto y voz en el acto, no al final del turno.
- **Escalabilidad:** APIs y datos separados; se pueden sumar funciones sin rehacer el núcleo.
- **Confiabilidad:** agenda persistida; avisos vía cron `/api/ejecutar` y FCM.

## 13. Flujo principal — crear un recordatorio

Usuario: *“Recuérdame mañana a las 8 llevar los documentos.”*

1. El orbe capta la voz y la pasa a texto.
2. `/api/dilo` streamea la respuesta.
3. La IA identifica recordatorio, fecha, hora y actividad.
4. Se guarda en Supabase.
5. Dilo confirma en texto y en voz.
6. A la hora, `/api/ejecutar` envía el aviso FCM: recordatorio de llevar los documentos.

## 14. Alcance de esta versión

Incluye: orbe y chat, voz, IA, tareas, recordatorios, eventos, memoria, automatizaciones, avisos FCM, panel admin, APK.

Fuera de alcance: WhatsApp como canal, Google Calendar y cualquier mensajería distinta de la app.

## 15. Pruebas e indicadores de éxito

| Prueba | Resultado esperado |
| --- | --- |
| Voz en el orbe | Transcripción e interpretación |
| Texto en el chat | Burbuja en streaming |
| Voz de Dilo | Primera frase suena antes de terminar de generar |
| Crear tarea / recordatorio / evento | Guardado y confirmado |
| Consultar / modificar / eliminar | Agenda coherente |
| Memoria | Se guarda y se usa después |
| Automatización | Se dispara a la hora |
| Aviso | Llega al celular con la app cerrada |
| Dato incompleto | Dilo pide aclaración |
| Web en producción | Usuario sin APK ve “usá la app”, no el orbe |

Éxito: el usuario habla, Dilo entiende, guarda, confirma al vuelo y avisa cuando toca.

## 16. Roles

**Usuario.** Habla con el orbe, lee el chat, gestiona su agenda y su memoria, recibe avisos.

**Administrador.** Usuarios, APK, integraciones, actividad. Sin acceso libre a la memoria personal.

**Sistema / IA.** Interpreta, actúa, habla, programa avisos.

```
                    SISTEMA
                       │
          ┌────────────┴────────────┐
          │                         │
      USUARIO                  ADMINISTRADOR
          │                         │
       APK (orbe)            Panel web /admin
          │                         │
          └──────────┬──────────────┘
                     ▼
                SISTEMA / IA
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     MEMORIA      ACCIONES    AUTOMATIZACIÓN
                     │
                BASE DE DATOS
```

## 17. Relación con el documento académico

Este PRD cubre el punto **4.2 Desarrollo del sistema**:

- **4.2.1 Análisis de requerimientos** → apartados 11 y 12.
- **4.2.2 Diseño** → arquitectura, datos y roles.
- **4.2.3 Desarrollo e integración** → funcionalidades y stack.
- **4.2.4 Pruebas y validación** → apartado 15.

Nombre del proyecto (español): **Dilo — asistente de voz para la automatización de actividades diarias.**

---

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9cbbf952-4f67-45b2-b476-b0064bf92cec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js y npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating). Node 24.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Copia `.env.example` a `.env.local` y completa las variables.

Aplica las migraciones de `supabase/migrations` en el proyecto de Supabase.

El registro público está cerrado. Crea el primer usuario en Supabase → Authentication → Users → Add user (correo confirmado); el perfil se crea solo. Luego:

```sql
update public.perfiles set rol = 'administrador' where correo = 'tu@correo';
```

El resto de cuentas se crean desde **Administración → Usuarios**.

En `vite dev` el orbe también se abre en el navegador para poder trabajar. En producción solo se ve dentro de la APK.

Detalle de la cáscara Android: `android/README.md`.

## Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en [vercel.com/new](https://vercel.com/new).
2. El framework debe detectarse como **TanStack Start**. Node 24.
3. En **Environment Variables** agrega, para Production, Preview y Development:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor: cron `/api/ejecutar`, FCM, crear cuentas)
   - `GEMINI_API_KEY` y/o `OPENAI_API_KEY`
   - Opcional: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `FCM_SERVICE_ACCOUNT_JSON`
4. Despliega. En Supabase → Authentication → URL Configuration usa esa URL de producción (y `https://*.vercel.app/**` para previews).
5. El cron de Vercel llama a `/api/ejecutar` (avisos FCM). La URL de la APK debe ser el dominio de Vercel (`/panel`).

No subas la *service role* de Supabase ni las claves de IA como variables `VITE_*`.
