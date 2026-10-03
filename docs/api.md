# Inventario de APIs de DonApp

Contrato actual de los handlers de `src/pages/api`, sus guards, validaciones y servicios. Las rutas entre llaves reciben identificadores; no son rutas literales. Esta tabla registra estados de éxito, no promete que cualquier petición válida pueda acceder a cualquier recurso.

| Ruta | Métodos | HTTP de éxito | Acceso |
| --- | --- | --- | --- |
| `/api/admin/auditorias/{id}` | GET | 200 | ADMIN activo |
| `/api/admin/auditorias` | GET | 200 | ADMIN activo |
| `/api/admin/calificaciones/{id}` | GET | 200 | ADMIN activo |
| `/api/admin/calificaciones` | GET | 200 | ADMIN activo |
| `/api/admin/calificaciones/pendientes/{donacionId}/eximir` | POST | 200, 201 | ADMIN activo |
| `/api/admin/chats/{id}` | GET | 200 | ADMIN activo |
| `/api/admin/chats` | GET | 200 | ADMIN activo |
| `/api/admin/donaciones/{id}` | GET | 200 | ADMIN activo |
| `/api/admin/donaciones/{id}/resolver` | POST | 200 | ADMIN activo |
| `/api/admin/donaciones` | GET | 200 | ADMIN activo |
| `/api/admin/solicitudes/{id}` | GET | 200 | ADMIN activo |
| `/api/admin/solicitudes` | GET | 200 | ADMIN activo |
| `/api/admin/usuarios/{id}/estado` | PATCH | 200 | ADMIN activo |
| `/api/admin/usuarios/{id}` | GET | 200 | ADMIN activo |
| `/api/admin/usuarios/{id}/revocar-sesiones` | POST | 200 | ADMIN activo |
| `/api/admin/usuarios` | GET | 200 | ADMIN activo |
| `/api/auth/login` | POST | 200 | Público; límites Redis |
| `/api/auth/logout` | POST | 200 | Refresh en body (sin Bearer obligatorio) |
| `/api/auth/refresh` | POST | 200 | Refresh válido; límites Redis |
| `/api/auth/register` | POST | 201 | Público; límites Redis |
| `/api/calificaciones/pendientes` | GET | 200 | Sesión activa |
| `/api/categorias/{id}/estado` | PATCH | 200 | ADMIN activo |
| `/api/categorias/{id}` | GET, PATCH | 200 | GET sin Authorization público; con Authorization ADMIN; PATCH ADMIN |
| `/api/categorias` | GET, POST | 200, 201 | GET público; POST ADMIN |
| `/api/chats/{id}` | GET | 200 | USUARIO activo y participante autorizado |
| `/api/chats/{id}/mensajes` | GET, POST | 200, 201 | USUARIO activo y participante autorizado |
| `/api/chats` | GET | 200 | USUARIO activo y participante autorizado |
| `/api/donaciones/{id}/calificacion` | GET, POST | 200, 201 | Sesión activa |
| `/api/donaciones/{id}/confirmacion-entrega` | PATCH | 200 | Sesión activa |
| `/api/donaciones/{id}/estado` | PATCH | 200 | Sesión activa |
| `/api/donaciones/{id}` | GET, PATCH, DELETE | 200 | Sesión activa |
| `/api/donaciones/{id}/solicitudes` | GET | 200 | Sesión activa |
| `/api/donaciones` | GET, POST | 200, 201 | Sesión activa |
| `/api/donaciones/mias` | GET | 200 | Sesión activa |
| `/api/imagenes/firma` | POST | 200 | Sesión activa |
| `/api/solicitudes/{id}/aceptar` | PATCH | 200 | Sesión activa |
| `/api/solicitudes/{id}/cancelar` | PATCH | 200 | Sesión activa |
| `/api/solicitudes/{id}/chat` | POST | 200, 201 | USUARIO activo y participante autorizado |
| `/api/solicitudes/{id}` | GET | 200 | Sesión activa |
| `/api/solicitudes/{id}/rechazar` | PATCH | 200 | Sesión activa |
| `/api/solicitudes/enviadas` | GET | 200 | Sesión activa |
| `/api/solicitudes` | POST | 201 | Sesión activa |
| `/api/solicitudes/recibidas` | GET | 200 | Sesión activa |
| `/api/usuarios/{id}/calificaciones` | GET | 200 | Sesión activa |
| `/api/usuarios/{id}/publico` | GET | 200 | Público; usuario objetivo activo |
| `/api/usuarios/desactivar` | PUT | 200 | Sesión activa |
| `/api/usuarios/password` | PUT | 200 | Sesión activa |
| `/api/usuarios/perfil` | GET, PATCH | 200 | Sesión activa |

## Respuestas y errores

Éxito: `{ success: true, message, data }`. Error: `{ success: false, status, message, data: null }`; `errors` opcional representa validaciones por campo. 400: entrada inválida; 401: credenciales/sesión inválidas; 403: permisos o cuenta inactiva; 404: inexistencia/no visibilidad; 405: método rechazado con `Allow`; 409: conflicto funcional/concurrente; 429: límite Redis; 500: error interno sanitizado. Si Redis falla en el rate limiter, la petición no continúa y el error técnico se traduce a 500 seguro. El backend no emite 422.

Los handlers de Auth e imágenes usan infraestructura de request ID, parseo/errores y límites según operación. No todas las rutas usan ese wrapper ni tienen rate limiting. `src/proxy.ts` agrega request ID para la API. Los códigos exactos de errores de negocio están en cada servicio; no se garantiza el mismo orden de validación/autenticación para todas las rutas.

## Contratos y restricciones principales

- Auth: registro devuelve 201 sin sesión; login devuelve tokens/usuario; refresh rota el par y logout revoca la sesión identificada por el refresh. El TTL access es configurable (15 min por defecto); refresh dura siete días. No existe detección por familia/historial de reutilización de tokens.
- Perfil: GET/PATCH no recibe ID de usuario. PATCH permite los campos de perfil aprobados; cambiar correo requiere `passwordActual`. PUT password exige contraseña actual y revoca sesiones. PUT desactivar conserva la cuenta/historial y coordina sesiones, publicaciones y solicitudes. El móvil aún no implementa el cambio de contraseña.
- Categorías: catálogo activo público sin paginación, caché por proceso 60 s y `X-Cache-Status`. Detalle público oculta categorías inactivas; consulta administrativa se selecciona al enviar Authorization y exige ADMIN (un Bearer USUARIO no accede por esa rama). Crear, editar y cambiar estado requieren ADMIN; no hay DELETE.
- CREATE donación: `titulo` (5–100), `descripcion` (20–1000, texto plano), `categoriaId` positivo, `imagenes` (1–5 referencias distintas) y UUID `clientId` opcional. Propietario/ciudad se obtienen de la sesión/perfil, no del body/GPS. Retorna `data.donacion` y `data.procesamientoAsincrono.estado`. UUID repetido del mismo propietario devuelve la fila existente con 201, sin comparar payload.
- Lecturas: Explorar usa ciudad del perfil, PUBLICADA y excluye propias; admite `categoriaId`. `/mias` admite `estado`. Paginación de donaciones: `page=1`, `limit=20`, máximo 100; enteros positivos canónicos. Categorías no se pagina. Los filtros y formas de paginación adicionales están en los validadores de cada módulo.
- Detalle: propietario puede ver su publicación; otros ven PUBLICADA de su ciudad o la reserva/entrega para la que son receptores seleccionados. Un recurso no visible usa el mismo 404 que uno inexistente. `puedeSolicitar` deriva de reglas y no acredita propiedad.
- PATCH donación: propietario + PUBLICADA; campos parciales título/descripción/categoría/imágenes. Imágenes reemplaza toda la colección de referencias en transacción; Flutter no las edita. `updateDonationSchema` deriva de CREATE parcial y acepta `clientId`, pero el servicio lo ignora: enviarlo solo puede responder 200 sin cambiar ese dato. No se presenta ese campo como editable.
- DELETE donación: propietario + PUBLICADA; cualquier solicitud, solicitud aceptada, calificación, exención o auditoría DONACION impide eliminar. Bloqueo de fila, `imagenDonacion.deleteMany` y `donacion.delete` en transacción. Éxito 200 `data: {id}`; ID fuera de rango Int PostgreSQL 400; estado/historial 409; inexistente/ajena 404. No borra otros historiales ni archivos de Cloudinary.
- Retirar: PATCH estado recibe `{estado: "RETIRADA"}`; conserva publicación/historial y cancela solicitudes pendientes. Entrega: PATCH confirmacion-entrega recibe `{}` y requiere propietario o receptor seleccionado; las dos confirmaciones hacen ENTREGADA, con repetición idempotente.
- Imágenes: POST firma requiere sesión activa y configuración Cloudinary; devuelve URL HTTPS, apiKey, timestamp, firma, folder y allowedFormats. Flutter sube multipart directamente a Cloudinary sin Bearer DonApp. La API guarda referencias, no binarios; no hay endpoint de borrado físico Cloudinary.
- Solicitudes: POST recibe `donacionId`; identidad es la sesión. Requiere donación elegible de la misma ciudad, no propia, sin solicitud activa duplicada ni calificaciones pendientes. Aceptar/rechazar exige propietario; cancelar exige solicitante y estado permitido. Aceptar reserva atómicamente y cancela otras pendientes, conservando historial.
- Chat: habilitación idempotente de solicitud aceptada seleccionada; 201 al crear/200 si ya existe. Mensajes reciben `contenido` (1–1000); sender deriva de sesión. Solo participantes USUARIO acceden al contenido. Enviar requiere reserva consistente y participantes activos; estados finales permiten consulta histórica sin nuevos mensajes. Listados/mensajes están paginados; no hay WebSocket, push ni polling automático del móvil.
- Calificación: una puntuación 1–5 por donación ENTREGADA, creada por receptor seleccionado; una segunda creación es 409. Autor/donante se derivan de relaciones. Las exenciones no son puntuaciones ni cuentan en reputación; las pendientes bloquean nuevas solicitudes.
- ADMIN: los listados/detalles requieren rol actual ADMIN. Mutaciones sensibles requieren motivo de 10–500 caracteres. Estado de usuario/revocación/resolución son 200; exención es 201 nueva/200 existente. Se protege último ADMIN/actor, se conservan estados históricos y se auditan mutaciones. Chat administrativo solo expone metadatos; no hay edición de mensajes ni cambio de roles.

Referencias históricas de diseño por módulo (pueden diferir del contrato actual de esta página y de los handlers): [Auth](../spec/features/002-autenticacion-core/spec.md), [Usuarios](../spec/features/003-gestion-usuarios/spec.md), [Categorías](../spec/features/005-categorias/spec.md), [Donaciones](../spec/features/006-donaciones/spec.md), [Solicitudes](../spec/features/007-solicitudes/spec.md), [Chat](../spec/features/008-chat/spec.md), [Calificaciones](../spec/features/009-calificaciones/spec.md), [Administración](../spec/features/010-administracion/spec.md).

La colección Postman existente sirve como ejemplos de flujos. Su inventario no es exhaustivo: el contrato actualizado es esta tabla y los handlers, no una cifra histórica de rutas.
