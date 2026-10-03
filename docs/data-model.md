# Modelo de datos actual

Modelo definido en `prisma/schema.prisma`. El proveedor es PostgreSQL; el cliente se genera en `generated/prisma`. El esquema de una base en ejecución depende de las migraciones que se hayan aplicado.

| Modelo | Identidad, relaciones y restricciones |
| --- | --- |
| Rol | ID entero; `codigo` ADMIN/USUARIO y `nombre` únicos; un rol tiene usuarios |
| Usuario | ID entero, nombreCompleto, nombreVisible único, email único, passwordHash, ciudad, teléfono/foto opcionales, activo, rolId y timestamps; posee sesiones/donaciones, crea solicitudes/mensajes y administra exenciones/auditorías |
| Sesion | UUID; usuarioId, refreshTokenHash único, expiresAt, revokedAt nullable y timestamps; no guarda refresh en texto plano |
| Categoria | ID entero, nombre único, descripción opcional, activo y timestamps; agrupa donaciones |
| Donacion | ID entero, clientId UUID nullable, título/descripción/ciudad/estado, propietarioId/categoriaId; UNIQUE(propietarioId, clientId); solicitudAceptadaId nullable único; fechas de confirmación bilateral/entrega/retirada y timestamps |
| ImagenDonacion | ID entero, donacionId, referencia y orden; UNIQUE(donacionId, orden); almacena referencia, no archivo binario |
| Solicitud | ID entero, donacionId/solicitanteId, estado, causaCancelacion nullable, fechas de cambios y timestamps; tiene chat opcional y puede ser seleccionada en Donacion |
| Chat | ID entero, solicitudId único, ultimoMensajeAt nullable y timestamps; participantes/donación se derivan de Solicitud, sin receptorId/propietarioId duplicados |
| Mensaje | ID entero, chatId/remitenteId, contenido hasta 1000 y createdAt; no tiene updatedAt, lectura ni adjuntos |
| Calificacion | ID entero, donacionId único, puntuacion y createdAt; autor y donante se derivan de la solicitud aceptada y el propietario, sin comentario ni edición |
| ExencionCalificacion | ID entero, donacionId único, administradorId, motivo hasta 500 y createdAt; no tiene puntuación ni estado; elimina la obligación derivada, no crea reputación |
| AuditoriaAdministrativa | ID entero, administradorId, acción enum, entidad/entidadId de texto, motivo hasta 500, metadata JSON nullable y createdAt; sin FK al recurso auditado ni updatedAt |

## Estados y relaciones

Donación: PUBLICADA, RESERVADA, ENTREGADA, RETIRADA. Solicitud: PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA. Causas de cancelación: VOLUNTARIA, OTRA_SOLICITUD_ACEPTADA, DONACION_RETIRADA, USUARIO_INACTIVO. Las cinco acciones administrativas son USUARIO_DESACTIVADO, USUARIO_REACTIVADO, SESIONES_REVOCADAS, DONACION_RESERVADA_RETIRADA y CALIFICACION_PENDIENTE_EXIMIDA.

Donacion → Usuario/Categoria/Solicitud aceptada; Solicitud → Donacion/Usuario; Chat → Solicitud; Mensaje → Chat/Usuario; ImagenDonacion/Calificacion/ExencionCalificacion → Donacion; exención y auditoría → administrador Usuario. Todas las FK declaradas usan `onDelete: Restrict` y `onUpdate: Cascade`, sin cascadas de borrado de historial.

El servicio DELETE elimina explícitamente imágenes relacionadas y después una PUBLICADA elegible en la misma transacción. Impide cualquier solicitud y relaciones/historial restrictivos, incluyendo auditoría por entidad/entidadId. No toca Chat/Mensaje ni Cloudinary.

## Índices y SQL adicional

El esquema incluye índices compuestos para estado/ciudad/categoría/propietario y orden de donaciones, solicitante/donación/estado/fechas de solicitudes, chat/fechas de mensajes, fechas de chats, sesiones vigentes y auditorías por actor/acción/entidad. Las restricciones únicas evitan duplicar sesión/hash, imagen/orden, chat/solicitud, calificación/exención por donación y creación por propietario/clientId.

Las migraciones versionadas incluyen restricciones PostgreSQL que complementan Prisma (normalización/unicidad y checks de negocio). Deben inspeccionarse junto al schema; su existencia en Git no prueba su aplicación en una base concreta. El índice `UNIQUE(propietarioId, clientId)` permite registros históricos con clientId NULL.

La base móvil Drift/SQLCipher es distinta de PostgreSQL y no replica todo este modelo. Consulte el README del frontend para caché, outbox y funciones online.
