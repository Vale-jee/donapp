# Plan de Implementacion - Solicitudes

## Dependencias

La implementacion se apoyara en:

- `002-autenticacion-core` para autenticar, obtener la identidad desde el access token y rechazar sesiones invalidas.
- `003-gestion-usuarios` para comprobar cuentas activas, ciudad y perfiles publicos permitidos.
- `004-manejo-errores` para construir todas las respuestas y traducir errores tecnicos.
- `006-donaciones` para propiedad, visibilidad, ciudad y estados de las donaciones.


## Arquitectura

La feature se organizara en capas de rutas REST, validaciones, servicios y persistencia con Prisma. Las rutas se limitaran a autenticar, validar entradas, invocar el servicio correspondiente y construir respuestas mediante el mecanismo transversal de la feature 004.

Los servicios concentraran autorizacion, privacidad, reglas de estados, transacciones y seleccion explicita de campos publicos. La persistencia aplicara las relaciones, restricciones e indices necesarios en PostgreSQL.


## Organizacion de Rutas

Se implementaran exactamente los ocho endpoints aprobados:

- `POST /api/solicitudes`.
- `GET /api/solicitudes/enviadas`.
- `GET /api/solicitudes/recibidas`.
- `GET /api/solicitudes/{id}`.
- `GET /api/donaciones/{id}/solicitudes`.
- `PATCH /api/solicitudes/{id}/aceptar`.
- `PATCH /api/solicitudes/{id}/rechazar`.
- `PATCH /api/solicitudes/{id}/cancelar`.

No se implementaran rutas `PUT` ni eliminacion fisica.


## Servicios y Validaciones

Los servicios separaran creacion, consultas, aceptacion, rechazo y cancelacion. Las validaciones Zod cubriran identificadores, cuerpo de creacion, cuerpos vacios de acciones, paginacion, filtro por estado y rechazo de campos desconocidos.

Las reglas dependientes del estado real de la base de datos se comprobaran en los servicios y, cuando corresponda, dentro de la misma transaccion que realiza el cambio. La creacion consultara calificaciones pendientes y exenciones lo mas cerca posible de persistir.


## Organizacion Probable de Archivos

La implementacion probablemente requerira crear o modificar:

- `prisma/schema.prisma`.
- Una migracion de Prisma con ajustes PostgreSQL revisados.
- Modulos compartidos de validacion y servicio para Solicitudes.
- `src/pages/api/solicitudes/index.ts`.
- `src/pages/api/solicitudes/enviadas.ts`.
- `src/pages/api/solicitudes/recibidas.ts`.
- `src/pages/api/solicitudes/[id]/index.ts`.
- `src/pages/api/solicitudes/[id]/aceptar.ts`.
- `src/pages/api/solicitudes/[id]/rechazar.ts`.
- `src/pages/api/solicitudes/[id]/cancelar.ts`.
- `src/pages/api/donaciones/[id]/solicitudes.ts`.
- Servicios de Donaciones y Gestion de Usuarios que coordinen retirada o desactivacion.
- Pruebas o colecciones de Postman/Insomnia segun la estructura aprobada del proyecto.

Las ubicaciones definitivas se ajustaran a la arquitectura existente al iniciar la implementacion.


## Cambios Previstos en Prisma

Se incorporaran los enums de estado y causa de cancelacion, el modelo `Solicitud`, sus claves foraneas obligatorias y las fechas opcionales aprobadas. `Donacion` incorporara conceptualmente `solicitudAceptadaId` nullable como referencia a la solicitud seleccionada, sin agregar `receptorId`.

No se incorporaran modelos de Chat, Calificaciones ni Administracion.


## Migracion y Restricciones de PostgreSQL

La migracion debera crear tablas, enums, claves foraneas, indices de consulta y restricciones que garanticen:

- Una sola solicitud `PENDIENTE` o `ACEPTADA` por `donacionId + solicitanteId`.
- Una sola solicitud `ACEPTADA` por donacion.
- Coherencia entre estado, causa de cancelacion y fechas terminales.
- Restriccion de eliminacion fisica.

Las restricciones parciales que Prisma no pueda representar directamente se agregaran de forma explicita en la migracion PostgreSQL y se revisaran antes de aplicarla.


## Transacciones

La aceptacion, la retirada de una donacion y las cancelaciones derivadas de desactivar cuentas se ejecutaran atomica y consistentemente. Las operaciones utilizaran comprobaciones condicionales para impedir aceptaciones dobles, retiradas concurrentes o nuevas solicitudes durante una reserva.


## Estrategia de Aceptacion

El servicio verificara actor, propiedad, solicitud `PENDIENTE` y donacion `PUBLICADA`. En una unica transaccion:

- Cambiara la solicitud seleccionada a `ACEPTADA` y registrara `aceptadaAt`.
- Cambiara la donacion a `RESERVADA`.
- Asignara `Donacion.solicitudAceptadaId`.
- Cancelara las demas solicitudes pendientes con causa `OTRA_SOLICITUD_ACEPTADA` y fecha de cancelacion.

La repeticion autorizada sobre la misma solicitud ya aceptada sera idempotente y no alterara fechas.


## Estrategia de Rechazo

El servicio comprobara que el actor sea propietario y que la solicitud este `PENDIENTE`. Solo cambiara la solicitud a `RECHAZADA` y registrara `rechazadaAt`; no modificara la donacion ni otras solicitudes. La repeticion autorizada del mismo rechazo sera idempotente.


## Estrategia de Cancelacion

La cancelacion voluntaria comprobara que el actor sea el solicitante y la solicitud este `PENDIENTE`. Asignara `CANCELADA`, causa `VOLUNTARIA` y `canceladaAt`. Las cancelaciones automaticas asignaran exclusivamente la causa aprobada para el evento que las origine. Una repeticion autorizada de la misma cancelacion sera idempotente.


## Coordinacion con Donaciones

La aceptacion coordinara la reserva y la referencia a la solicitud aceptada. La retirada de una donacion `PUBLICADA` cancelara sus solicitudes pendientes con causa `DONACION_RETIRADA` dentro de la misma transaccion. La feature conservara todas las solicitudes como historial.


## Integraciones Futuras

### Chat

La solicitud aceptada solo dejara disponible la referencia que `008-chat` utilizara posteriormente. Esta feature no implementara el modelo, rutas ni mensajes de Chat.

### Calificaciones

El servicio de creacion consultara Donaciones `ENTREGADA` donde el actor sea receptor seleccionado y no exista `Calificacion` ni `ExencionCalificacion`.

Si existe una o mas pendientes respondera `409` con el mensaje aprobado y `data: null`, sin incluir el listado. La consulta considerara calificadas o eximidas todas las obligaciones antes de permitir una nueva solicitud.

La comprobacion se ejecutara cerca de la escritura para reducir carreras entre entrega, calificacion, exencion y creacion.

### Administracion

La supervision global y la resolucion de casos con participantes inactivos corresponderan a `010-administracion` mediante endpoints separados. Los endpoints normales no otorgaran al rol `ADMIN` acciones de propietario o solicitante.


## Pruebas

Se verificaran con Postman, Insomnia o herramienta equivalente:

- Creacion valida y rechazo de autosolicitud, ciudad distinta, donacion no visible o fuera de `PUBLICADA`.
- Prevencion de duplicados y nueva solicitud despues de `RECHAZADA` o `CANCELADA`.
- Consultas enviadas, recibidas, por donacion y detalle con privacidad por actor.
- Paginacion, filtros, orden estable e identificadores invalidos.
- Aceptacion atomica, cancelacion de solicitudes competidoras y una unica aceptada.
- Rechazo sin efectos laterales sobre la donacion.
- Cancelacion voluntaria y cancelaciones automaticas con su causa correcta.
- Idempotencia y conflictos entre acciones terminales distintas.
- Respuestas `401`, `403`, `404`, `405`, `409` y `500` seguras.
- Escenarios concurrentes de creacion, aceptacion y retirada.
- Bloqueo por una o multiples calificaciones pendientes.
- Exclusion de donaciones calificadas o con `ExencionCalificacion`.
- Mensaje `409` sin filtrar el listado de pendientes.


## Riesgos

- Condiciones de carrera que produzcan dos solicitudes aceptadas.
- Inconsistencia entre la solicitud aceptada y el estado `RESERVADA` de la donacion.
- Filtracion de otros solicitantes o datos privados mediante consultas o errores.
- Restricciones parciales no reflejadas completamente por Prisma.
- Cancelaciones automaticas incompletas durante retirada o desactivacion.
- Una carrera entre entrega, calificacion, exencion y creacion podria permitir una solicitud cuando existe una pendiente.
- Ignorar `ExencionCalificacion` podria bloquear permanentemente a un usuario eximido.
- Alteracion accidental de fechas al repetir operaciones idempotentes.


## Verificaciones

Antes de completar la feature se comprobara:

- Correspondencia entre schema, migracion y restricciones PostgreSQL.
- Atomicidad y proteccion frente a concurrencia.
- Seleccion explicita de campos segun el actor.
- Uso uniforme del contrato de la feature 004.
- Ausencia de eliminacion fisica y conservacion del historial.
- Funcionamiento de los ocho endpoints.
- Pruebas funcionales y de errores.
- Ejecucion correcta de lint y build.
- Correspondencia final entre implementacion y documentacion.
