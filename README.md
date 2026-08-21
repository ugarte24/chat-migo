# Dilo

PRD — PRODUCT REQUIREMENTS DOCUMENT

Asistente inteligente en WhatsApp para la automatización de actividades diarias


Producto: Sistema inteligente de gestión y automatización de actividades mediante WhatsApp
Versión: 1.0
Fecha: Agosto 2026

1. DESCRIPCIÓN DEL PROYECTO

El proyecto consiste en desarrollar un sistema inteligente integrado con WhatsApp, que permita a los usuarios gestionar y automatizar diferentes actividades diarias mediante mensajes de texto o notas de voz.

El sistema utilizará inteligencia artificial para comprender instrucciones expresadas en lenguaje natural y convertirlas en acciones concretas, como crear tareas, programar recordatorios, registrar eventos, consultar actividades y ejecutar automatizaciones.

La propuesta busca que el usuario pueda comunicarse con el sistema de una manera sencilla, utilizando expresiones cotidianas sin necesidad de utilizar comandos específicos.

Por ejemplo:

“Recuérdame mañana a las ocho enviar el informe.”

El sistema deberá interpretar la solicitud, identificar la actividad, fecha y hora, registrar el recordatorio y posteriormente enviar una notificación al usuario.

2. PROBLEMA

Actualmente, las personas gestionan sus actividades mediante diferentes herramientas digitales, como calendarios, aplicaciones de tareas, notas y recordatorios.

Esta situación puede generar una organización fragmentada, debido a que cada herramienta requiere que el usuario ingrese manualmente la información.

Además, cuando una persona se encuentra ocupada, escribir manualmente una tarea o recordatorio puede resultar poco práctico.

Por esta razón, se plantea una solución que permita expresar directamente lo que se necesita mediante WhatsApp, utilizando inteligencia artificial para interpretar la solicitud y automatizar la acción correspondiente.

3. OBJETIVO DEL PRODUCTO

Desarrollar un sistema inteligente integrado con WhatsApp que permita a los usuarios gestionar y automatizar actividades diarias mediante mensajes de texto y notas de voz, utilizando inteligencia artificial para interpretar instrucciones y ejecutar acciones relacionadas con tareas, recordatorios, eventos y otras actividades.

4. USUARIOS OBJETIVO

El sistema estará dirigido a diferentes tipos de usuarios:

 Estudiantes.

 Profesionales.

 Docentes.

 Emprendedores.

 Comerciantes.

 Trabajadores independientes.

 Personas que necesitan organizar sus actividades personales.

 Usuarios que buscan automatizar tareas repetitivas.

El proyecto no estará limitado a una empresa, institución o ciudad específica.

5. PROPUESTA DE VALOR

La principal propuesta de valor consiste en permitir que una persona pueda delegar determinadas actividades al sistema utilizando una conversación natural mediante WhatsApp.

El sistema se diferenciará por la combinación de:

🧠 Memoria

Conservar información y preferencias autorizadas por el usuario para utilizarla en futuras interacciones.

⚙️ Acción

Interpretar una solicitud y ejecutar una acción concreta.

🔄 Automatización

Programar acciones para que sean ejecutadas posteriormente sin que el usuario tenga que volver a solicitarlo.

Por ejemplo:

“Todos los lunes a las 8 de la mañana recuérdame revisar mis tareas.”

El sistema deberá interpretar que se trata de una acción recurrente y programar el recordatorio.

6. FUNCIONALIDADES PRINCIPALES

6.1. Comunicación mediante WhatsApp

El usuario podrá comunicarse con el sistema mediante:

 Mensajes de texto.

 Notas de voz.

El sistema deberá responder utilizando WhatsApp.

6.2. Inteligencia artificial

La IA será responsable de:

 Comprender lenguaje natural.

 Identificar la intención del usuario.

 Extraer fechas.

 Extraer horarios.

 Identificar actividades.

 Identificar personas.

 Determinar acciones.

 Solicitar información faltante.

 Generar respuestas naturales.

Ejemplo:

“El viernes a las 3 tengo reunión con Juan.”

La IA deberá identificar:

Acción: Registrar evento

Fecha: Viernes

Hora: 15:00

Actividad: Reunión

Persona: Juan

7. GESTIÓN DE TAREAS

El usuario podrá:

 Crear tareas.

 Consultar tareas.

 Modificar tareas.

 Completar tareas.

 Eliminar tareas.

 Establecer fechas.

 Establecer prioridades.

Ejemplo:

“Agrega a mis tareas comprar materiales mañana.”

8. GESTIÓN DE RECORDATORIOS

El sistema permitirá crear recordatorios mediante lenguaje natural.

Ejemplo:

“Recuérdame mañana a las 10 llamar a Pedro.”

El sistema deberá:

 Identificar la acción.

 Identificar la fecha.

 Identificar la hora.

 Identificar la actividad.

 Registrar el recordatorio.

 Confirmar al usuario.

 Enviar la notificación en el momento establecido.

9. GESTIÓN DE EVENTOS

El sistema podrá registrar eventos como:

 Reuniones.

 Citas.

 Compromisos.

 Actividades académicas.

 Actividades laborales.

Ejemplo:

“Agenda una reunión con Carlos el viernes a las 3 de la tarde.”

10. MEMORIA DEL SISTEMA

La memoria permitirá conservar información autorizada por el usuario.

Ejemplos:

 Preferencias.

 Personas frecuentes.

 Horarios habituales.

 Actividades recurrentes.

 Información necesaria para futuras acciones.

Ejemplo:

“Mi reunión semanal con Carlos es todos los lunes a las 9.”

Posteriormente el sistema podrá utilizar esta información para facilitar nuevas solicitudes.

Control de memoria

El usuario deberá poder:

 Consultar información almacenada.

 Modificar información.

 Eliminar información.

 Solicitar que una información no sea recordada.

11. AUTOMATIZACIONES

El sistema permitirá programar determinadas acciones.

Ejemplos:

“Recuérdame todos los lunes revisar mis tareas.”

“Todos los viernes a las 6 recuérdame hacer el reporte.”

Las automatizaciones deberán almacenar:

 Acción.

 Fecha.

 Hora.

 Frecuencia.

 Condición, cuando corresponda.

 Estado.

12. PROCESAMIENTO DE VOZ

El usuario podrá enviar una nota de voz.

El flujo será:

Nota de voz

     ↓

Recepción

     ↓

Conversión de voz a texto

     ↓

Inteligencia artificial

     ↓

Interpretación

     ↓

Acción

     ↓

Respuesta

Ejemplo:

🎤 “Mañana a las ocho recuérdame llevar los documentos.”

El sistema deberá convertir la voz a texto y procesar la instrucción de la misma manera que un mensaje escrito.

13. ARQUITECTURA GENERAL

                 USUARIO

                    │

                    ▼

                WHATSAPP

                    │

                    ▼

          RECEPCIÓN DEL MENSAJE

                    │

              ┌─────┴─────┐

              ▼           ▼

           TEXTO         VOZ

              │           │

              │      VOZ → TEXTO

              │           │

              └─────┬─────┘

                    ▼

          INTELIGENCIA ARTIFICIAL

                    │

                    ▼

          INTERPRETACIÓN DE INTENCIÓN

                    │

                    ▼

             MEMORIA DEL USUARIO

                    │

                    ▼

          MOTOR DE AUTOMATIZACIÓN

                    │

          ┌─────────┼─────────┐

          ▼         ▼         ▼

        Tareas  Recordatorios Eventos

          │         │         │

          └─────────┼─────────┘

                    ▼

               BASE DE DATOS

                    │

                    ▼

            EJECUCIÓN / AVISO

                    │

                    ▼

                WHATSAPP

                    │

                    ▼

                 USUARIO

14. BASE DE DATOS

La base de datos deberá almacenar la información necesaria para el funcionamiento del sistema.

Tablas principales

Usuarios

 id

 nombre

 número de WhatsApp

 configuración

 fecha de registro

Tareas

 id

 usuario_id

 título

 descripción

 fecha

 prioridad

 estado

Recordatorios

 id

 usuario_id

 actividad

 fecha

 hora

 estado

Eventos

 id

 usuario_id

 título

 descripción

 fecha

 hora

 estado

Memoria

 id

 usuario_id

 información

 categoría

 fecha

Automatizaciones

 id

 usuario_id

 acción

 frecuencia

 fecha

 hora

 estado

Conversaciones

 id

 usuario_id

 mensaje

 respuesta

 fecha

15. REQUERIMIENTOS FUNCIONALES

CódigoRequerimientoRF01Registrar usuariosRF02Recibir mensajes de WhatsAppRF03Recibir notas de vozRF04Convertir voz a textoRF05Interpretar lenguaje naturalRF06Crear tareasRF07Consultar tareasRF08Modificar tareasRF09Eliminar tareasRF10Crear recordatoriosRF11Crear eventosRF12Consultar actividadesRF13Modificar actividadesRF14Eliminar actividadesRF15Guardar memoria autorizadaRF16Consultar memoriaRF17Crear automatizacionesRF18Ejecutar automatizacionesRF19Enviar notificacionesRF20Confirmar acciones realizadasRF21Solicitar información faltanteRF22Gestionar errores

16. REQUERIMIENTOS NO FUNCIONALES

Usabilidad

El sistema deberá permitir una interacción sencilla mediante lenguaje natural.

Seguridad

La información de los usuarios deberá almacenarse de forma segura.

Privacidad

La información personal y memoria del usuario deberá utilizarse únicamente con autorización.

Disponibilidad

El sistema deberá estar disponible para recibir y procesar solicitudes.

Rendimiento

Las solicitudes deberán procesarse en un tiempo razonable.

Escalabilidad

La arquitectura deberá permitir agregar nuevas funcionalidades.

Confiabilidad

Las tareas y recordatorios deberán registrarse y ejecutarse correctamente.

17. FLUJO PRINCIPAL

Caso: crear un recordatorio

Usuario:

“Recuérdame mañana a las 8 llevar los documentos.”

Sistema:

1. Recepción

WhatsApp recibe el mensaje.

2. Procesamiento

El sistema procesa el contenido.

3. Inteligencia artificial

Identifica la intención.

4. Extracción de información

Acción: Recordatorio

Fecha: Mañana

Hora: 08:00

Actividad: Llevar los documentos

5. Validación

El sistema verifica que tenga los datos necesarios.

6. Registro

Guarda el recordatorio en la base de datos.

7. Confirmación

“Listo. Te recordaré mañana a las 08:00 llevar los documentos.”

8. Automatización

Cuando llegue la fecha y hora establecida:

“🔔 Recordatorio: llevar los documentos.”

18. FUNCIONALIDADES INICIALES DEL SISTEMA

Para mantener el proyecto viable y demostrable, la primera versión deberá concentrarse en:

 Comunicación mediante WhatsApp.

 Procesamiento de mensajes de texto.

 Procesamiento de notas de voz.

 Inteligencia artificial.

 Creación de tareas.

 Creación de recordatorios.

 Creación de eventos.

 Consulta de actividades.

 Memoria básica.

 Automatización de recordatorios.

 Notificaciones.

 Base de datos.

Estas funcionalidades son suficientes para demostrar la principal innovación del proyecto: recibir una instrucción en lenguaje natural y convertirla en una acción automatizada.

19. PRUEBAS DEL SISTEMA

Se deberán realizar pruebas para verificar:

PruebaResultado esperadoMensaje de textoInterpretación correctaNota de vozConversión correcta a textoCrear tareaTarea almacenadaCrear recordatorioRecordatorio programadoCrear eventoEvento registradoConsultar actividadesInformación correctaModificar actividadInformación actualizadaEliminar actividadActividad eliminadaMemoriaInformación guardada correctamenteAutomatizaciónAcción ejecutada en el momento establecidoNotificaciónUsuario recibe el avisoInformación incompletaSistema solicita aclaración

20. INDICADORES DE ÉXITO

El proyecto podrá considerarse funcional cuando:

 El usuario pueda enviar una instrucción mediante WhatsApp.

 El sistema pueda comprender correctamente la intención.

 La IA pueda identificar los datos principales de la solicitud.

 Las actividades puedan almacenarse correctamente.

 Los recordatorios puedan ejecutarse en el momento programado.

 El usuario pueda recibir una respuesta de confirmación.

 Las notas de voz puedan ser procesadas.

 La memoria pueda almacenar información autorizada.

 Las automatizaciones funcionen correctamente.

21. DIFERENCIACIÓN DEL PROYECTO

La propuesta no busca competir únicamente como otra herramienta de inteligencia artificial. Su principal enfoque es convertir instrucciones cotidianas en acciones automatizadas.

La diferencia fundamental se basa en tres conceptos:

MEMORIA

El sistema puede conservar información autorizada para utilizarla posteriormente.

ACCIÓN

El sistema puede ejecutar acciones en lugar de limitarse a proporcionar información.

AUTOMATIZACIÓN

El sistema puede realizar acciones programadas posteriormente sin que el usuario tenga que repetir la solicitud.

Por ejemplo:

“Todos los viernes a las 5 de la tarde recuérdame enviar el reporte.”

No se trata solamente de responder al usuario, sino de registrar la instrucción, programarla y ejecutar posteriormente la acción.

22. ALCANCE DEL PROYECTO

El proyecto se enfocará en la gestión y automatización de actividades cotidianas mediante WhatsApp.

Las funciones principales estarán relacionadas con:

 Tareas.

 Recordatorios.

 Eventos.

 Memoria.

 Automatizaciones.

 Texto.

 Voz.

 Notificaciones.

El sistema tendrá una estructura que permita incorporar posteriormente nuevas funciones sin modificar completamente su arquitectura.

23. TECNOLOGÍAS PROPUESTAS

La solución podrá utilizar diferentes tecnologías y servicios para cumplir con los requerimientos:

TecnologíaFunciónWhatsApp Business PlatformComunicación con el usuarioInteligencia artificialInterpretación de instruccionesProcesamiento de vozConversión de voz a textoBase de datosAlmacenamiento de informaciónBackendProcesamiento y lógica del sistemaAPIComunicación entre serviciosServicio de automatizaciónEjecución de acciones programadasAplicación webAdministración y configuración del sistema

24. RESULTADO ESPERADO

El resultado esperado es obtener un sistema inteligente funcional integrado con WhatsApp, capaz de recibir instrucciones mediante texto o voz, comprender las solicitudes utilizando inteligencia artificial, almacenar información, ejecutar acciones y generar recordatorios automáticamente.

La innovación principal estará en permitir que el usuario pueda comunicarse de manera natural y delegar determinadas actividades al sistema, reduciendo procesos manuales y facilitando la organización de sus actividades diarias.

Relación con tu documento

Este PRD nos sirve ahora como base para desarrollar el punto 4.2 del proyecto:

4.2. DESARROLLO DEL SISTEMA

4.2.1. Análisis de requerimientos → sale del apartado 15 y 16 del PRD.

4.2.2. Diseño del sistema → sale de la arquitectura, base de datos y motor de automatización.

4.2.3. Desarrollo e integración de funcionalidades → sale de las funcionalidades del PRD.

4.2.4. Pruebas y validación → sale del apartado de pruebas e indicadores.

Así evitamos que el documento académico y el sistema que vas a desarrollar se contradigan o terminen teniendo funcionalidades diferentes.

QUE ROLES HABRA

Para tu proyecto “Asistente inteligente en WhatsApp para la automatización de actividades diarias”, te recomiendo no crear demasiados roles. Como es un sistema orientado principalmente al usuario individual, 3 roles serían suficientes.

Roles del sistema

1. USUARIO

Es la persona que utiliza el sistema mediante WhatsApp para gestionar y automatizar sus actividades.

Puede:

 Enviar mensajes de texto.

 Enviar notas de voz.

 Crear tareas.

 Crear recordatorios.

 Crear eventos.

 Consultar sus actividades.

 Modificar o eliminar actividades.

 Crear automatizaciones.

 Consultar su información almacenada en la memoria.

 Solicitar que se recuerde determinada información.

 Eliminar información de su memoria.

 Recibir notificaciones y recordatorios.

2. ADMINISTRADOR

Es el encargado de administrar el funcionamiento general de la plataforma.

Puede:

 Gestionar usuarios.

 Consultar el estado del sistema.

 Administrar configuraciones generales.

 Supervisar las automatizaciones.

 Gestionar servicios integrados.

 Consultar registros del sistema.

 Gestionar errores o incidencias.

 Administrar permisos y configuraciones de seguridad.

El administrador no debería tener acceso libre a la memoria personal de los usuarios, salvo que exista una función específica y autorización correspondiente.

3. SISTEMA / IA

Aunque técnicamente no es una persona, recomiendo considerarlo como un actor del sistema dentro de los diagramas y documentación.

Es el encargado de realizar automáticamente las operaciones necesarias.

Funciones:

 Recibir mensajes.

 Procesar texto.

 Convertir voz a texto.

 Interpretar instrucciones.

 Identificar intención, fecha y hora.

 Consultar la memoria autorizada.

 Crear y modificar actividades.

 Ejecutar automatizaciones.

 Generar recordatorios.

 Enviar respuestas.

 Solicitar información cuando una instrucción sea incompleta.

Esquema

                    SISTEMA

                       │

          ┌────────────┴────────────┐

          │                         │

      USUARIO                  ADMINISTRADOR

          │                         │

          │                         │

       WhatsApp              Panel administrativo

          │                         │

          └──────────┬──────────────┘

                     ▼

              ┌──────────────┐

              │  SISTEMA /   │

              │      IA      │

              └──────┬───────┘

                     │

        ┌────────────┼────────────┐

        ▼            ▼            ▼

     MEMORIA      ACCIONES    AUTOMATIZACIÓN

        │            │            │

        └────────────┼────────────┘

                     ▼

                BASE DE DATOS

Para tu proyecto académico

Yo pondría solamente estos tres actores:

RolFunción principalUsuarioGestiona sus actividades mediante WhatsAppAdministradorAdministra y supervisa la plataformaSistema/IAInterpreta solicitudes y ejecuta acciones automáticamente

Esto además nos permitirá después crear el diagrama de casos de uso del sistema de una manera bastante
QUE EL NOMBRE DEL PROYECTO SEA EN ESPAÑOL

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9cbbf952-4f67-45b2-b476-b0064bf92cec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Copia `.env.example` a `.env.local` y completa las variables.

Aplica las migraciones de `supabase/migrations` en el proyecto de Supabase. El archivo `20260820213000_auth_rls_motor.sql` activa login, RLS por usuario y la columna de última ejecución.

El registro público está cerrado. Crea el primer usuario en Supabase → Authentication → Users → Add user (correo confirmado); el perfil se crea solo. Luego:

```sql
update public.perfiles set rol = 'administrador' where correo = 'tu@correo';
```

El resto de cuentas se crean desde **Administración → Usuarios**.

## Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en [vercel.com/new](https://vercel.com/new).
2. El framework debe detectarse como **TanStack Start**. Node 20.
3. En **Environment Variables** agrega, para Production, Preview y Development:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, para `/api/ejecutar` y WhatsApp)
   - Opcional: `OPENAI_API_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
4. Despliega. Luego en Supabase → Authentication → URL Configuration usa esa URL de producción (y `https://*.vercel.app/**` para previews).
5. Webhook de WhatsApp: `https://tu-dominio.vercel.app/api/whatsapp`
6. El cron de Vercel llama a `/api/ejecutar` cada hora. En el panel, los avisos también se disparan cada 20 segundos mientras la pestaña está abierta.

No subas la *service role* de Supabase como variable `VITE_*`.
