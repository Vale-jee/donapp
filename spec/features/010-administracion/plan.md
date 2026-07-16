# Plan de Implementación - Administración

## Dependencias

La implementación dependerá de:

- `002-autenticacion-core` para access tokens, sesiones y roles.
- `003-gestion-usuarios` para cuentas, perfiles y desactivación.
- `004-manejo-errores` para el contrato uniforme.
- `005-categorias` como responsable exclusiva de Categorías.
- `006-donaciones` para estados, participantes y confirmaciones.
- `007-solicitudes` para estados, causas y solicitud aceptada.
- `008-chat` para metadatos y reglas de solo lectura.
- `009-calificaciones` para calificaciones y pendientes derivados.


## Arquitectura

La feature utilizará Next.js con Pages Router y separará:

- Rutas REST administrativas.
- Guard administrativo compartido.
- Validaciones Zod.
- Servicios por dominio administrativo.
- Servicios de auditoría y exenciones.
- Prisma para consultas, transacciones y persistencia en PostgreSQL.

Las rutas se limitarán a validar método, autenticar, validar entradas, invocar servicios y construir respuestas mediante la feature 004.


## Organización Probable de Archivos

### Usuarios

- `src/pages/api/admin/usuarios/index.ts`.
- `src/pages/api/admin/usuarios/[id]/index.ts`.
- `src/pages/api/admin/usuarios/[id]/estado.ts`.
- `src/pages/api/admin/usuarios/[id]/revocar-sesiones.ts`.

### Donaciones

- `src/pages/api/admin/donaciones/index.ts`.
- `src/pages/api/admin/donaciones/[id]/index.ts`.
- `src/pages/api/admin/donaciones/[id]/resolver.ts`.

### Solicitudes

- `src/pages/api/admin/solicitudes/index.ts`.
- `src/pages/api/admin/solicitudes/[id]/index.ts`.

### Chats

- `src/pages/api/admin/chats/index.ts`.
- `src/pages/api/admin/chats/[id]/index.ts`.

### Calificaciones

- `src/pages/api/admin/calificaciones/index.ts`.
- `src/pages/api/admin/calificaciones/[id]/index.ts`.
- `src/pages/api/admin/calificaciones/pendientes/[donacionId]/eximir.ts`.

### Auditorías

- `src/pages/api/admin/auditorias/index.ts`.
- `src/pages/api/admin/auditorias/[id]/index.ts`.

También se contemplarán módulos compartidos para el guard, validaciones, servicios, auditoría, exenciones, paginación y selección segura de campos.


## Cambios Previstos en Prisma

Se incorporarán `AuditoriaAdministrativa` y `ExencionCalificacion` con los campos conceptuales aprobados.

No se agregarán fechas de actualización o eliminación, puntuación en la exención, campos de exención en otras entidades, contenido de mensajes, tokens ni hashes.


## Modelo AuditoriaAdministrativa

Incluirá `id`, `administradorId`, `accion`, `entidad`, `entidadId`, `motivo`, `metadata` opcional y `createdAt`.

El administrador se obtendrá desde el access token. Acción, entidad y metadata serán controladas por el servidor. El registro será inmutable y no se eliminará físicamente.


## Modelo ExencionCalificacion

Incluirá `id`, `donacionId`, `administradorId`, `motivo` y `createdAt`.

`donacionId` será obligatorio y único. La exención será inmutable, no tendrá puntuación ni estado y no se duplicará en Usuario, Donación, Solicitud o Calificación.


## Migración, Claves e Índices

La migración creará las tablas, claves foráneas obligatorias, `UNIQUE(ExencionCalificacion.donacionId)` y restricciones contra eliminaciones destructivas.

Se crearán índices para:

- Auditorías por administrador, acción, entidad, entidadId y fecha.
- Exenciones por donación y administrador.
- Listados administrativos y filtros aprobados.
- Resolución eficiente de sesiones, usuario y rol.

El SQL generado y cualquier ajuste PostgreSQL se revisarán antes de aplicar la migración.


## Guard Administrativo y Claim sid

El guard validará criptográficamente el access token, su expiración y la existencia de `sub` y `sid`. Después consultará la Sesión identificada por `sid` y comprobará:

- Coincidencia entre `Sesion.usuarioId` y `sub`.
- Sesión existente, no revocada y no expirada.
- Usuario existente y activo.
- Rol actual almacenado en la base de datos igual a `ADMIN`.

No se confiará únicamente en el rol incluido en el token ni en identificadores administrativos enviados por el cliente.


## Consulta Eficiente de Sesión, Usuario y Rol

El guard resolverá sesión, usuario y rol mediante una sola consulta eficiente que seleccione únicamente `Sesion.id`, `usuarioId`, `expiresAt`, `revokedAt`, `Usuario.id`, `Usuario.activo` y `Rol.codigo`.

No devolverá estructuras Prisma completas.


## Listado y Detalle de Usuarios

El listado aplicará paginación, filtros por activo, rol y ciudad, y la representación resumida aprobada. El detalle realizará consultas agrupadas para construir resúmenes de sesiones, donaciones, solicitudes y calificaciones sin N+1.

Los datos personales se seleccionarán únicamente en el detalle administrativo.


## Desactivación y Reactivación

La desactivación comprobará que el actor no sea el usuario objetivo y que, si el objetivo es `ADMIN`, permanezca otro administrador activo.

En una transacción cambiará la cuenta a inactiva, revocará sesiones, retirará donaciones `PUBLICADA`, cancelará solicitudes pendientes según sus causas y registrará la auditoría.

La reactivación cambiará únicamente `Usuario.activo = true`, registrará la auditoría y no restaurará sesiones, tokens ni estados históricos.


## Revocación de Sesiones

El servicio revocará todas las sesiones activas del usuario, contará las filas afectadas y registrará la auditoría en la misma transacción cuando exista una mutación real.

Si no existen sesiones activas responderá idempotentemente con cantidad cero.


## Protección del Último ADMIN

La desactivación de un administrador comprobará dentro de la transacción cuántos administradores activos permanecerían. Una operación que deje al sistema sin administradores activos responderá `409`.

Las actualizaciones condicionales protegerán frente a dos desactivaciones simultáneas.


## Supervisión de Donaciones

Los servicios de listado y detalle utilizarán filtros por estado, ciudad, categoría y propietario. El detalle seleccionará relaciones resumidas, confirmaciones, participantes activos, solicitud aceptada, chat, calificación y resolución previa.


## Resolución RESERVADA a RETIRADA

El servicio aceptará exclusivamente `resolucion = RETIRAR`. Comprobará que la donación esté `RESERVADA`, tenga una solicitud aceptada válida y que el propietario o receptor esté inactivo.

Dentro de la misma transacción:

- Cambiará la donación a `RETIRADA` y registrará `retiradaAt`.
- Conservará `solicitudAceptadaId` y la Solicitud `ACEPTADA`.
- Conservará propietario, receptor, Chat, mensajes, confirmaciones y calificación.
- Creará `AuditoriaAdministrativa`.

El chat quedará en modo solo lectura por sus reglas derivadas. No se modificará ninguna otra entidad histórica.


## Solicitudes

El listado y detalle aplicarán los filtros aprobados y seleccionarán estados, causas, fechas, donación, participantes, solicitud aceptada y existencia de chat.

No existirán servicios administrativos para cambiar estados de Solicitud.


## Metadatos de Chat

Los servicios consultarán únicamente metadatos del chat, participantes resumidos, estado activo, fechas y cantidad total de mensajes.

La selección de Prisma excluirá técnicamente `contenido` y no cargará la colección de mensajes. Ninguna ruta administrativa devolverá o enviará mensajes.


## Calificaciones

El listado y detalle aplicarán filtros por puntuación, propietario, receptor y donación. Autor y calificado se derivarán mediante Donación y Solicitud aceptada.

No existirán servicios para crear, editar o eliminar puntuaciones.


## Creación de ExencionCalificacion

El servicio comprobará una donación `ENTREGADA`, solicitud `ACEPTADA`, ausencia de Calificación y existencia real de una pendiente.

Creará la Exención y su Auditoría en la misma transacción. La restricción única impedirá duplicados; una exención existente se devolverá idempotentemente.


## Integración con Pendientes de 009

La documentación de 009 ya considera pendiente únicamente una donación `ENTREGADA` sin Calificación y sin `ExencionCalificacion`.

Permanece pendiente implementar la relación, consulta, índices y pruebas correspondientes.


## Estado de las Integraciones Transversales

### Sincronización documental completada

- `sid` en 002.
- Desactivación administrativa en 003.
- `solicitudAceptadaId` y `RESERVADA -> RETIRADA` en 006.
- Bloqueo y exenciones en 007.
- Conservación y privacidad administrativa de Chat en 008.
- Exclusión de exenciones en pendientes de 009.

### Implementación pendiente

- Emisión de `sid`.
- Validación de Sesión en guards.
- Modelos Prisma y migraciones.
- Relaciones e índices.
- Transición administrativa.
- Coordinación de desactivación.
- Bloqueo de solicitudes.
- Consulta de exenciones.
- Pruebas transversales.

La falta de implementación no representa una contradicción documental.


## Auditoría Atómica

Toda mutación sensible y su auditoría se ejecutarán en una sola transacción. Si la mutación falla no persistirá la auditoría, y la mutación no podrá confirmarse sin su registro correspondiente.

La metadata será generada y sanitizada por el servidor.


## Validación del Motivo

Zod exigirá un string con `trim`, mínimo 10 y máximo 500 caracteres, texto plano y sin campos desconocidos. Los servicios impedirán registrar credenciales, secretos o contenido completo de mensajes.


## Idempotencia

Los servicios distinguirán entre repetición compatible y resolución incompatible. Una repetición sin mutación devolverá `200`, no modificará fechas y no generará auditoría duplicada. Una resolución incompatible responderá `409`.


## Paginación y Filtros

Los listados usarán `page = 1`, `limit = 20`, máximo `100`, orden `createdAt DESC, id DESC` y los filtros aprobados para cada entidad. No se implementará búsqueda textual.


## Campos Públicos y Privacidad

Cada consulta seleccionará explícitamente los campos necesarios. Los listados excluirán datos personales; el detalle de usuario podrá incluirlos según el contrato aprobado.

Nunca se seleccionarán hashes, tokens, secretos, cuerpos de autenticación, mensajes privados, consultas SQL, stack traces ni objetos Prisma completos.


## Manejo de Errores

Todas las rutas utilizarán la feature 004. Los errores técnicos se traducirán antes de responder. Se aplicarán `401`, `403`, `404`, `405`, `409` y `500` según las reglas aprobadas, incluyendo `Allow` en respuestas `405`.


## Concurrencia

Se utilizarán actualizaciones condicionales, restricciones únicas y comprobaciones dentro de la transacción para proteger:

- Desactivaciones simultáneas del último administrador.
- Resoluciones concurrentes de una donación.
- Exenciones duplicadas.
- Revocaciones de sesiones repetidas.
- Auditorías desacopladas de su mutación.


## Pruebas

Se comprobarán con Postman, Insomnia o herramienta equivalente:

- Acceso con token inválido, sesión revocada, cuenta inactiva y rol no administrativo.
- Validación de `sub`, `sid` y rol actual.
- Los 16 endpoints y sus métodos permitidos.
- Listados, detalles, filtros, paginación y privacidad.
- Desactivación, reactivación y revocación de sesiones.
- Protección del último administrador.
- Resolución administrativa válida, idempotente, incompatible y concurrente.
- Conservación de solicitud, chat, mensajes y confirmaciones.
- Ausencia de contenido de mensajes en consultas administrativas.
- Exenciones válidas, duplicadas y concurrentes.
- Auditoría atómica y metadata segura.
- Validación de motivos.
- Contratos de la feature 004.
- Conservación del historial.


## Riesgos

- Escalamiento de privilegios o confianza en un rol obsoleto del token.
- Pérdida del último administrador activo.
- Suplantación mediante identificadores enviados por el cliente.
- Filtración de mensajes o datos personales.
- Estados inconsistentes entre features.
- Resoluciones o exenciones duplicadas.
- Auditorías desacopladas de la mutación.
- Eliminación accidental del historial.
- Consultas administrativas N+1 o sin límites.
- Integraciones transversales implementadas de forma parcial o inconsistente.


## Verificaciones

Antes de completar la feature se verificará:

- Modelos, migración, claves, restricciones e índices.
- Guard con `sub`, `sid`, Sesión, usuario activo y rol actual.
- Protección del último administrador.
- Funcionamiento de los 16 endpoints.
- Resolución administrativa y conservación del historial.
- Exclusión técnica del contenido de mensajes.
- Exenciones sin calificaciones ficticias.
- Auditorías atómicas e inmutables.
- Idempotencia y protección frente a concurrencia.
- Selección explícita de campos y privacidad.
- Sincronizaciones aprobadas con 002, 003, 006, 007, 008 y 009.
- Pruebas, lint y build exitosos.
- Correspondencia entre documentación e implementación.
