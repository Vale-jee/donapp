# Plan de Implementación - Chat

## Dependencias

La implementación dependerá de:

- `002-autenticacion-core` para autenticar e identificar al usuario mediante el access token.
- `003-gestion-usuarios` para comprobar cuentas activas y seleccionar perfiles públicos.
- `004-manejo-errores` para normalizar respuestas y traducir errores técnicos.
- `006-donaciones` para conocer propietario, solicitud aceptada y estado de la donación.
- `007-solicitudes` para verificar la solicitud `ACEPTADA` y obtener al solicitante seleccionado.


## Arquitectura

La feature utilizará Next.js con Pages Router y separará:

- Rutas REST para método HTTP, autenticación, validación de entrada y respuesta.
- Esquemas Zod para identificadores, paginación y contenido de mensajes.
- Servicios para autorización, reglas de negocio, concurrencia y transacciones.
- Prisma para consultas, relaciones y persistencia en PostgreSQL.

Las rutas no concentrarán reglas de negocio ni devolverán directamente objetos completos de Prisma.


## Organización Probable de Archivos

La implementación podrá requerir:

- `src/pages/api/solicitudes/[id]/chat.ts`.
- `src/pages/api/chats/index.ts`.
- `src/pages/api/chats/[id]/index.ts`.
- `src/pages/api/chats/[id]/mensajes.ts`.
- Módulos compartidos de validación para Chat y Mensaje.
- Servicios de Chat y mensajería.
- Utilidades de selección de campos públicos y paginación.
- `prisma/schema.prisma`.
- Una migración Prisma revisada.
- Pruebas o colecciones de Postman/Insomnia según la estructura del proyecto.

La estructura de rutas será exclusivamente la indicada para Pages Router.


## Cambios Previstos en Prisma

Se incorporarán los modelos `Chat` y `Mensaje` con los campos conceptuales aprobados. Chat se relacionará de forma obligatoria con Solicitud mediante `solicitudId`; Mensaje se relacionará obligatoriamente con Chat y con Usuario mediante `remitenteId`.

No se agregará un estado propio para Chat ni se duplicarán `donacionId`, `propietarioId` o `receptorId`. Tampoco se crearán modelos para participantes, archivos, lectura, notificaciones, Calificaciones o Administración.


## Migración

La migración deberá crear las tablas, claves foráneas, restricción única e índices aprobados. También restringirá eliminaciones físicas o cascadas que puedan destruir el historial.

Antes de aplicarla se revisará la correspondencia entre el schema generado, el SQL de migración y las reglas documentadas.


## Relaciones

- `Chat -> Solicitud`: relación obligatoria y única mediante `solicitudId`.
- `Solicitud -> Donacion`: permite derivar la donación y comprobar `solicitudAceptadaId`.
- `Donacion -> Usuario`: permite derivar al propietario.
- `Solicitud -> Usuario`: permite derivar al solicitante aceptado.
- `Mensaje -> Chat`: relación obligatoria para el historial de la conversación.
- `Mensaje -> Usuario`: relación obligatoria para identificar al remitente.

La autorización se resolverá recorriendo estas relaciones, sin una tabla `ParticipanteChat`.


## Restricción Única e Índices

`Chat.solicitudId` tendrá una restricción `UNIQUE` para garantizar un solo chat por solicitud aceptada.

Se preverán índices para:

- Localizar los chats asociados a solicitudes y donaciones de un participante.
- Ordenar chats por `ultimoMensajeAt`, `createdAt` e `id`.
- Consultar mensajes por `chatId`, `createdAt` e `id`.
- Resolver eficientemente las relaciones utilizadas por autorización.


## Creación Diferida e Idempotente

`POST /api/solicitudes/{id}/chat` comprobará que la solicitud exista, esté `ACEPTADA`, coincida con `Donacion.solicitudAceptadaId`, que la donación esté `RESERVADA`, que el actor sea participante y que ambas cuentas estén activas.

El servicio buscará el chat existente y, si no existe, intentará crearlo. La restricción única protegerá la operación frente a dos creaciones simultáneas. Un conflicto de unicidad esperado se resolverá consultando y devolviendo el mismo chat.

La respuesta será `201` cuando se cree y `200` cuando ya exista.


## Protección Frente a Concurrencia

La creación dependerá tanto de comprobaciones del servicio como de `UNIQUE(solicitudId)` en PostgreSQL. Nunca se confiará únicamente en una consulta previa.

El envío de mensajes comprobará condicionalmente que la donación siga `RESERVADA`. Si cambia de estado concurrentemente, no se persistirá un mensaje parcial y se responderá `409 Conflict`.


## Estrategia para Listar Chats

`GET /api/chats` consultará únicamente chats donde el actor sea el propietario o el solicitante aceptado. Aplicará paginación, orden estable y selección explícita del resumen público de la donación y del otro participante.

El contenido completo de los mensajes no se incluirá en el listado.


## Estrategia para Consultar un Chat

`GET /api/chats/{id}` cargará las relaciones mínimas necesarias para verificar la participación. Un chat inexistente o ajeno producirá el mismo `404` público.

La respuesta incluirá metadatos, resumen público de la donación y perfil público del otro participante, pero no cargará automáticamente el historial completo.


## Estrategia para Paginar Mensajes

`GET /api/chats/{id}/mensajes` verificará primero la participación y después consultará la página solicitada. Usará `page = 1`, `limit = 20`, máximo `100`, y orden `createdAt DESC, id DESC`.

Cada mensaje seleccionará únicamente `id`, `contenido`, `createdAt` y el perfil público aprobado del remitente.


## Estrategia para Enviar Mensajes

`POST /api/chats/{id}/mensajes` obtendrá al remitente desde el access token, validará el texto, comprobará ambos participantes activos y exigirá que la donación esté `RESERVADA`.

La creación del mensaje y la actualización de `Chat.ultimoMensajeAt` se realizarán en una transacción o mediante una operación consistente. No se aceptará `remitenteId` ni ningún campo desconocido.


## Autorización y Campos Públicos

Los dos participantes se derivarán de `Donacion.propietarioId` y `Solicitud.solicitanteId`. Todos los accesos comprobarán estas relaciones en el servidor.

Las consultas seleccionarán explícitamente los campos públicos permitidos. Nunca devolverán perfiles completos, datos privados, otros solicitantes ni estructuras Prisma completas.


## Estados de Donación

- `RESERVADA`: permite crear el chat y enviar mensajes si se cumplen las demás reglas.
- `ENTREGADA`: conserva el chat para consulta y prohíbe mensajes nuevos.
- `RETIRADA`: en el caso histórico excepcional, conserva el chat en modo solo lectura.

Cuando 010 origine `RESERVADA -> RETIRADA`, el servicio conservará Chat, mensajes y participantes. La autorización de envío derivará el modo solo lectura del nuevo estado.

Chat no modificará el estado de Donación ni Solicitud.


## Cuentas Inactivas

Una cuenta inactiva no podrá autenticarse. Si uno de los participantes se desactiva, el participante activo conservará acceso de lectura al historial, pero no podrá enviar mensajes nuevos. Chats y mensajes permanecerán almacenados.

La resolución administrativa posterior conservará íntegro el historial y no cambiará participantes.


## Conservación del Historial

No se implementarán operaciones de edición o eliminación. Las relaciones y claves foráneas impedirán eliminaciones en cascada accidentales de chats y mensajes.


## Manejo de Errores

Las rutas utilizarán el contrato y los mecanismos transversales de la feature 004. Los errores técnicos de Zod, Prisma, PostgreSQL y Next.js se traducirán antes de construir la respuesta pública.

Los recursos inexistentes o no visibles compartirán el mismo `404`. Las respuestas `405` incluirán `Allow` y los conflictos de estado o concurrencia utilizarán `409`.


## Pruebas

Se comprobarán, con Postman, Insomnia o herramienta equivalente:

- Creación exitosa y obtención idempotente del chat.
- Dos creaciones concurrentes para la misma solicitud.
- Rechazo de solicitud no aceptada, no seleccionada o donación no reservada.
- Acceso del propietario y del solicitante aceptado.
- Ocultamiento frente a terceros y otros solicitantes.
- Listado, detalle y paginación de mensajes.
- Orden estable de chats y mensajes.
- Validación de contenido y rechazo de campos desconocidos.
- Envío en `RESERVADA` y solo lectura en `ENTREGADA` o `RETIRADA`.
- Tratamiento de cuentas inactivas.
- Resolución administrativa `RESERVADA -> RETIRADA` con conservación de Chat, participantes y mensajes.
- Consulta administrativa limitada a metadatos y cantidad total, sin contenido de mensajes.
- Creación consistente del mensaje y actualización de `ultimoMensajeAt`.
- Contratos y códigos HTTP de la feature 004.
- Conservación del historial.


## Riesgos

- Chats duplicados por condiciones de carrera.
- Mensajes persistidos después de abandonar `RESERVADA`.
- Exposición accidental del contenido de mensajes en consultas administrativas de metadatos.
- Eliminación o modificación del Chat durante una resolución administrativa.
- Inconsistencia entre el último mensaje y `ultimoMensajeAt`.
- Filtración de chats ajenos o datos privados.
- Eliminaciones en cascada que destruyan el historial.
- Consultas costosas al derivar participantes y ordenar chats.
- Registro accidental del contenido completo de mensajes.


## Verificaciones

Antes de completar la feature se verificará:

- Correspondencia entre modelos, migración y restricciones.
- Unicidad efectiva de `Chat.solicitudId`.
- Protección frente a concurrencia.
- Funcionamiento de los cinco endpoints.
- Autorización exclusiva de los dos participantes.
- Mensajería únicamente durante `RESERVADA`.
- Modo solo lectura para `ENTREGADA` y `RETIRADA`.
- Selección explícita de campos públicos.
- Conservación de chats y mensajes.
- Cumplimiento de la feature 004.
- Pruebas, lint y build exitosos.
- Correspondencia entre documentación e implementación.


## Integraciones No Implementadas

Esta feature no implementará WebSocket, tiempo real, notificaciones, archivos, adjuntos, lectura de mensajes, edición, eliminación, Calificaciones ni endpoints de Administración. Los endpoints administrativos pertenecen exclusivamente a 010.
