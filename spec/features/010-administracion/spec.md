# Administración - Especificación

## Objetivo

Permitir que un usuario autenticado, activo y con rol `ADMIN` supervise las entidades principales de DonApp, consulte información administrativa segura, gestione el estado de cuentas, revoque sesiones, identifique casos bloqueados, ejecute resoluciones administrativas específicas, exima calificaciones pendientes imposibles de atender, consulte auditorías y conserve todo el historial.

`ADMIN` no actuará como propietario, solicitante, receptor, remitente ni autor de una calificación. Tampoco podrá suplantar usuarios.


## Descripción

Esta feature reúne exclusivamente operaciones administrativas separadas de los flujos normales. Las consultas y resoluciones estarán protegidas por un guard común, utilizarán contratos seguros y registrarán las mutaciones sensibles en una auditoría inmutable.


## Alcance

### Usuarios

- Listado administrativo.
- Detalle administrativo.
- Desactivación.
- Reactivación.
- Revocación de sesiones.

### Donaciones

- Listado global.
- Detalle administrativo.
- Filtros.
- Identificación de donaciones `RESERVADA` bloqueadas.
- Resolución específica de donaciones `RESERVADA` con participantes inactivos.

### Solicitudes

- Listado global.
- Detalle administrativo.
- Filtros.
- Consulta de estados, causas y participantes inactivos.

### Chats

- Listado administrativo de metadatos.
- Detalle administrativo de metadatos.
- Sin acceso al contenido de mensajes.

### Calificaciones

- Listado global.
- Detalle administrativo.
- Exención de pendientes imposibles de atender.

### Auditoría

- Registro de mutaciones administrativas sensibles.
- Listado de auditorías.
- Detalle de una auditoría.


## Fuera de Alcance

Esta feature no implementará:

- Eliminación física.
- Suplantación.
- Edición de datos personales.
- Modificación de contraseñas.
- Cambio de roles o creación de roles.
- Permisos granulares.
- Desactivación administrativa de la propia cuenta.
- Envío o lectura de mensajes.
- Creación de solicitudes en nombre de usuarios.
- Creación o edición de calificaciones.
- Calificaciones ficticias.
- Edición general de donaciones.
- Cambio arbitrario de estados.
- Selección de otro receptor.
- Modificación de una solicitud `ACEPTADA`.
- Administración duplicada de Categorías.
- Estadísticas avanzadas, reportes o exportaciones.
- Notificaciones.
- Panel web administrativo.
- Detección automática de fraude.
- Frontend Flutter.


## Tecnologías y Arquitectura

- Next.js 16.2.10 con Pages Router.
- TypeScript 5.9.3.
- PostgreSQL 16.
- Prisma ORM 7.8.
- Zod para validaciones.

Se utilizará un guard administrativo compartido compatible con Pages Router.


## Roles

La primera versión conservará únicamente `ADMIN` y `USUARIO`. No existirán endpoints para modificar roles.

Un administrador no podrá cambiar su propio rol, cambiar el rol de otro usuario, asignar `ADMIN` ni retirar `ADMIN`.

Al desactivar una cuenta con rol `ADMIN`, la operación deberá comprobar que permanezca al menos otro administrador activo. La política general de cambio de roles y protección del último administrador queda fuera de esta versión.


## Prohibiciones Administrativas

`ADMIN` no podrá suplantar usuarios, modificar roles ni actuar como propietario, solicitante, receptor, remitente o autor de una calificación. La protección del último administrador activo será obligatoria en toda desactivación administrativa.


## Categorías

Esta feature no administrará Categorías. Toda su administración seguirá perteneciendo exclusivamente a `005-categorias`, que se utilizará como dependencia externa.


## Autenticación y Autorización

Todos los endpoints bajo `/api/admin/` deberán:

- Validar el access token.
- Comprobar que la sesión sea válida.
- Obtener la identidad desde el token.
- Comprobar que `Usuario.activo = true`.
- Comprobar que el rol sea `ADMIN`.

La API nunca confiará en `administradorId`, `adminId`, `role`, `rol` o `usuarioId` del actor enviados por el cliente.

El rol actual almacenado en la base de datos será la fuente definitiva para autorizar operaciones administrativas. No se confiará únicamente en el rol incluido en un token emitido anteriormente.

- `401`: no existe autenticación válida.
- `403`: el usuario está autenticado, pero no es `ADMIN`.
- `404`: el recurso administrativo no existe.
- `409`: existe un conflicto de estado o concurrencia.


## Identificación de Sesión en el Access Token

El access token incorporará conceptualmente la claim `sid`, que contendrá el identificador UUID de la Sesión que originó el token.

Su payload permitirá identificar como mínimo:

- `sub`: identificador del usuario.
- `sid`: identificador de la sesión.
- Rol o información mínima autorizada definida en la feature 002.
- Fechas estándar de emisión y expiración.

`sid` se obtendrá exclusivamente del token firmado. No será enviado libremente por el cliente, no se expondrá en respuestas normales, no sustituirá la validación criptográfica y no contendrá el refresh token ni su hash.


## Validación del Guard Administrativo

El guard compartido comprobará:

- Firma válida del access token.
- Token no expirado.
- Existencia de `sub` y `sid`.
- Existencia de la Sesión correspondiente.
- Coincidencia entre `Sesion.usuarioId` y `sub`.
- `Sesion.revokedAt = null`.
- `Sesion.expiresAt` posterior a la fecha actual.
- `Usuario.activo = true`.
- Rol actual del usuario igual a `ADMIN`.

La validación de sesión, usuario y rol se resolverá mediante una consulta eficiente que incluya o seleccione únicamente:

- `Sesion.id`.
- `Sesion.usuarioId`.
- `Sesion.expiresAt`.
- `Sesion.revokedAt`.
- `Usuario.id`.
- `Usuario.activo`.
- `Rol.codigo`.

No se realizarán consultas separadas y redundantes para sesión, usuario y rol, ni se devolverá el resultado completo de Prisma.


## Revocación Inmediata

Con la claim `sid`:

- El logout de la sesión actual revocará la Sesión correspondiente.
- La revocación administrativa invalidará inmediatamente los access tokens asociados.
- Un access token firmado correctamente será rechazado si su Sesión fue revocada.
- Revocar una sesión no afectará otras sesiones del mismo usuario.
- Revocar todas las sesiones invalidará todos sus access tokens asociados.

La documentación de `002-autenticacion-core` ya está alineada con esta decisión; su implementación continúa pendiente.


## Requisitos Funcionales

**RF-001** Consultar usuarios mediante listados y detalles administrativos seguros.

**RF-002** Desactivar y reactivar cuentas con coordinación de efectos y auditoría.

**RF-003** Revocar administrativamente las sesiones activas de un usuario.

**RF-004** Consultar globalmente donaciones y resolver casos `RESERVADA` bloqueados.

**RF-005** Consultar globalmente solicitudes y sus relaciones administrativas.

**RF-006** Consultar exclusivamente metadatos administrativos de chats.

**RF-007** Consultar calificaciones y eximir pendientes imposibles de atender.

**RF-008** Registrar y consultar auditorías administrativas inmutables.

**RF-009** Conservar todas las entidades y sus historiales.


## Reglas de Negocio

**RN-001** Todos los endpoints requerirán un usuario autenticado, activo y con rol `ADMIN`.

**RN-002** La identidad administrativa se obtendrá exclusivamente desde el access token.

**RN-003** `ADMIN` nunca actuará como participante de los flujos ordinarios.

**RN-004** Ninguna entidad se eliminará físicamente mediante esta feature.

**RN-005** Toda mutación sensible y su auditoría se ejecutarán atómicamente.

**RN-006** Las repeticiones idempotentes sin mutación real no repetirán efectos ni auditorías.

**RN-007** Los datos privados se limitarán al detalle administrativo que realmente los necesite.

**RN-008** Las solicitudes `ACEPTADA` y los historiales existentes no se reescribirán.

**RN-009** La administración de Categorías pertenecerá exclusivamente a la feature 005.


## Administración de Usuarios

La API incluirá:

- `GET /api/admin/usuarios`.
- `GET /api/admin/usuarios/{id}`.
- `PATCH /api/admin/usuarios/{id}/estado`.
- `POST /api/admin/usuarios/{id}/revocar-sesiones`.

No existirán operaciones para eliminar usuarios, modificar contraseñas, editar perfiles, cambiar roles o bloquear físicamente una cuenta.


## Listado Administrativo de Usuarios

`GET /api/admin/usuarios` devolverá una representación resumida con:

- `id`.
- `nombreVisible`.
- `fotoPerfil`.
- `ciudad`.
- `activo`.
- `rol`.
- `createdAt`.
- `updatedAt`.

No incluirá `nombreCompleto`, `email`, `telefono`, sesiones individuales, tokens ni hashes.

Filtros permitidos:

- `activo`.
- `rol`.
- `ciudad`.

No incluirá búsqueda textual en la primera versión.


## Detalle Administrativo de Usuario

`GET /api/admin/usuarios/{id}` podrá incluir:

- `id`, `nombreCompleto`, `nombreVisible`, `email`, `telefono`, `fotoPerfil` y `ciudad`.
- `activo`, `rol`, `createdAt` y `updatedAt`.
- Resumen de sesiones activas, revocadas y expiradas.
- Donaciones agrupadas por estado.
- Solicitudes agrupadas por estado.
- Total de calificaciones recibidas.
- Total de calificaciones pendientes derivadas.

Nunca incluirá `passwordHash`, `refreshTokenHash`, tokens, secretos, cuerpos de autenticación ni objetos Prisma completos.


## Cambio Administrativo de Estado

`PATCH /api/admin/usuarios/{id}/estado`

Entrada:

```json
{
  "activo": false,
  "motivo": "Descripción suficiente de la acción administrativa."
}
```

Reglas:

- `activo` será un booleano obligatorio.
- `motivo` será obligatorio.
- Se rechazarán campos desconocidos.
- El administrador no podrá modificar su propia cuenta.
- Al desactivar otro `ADMIN` deberá quedar al menos uno activo.
- Desactivar una cuenta ya inactiva responderá `200`.
- Reactivar una cuenta ya activa responderá `200`.
- Las repeticiones idempotentes no modificarán fechas ni crearán auditorías duplicadas.


## Efectos de la Desactivación

La desactivación coordinará atómicamente:

- `Usuario.activo = false`.
- Revocación de todas sus sesiones activas.
- Rechazo inmediato de cualquier access token asociado mediante el guard.
- Donaciones `PUBLICADA` del usuario a `RETIRADA`.
- Solicitudes `PENDIENTE` creadas por el usuario a `CANCELADA`, con causa `USUARIO_INACTIVO`.
- Solicitudes `PENDIENTE` recibidas en donaciones retiradas a `CANCELADA`, con causa `DONACION_RETIRADA`.

No modificará automáticamente donaciones `RESERVADA`, solicitudes `ACEPTADA`, chats, mensajes ni calificaciones.

Las donaciones `RESERVADA` con participantes inactivos quedarán disponibles para resolución administrativa específica. La mutación y su auditoría se ejecutarán en la misma transacción.


## Efectos de la Reactivación

La reactivación cambiará únicamente `Usuario.activo = true` y requerirá un nuevo login.

No restaurará sesiones revocadas, access tokens anteriores, donaciones retiradas, solicitudes canceladas, publicaciones anteriores ni estados históricos. La reactivación y su auditoría se ejecutarán en la misma transacción.


## Revocación Administrativa de Sesiones

`POST /api/admin/usuarios/{id}/revocar-sesiones`

Entrada:

```json
{
  "motivo": "Descripción suficiente de la revocación administrativa."
}
```

La operación revocará todas las sesiones activas, no devolverá tokens ni hashes e informará la cantidad revocada. Si no existen sesiones activas, responderá `200` con cantidad `0` y no creará una auditoría duplicada.


## Administración de Donaciones

La API incluirá:

- `GET /api/admin/donaciones`.
- `GET /api/admin/donaciones/{id}`.
- `POST /api/admin/donaciones/{id}/resolver`.

Filtros del listado:

- `estado`.
- `ciudad`.
- `categoriaId`.
- `propietarioId`.

El detalle podrá incluir los campos de la donación, propietario resumido, categoría, solicitud aceptada, receptor derivado, confirmaciones, cantidad de solicitudes por estado, existencia de chat, estado activo de participantes, calificación o pendiente y resolución administrativa previa.

No incluirá datos privados innecesarios.


## Resolución de una Donación Bloqueada

`POST /api/admin/donaciones/{id}/resolver`

Entrada:

```json
{
  "resolucion": "RETIRAR",
  "motivo": "Descripción suficiente del caso administrativo."
}
```

La única resolución permitida será `RETIRAR` y solo podrá aplicarse cuando:

- La donación esté `RESERVADA`.
- Exista `solicitudAceptadaId`.
- La solicitud referenciada esté `ACEPTADA`.
- El propietario o receptor esté inactivo.

Esta operación aprueba la transición excepcional `RESERVADA -> RETIRADA`. No pertenece al flujo normal de Donaciones y solo podrá originarse desde este endpoint administrativo, con motivo y auditoría obligatorios.

La resolución ejecutará atómicamente:

- `Donacion.estado = RETIRADA`.
- `retiradaAt = fecha actual`.
- Conservación de `solicitudAceptadaId`.
- Conservación de la Solicitud `ACEPTADA`.
- Conservación de propietario, receptor, Chat, mensajes, confirmaciones y Calificación, si existiera.
- Creación de la Auditoría Administrativa.

No devolverá la donación a `PUBLICADA`, cancelará la solicitud aceptada, seleccionará otro receptor, cambiará a `ENTREGADA` ni eliminará registros.

El chat quedará en modo solo lectura. Si ambos participantes están activos, responderá `409`. Repetir una resolución compatible responderá `200` sin duplicar la auditoría; una resolución diferente o incompatible responderá `409`.

Después de la resolución, la Solicitud conservará su estado final y la donación dejará de considerarse un caso `RESERVADA` bloqueado.

La documentación de la feature 006 ya incorpora `RESERVADA -> RETIRADA` como transición exclusivamente administrativa originada por la feature 010; su implementación continúa pendiente.


## Administración de Solicitudes

La API incluirá:

- `GET /api/admin/solicitudes`.
- `GET /api/admin/solicitudes/{id}`.

Filtros:

- `estado`.
- `causaCancelacion`.
- `donacionId`.
- `solicitanteId`.

El detalle podrá incluir campos de la solicitud, donación resumida, propietario, solicitante, estado activo de participantes, fechas terminales, causa de cancelación, relación con `solicitudAceptadaId` y existencia de chat.

`ADMIN` no podrá aceptar, rechazar, cancelar, regresar a `PENDIENTE`, cambiar una solicitud `ACEPTADA` ni actuar como propietario o solicitante.


## Administración de Chats

La API incluirá:

- `GET /api/admin/chats`.
- `GET /api/admin/chats/{id}`.

Solo mostrará metadatos:

- `id` y `solicitudId`.
- Donación resumida.
- Propietario y receptor resumidos.
- Estado activo de participantes.
- `createdAt`, `updatedAt` y `ultimoMensajeAt`.
- Cantidad total de mensajes.

No permitirá consultar el contenido o listado de mensajes, enviar mensajes, bloquear directamente el chat, modificar participantes ni eliminar el chat.


## Administración de Calificaciones

La API incluirá:

- `GET /api/admin/calificaciones`.
- `GET /api/admin/calificaciones/{id}`.
- `POST /api/admin/calificaciones/pendientes/{donacionId}/eximir`.

Filtros:

- `puntuacion`.
- `propietarioId`.
- `receptorId`.
- `donacionId`.

El detalle podrá mostrar `id`, `puntuacion`, `createdAt`, donación resumida, propietario y receptor derivado.

`ADMIN` no podrá crear, editar o eliminar calificaciones, calificar como receptor ni crear calificaciones ficticias. El ocultamiento lógico y la restauración quedan fuera de esta versión.


## Modelo Conceptual ExencionCalificacion

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria |
| `donacionId` | Int | Obligatorio y único |
| `administradorId` | Int | Administrador obtenido del access token |
| `motivo` | String | Obligatorio |
| `createdAt` | DateTime | Fecha de creación |

No tendrá `updatedAt`, estado, puntuación ni `usuarioId` duplicado. No se eliminará físicamente.

El receptor se derivará mediante `Donacion.solicitudAceptadaId -> Solicitud.solicitanteId`. No se agregarán campos de exención en Usuario, Solicitud, Donación ni Calificación.


## Eximir una Calificación Pendiente

`POST /api/admin/calificaciones/pendientes/{donacionId}/eximir`

Entrada:

```json
{
  "motivo": "Descripción suficiente de por qué la obligación no puede atenderse."
}
```

Solo podrá aplicarse cuando:

- La donación exista y esté `ENTREGADA`.
- Exista `solicitudAceptadaId`.
- La solicitud esté `ACEPTADA`.
- No exista una Calificación.
- Exista realmente una pendiente.
- No exista otra Exención para la misma donación.

La operación creará `ExencionCalificacion` y `AuditoriaAdministrativa` en la misma transacción. No creará puntuaciones ni modificará Donación, Solicitud, Usuario o Chat.

- `201` cuando se cree.
- `200` cuando la misma exención ya exista.
- `409` cuando ya exista una calificación o no sea una pendiente válida.

La integración futura con 009 considerará pendiente únicamente una donación `ENTREGADA` sin Calificación y sin Exención. Esta feature no modifica todavía la feature 009.


## Modelo Conceptual AuditoriaAdministrativa

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria |
| `administradorId` | Int | Obtenido del access token |
| `accion` | Valor controlado | Asignado por el servidor |
| `entidad` | Valor controlado | Asignado por el servidor |
| `entidadId` | Identificador seguro | Recurso afectado |
| `motivo` | String | Obligatorio para mutaciones sensibles |
| `metadata` | JSON? | Opcional, segura y generada por el servidor |
| `createdAt` | DateTime | Fecha de creación |

No tendrá `updatedAt` ni `eliminadoAt`. Será inmutable y nunca se eliminará físicamente. La API no aceptará metadata libre enviada por el cliente.


## Acciones Auditables

Como mínimo se registrarán:

- `USUARIO_DESACTIVADO`.
- `USUARIO_REACTIVADO`.
- `SESIONES_REVOCADAS`.
- `DONACION_RESERVADA_RETIRADA`.
- `CALIFICACION_PENDIENTE_EXIMIDA`.

Los listados y detalles ordinarios no crearán auditorías. Una repetición idempotente sin nueva mutación no generará otra auditoría.


## Contenido Prohibido en Auditoría

Nunca se guardarán:

- Contraseñas o `passwordHash`.
- `refreshTokenHash`, access tokens o refresh tokens.
- Secretos, claves o variables de entorno.
- Cuerpos completos de autenticación o solicitudes HTTP.
- Contenido completo de mensajes.
- Consultas SQL o stack traces.
- Objetos Prisma.
- Datos personales innecesarios.

La metadata segura podrá contener estados anterior y nuevo, cantidad de sesiones revocadas, identificadores técnicos mínimos y tipo de resolución.


## Motivo Administrativo

Todas las mutaciones sensibles recibirán `motivo` con estas reglas:

- Tipo `string` y obligatorio.
- `trim` al inicio y final.
- Mínimo 10 y máximo 500 caracteres.
- Texto plano.
- Conservación de espacios internos.
- Sin interpretación de HTML o Markdown.
- Rechazo de cadenas vacías y campos desconocidos.
- Sin credenciales, secretos ni contenido completo de mensajes.

El motivo se almacenará en Auditoría y también en `ExencionCalificacion` cuando corresponda.


## Auditorías

La API incluirá:

- `GET /api/admin/auditorias`.
- `GET /api/admin/auditorias/{id}`.

Filtros:

- `administradorId`.
- `accion`.
- `entidad`.
- `entidadId`.
- `fechaDesde`.
- `fechaHasta`.

La representación incluirá identificador, administrador público mínimo, acción, entidad, entidadId, motivo, metadata segura y fecha. Nunca mostrará información prohibida.


## Endpoints Definitivos

La API incluirá únicamente:

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/admin/usuarios` | Listar usuarios |
| GET | `/api/admin/usuarios/{id}` | Consultar detalle de usuario |
| PATCH | `/api/admin/usuarios/{id}/estado` | Desactivar o reactivar una cuenta |
| POST | `/api/admin/usuarios/{id}/revocar-sesiones` | Revocar sesiones activas |
| GET | `/api/admin/donaciones` | Listar donaciones |
| GET | `/api/admin/donaciones/{id}` | Consultar detalle de donación |
| POST | `/api/admin/donaciones/{id}/resolver` | Resolver una donación bloqueada |
| GET | `/api/admin/solicitudes` | Listar solicitudes |
| GET | `/api/admin/solicitudes/{id}` | Consultar detalle de solicitud |
| GET | `/api/admin/chats` | Listar metadatos de chats |
| GET | `/api/admin/chats/{id}` | Consultar metadatos de un chat |
| GET | `/api/admin/calificaciones` | Listar calificaciones |
| GET | `/api/admin/calificaciones/{id}` | Consultar detalle de calificación |
| POST | `/api/admin/calificaciones/pendientes/{donacionId}/eximir` | Eximir una pendiente imposible |
| GET | `/api/admin/auditorias` | Listar auditorías |
| GET | `/api/admin/auditorias/{id}` | Consultar una auditoría |


## Paginación y Filtros

Todos los listados utilizarán:

- `page`: valor predeterminado `1`.
- `limit`: valor predeterminado `20`; máximo `100`.
- Orden `createdAt DESC`.
- `id DESC` como desempate estable.

Cuando `total` sea `0`, `totalPages` será `0`. Los parámetros serán estrictos y los valores inválidos se rechazarán. No habrá búsqueda textual en esta versión.

Cada listado utilizará únicamente los filtros definidos en su sección.


## Idempotencia

- Desactivar un usuario ya inactivo: `200`.
- Reactivar un usuario ya activo: `200`.
- Revocar sesiones cuando no existan activas: `200` con cantidad `0`.
- Repetir la misma resolución administrativa: `200`.
- Eximir una pendiente ya eximida: `200`.
- Intentar una resolución diferente o incompatible: `409`.

Una repetición sin mutación real no modificará fechas, repetirá efectos ni creará una auditoría duplicada.


## Transacciones y Concurrencia

Deberán ser atómicas con su Auditoría:

- Desactivación de cuenta y efectos coordinados.
- Reactivación de cuenta.
- Revocación de sesiones.
- Resolución de una donación bloqueada.
- Creación de una exención.

Se utilizarán actualizaciones condicionales, restricciones únicas, comprobación de estado dentro de la transacción, `UNIQUE(ExencionCalificacion.donacionId)`, comprobación del último `ADMIN` activo y protección frente a dos resoluciones simultáneas.

Una resolución incompatible responderá `409`. La auditoría no persistirá si falla la mutación y la mutación no se confirmará sin su auditoría.


## Privacidad Administrativa

Los listados utilizarán únicamente la información necesaria. `nombreCompleto`, `email` y `telefono` solo podrán aparecer en el detalle administrativo del usuario.

Siempre estarán prohibidos:

- `passwordHash` y `refreshTokenHash`.
- Tokens.
- Secretos y claves criptográficas.
- Variables de entorno.
- Cuerpos completos de autenticación.
- Consultas SQL y stack traces.
- Objetos Prisma completos.
- Mensajes privados.

Las sesiones solo aparecerán como resumen o metadata segura, nunca con tokens o hashes.


## Manejo de Errores

Todas las respuestas respetarán el contrato transversal de la feature 004.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Respuesta de error:

```json
{
  "success": false,
  "status": 400,
  "message": "...",
  "data": null
}
```

`errors` será opcional y se utilizará únicamente para validaciones por campo.

| Código | Uso administrativo |
|---|---|
| 200 | Consultas, mutaciones exitosas e idempotencia |
| 201 | Creación de una exención |
| 400 | Identificador, cuerpo, filtro o paginación inválidos |
| 401 | Autenticación ausente o inválida |
| 403 | Usuario autenticado sin rol `ADMIN` |
| 404 | Recurso administrativo inexistente |
| 405 | Método no permitido, con cabecera `Allow` |
| 409 | Estado incompatible, último administrador, conflicto concurrente o resolución incompatible |
| 500 | Error interno seguro |


## Integraciones Futuras

Quedan fuera de esta versión:

- Permisos granulares y nuevos roles.
- Cambio de roles.
- Panel administrativo.
- Estadísticas, exportaciones y reportes.
- Notificaciones.
- Detección automática de fraude.
- Moderación avanzada.
- Lectura excepcional de mensajes.
- Retención legal.
- Herramientas de soporte.
- Flujos de doble aprobación.
- Caché administrativa.


## Dependencias

Esta feature depende de:

- `002-autenticacion-core` para autenticación, roles, sesiones y claim `sid`; documentación alineada e implementación pendiente.
- `003-gestion-usuarios` para cuentas, perfiles y desactivación.
- `004-manejo-errores` para el contrato uniforme.
- `005-categorias` como única responsable de administrar Categorías.
- `006-donaciones` para estados, participantes, confirmaciones y transición administrativa `RESERVADA -> RETIRADA`; documentación alineada e implementación pendiente.
- `007-solicitudes` para estados, causas y solicitud aceptada.
- `008-chat` para metadatos y reglas de solo lectura.
- `009-calificaciones` para calificaciones y pendientes derivados.


## Sincronizaciones Documentales Completadas

- `002-autenticacion-core` incorpora conceptualmente `sid` en el access token, valida Sesión, usuario activo y rol actual, y contempla revocación inmediata.
- `003-gestion-usuarios` contempla desactivación coordinada, revocación de sesiones, efectos sobre Donaciones y Solicitudes, y reactivación sin restaurar estados históricos.
- `006-donaciones` incorpora `solicitudAceptadaId`, deriva al receptor mediante la solicitud aceptada, incorpora `RESERVADA -> RETIRADA` como transición exclusivamente administrativa y conserva Solicitud aceptada, Chat, mensajes y confirmaciones.
- `007-solicitudes` bloquea la creación cuando existen calificaciones pendientes y considera `ExencionCalificacion` al determinar el bloqueo.
- `008-chat` conserva Chat y mensajes después de una resolución administrativa, aplica modo solo lectura y limita a `ADMIN` a metadatos sin contenido.
- `009-calificaciones` excluye de pendientes las donaciones con `ExencionCalificacion` y no considera la exención como puntuación ni la incluye en promedios o totales.

Las sincronizaciones documentales están completadas. La implementación en código, Prisma, migraciones, servicios y pruebas continúa pendiente. Estas decisiones no son contradicciones abiertas.


## Estado

Pendiente.


## Observaciones

Las resoluciones administrativas serán específicas, auditables e inmutables. Ningún endpoint otorgará poderes generales para reescribir estados o actuar como otro usuario.

La claim `sid`, la transición administrativa `RESERVADA -> RETIRADA` y `ExencionCalificacion` están aprobadas. La documentación transversal ya está sincronizada; todavía no existe implementación en código, Prisma, migraciones, servicios ni pruebas.
