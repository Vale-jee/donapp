# DonApp — backend REST

DonApp permite publicar artículos para donar, solicitar donaciones de la misma ciudad y coordinar intercambios. Este repositorio contiene la API; el cliente Flutter está en el repositorio separado `donapp-frontend`.

## Tecnologías y arquitectura

Next.js 16.2.10 **Pages Router**, React 19, TypeScript 5, Prisma 7.8 con adaptador PostgreSQL, Zod 4, `jose`, `bcryptjs`, Redis/ioredis, BullMQ 5 y Vitest 4. PostgreSQL 16 es el entorno documentado; el proveedor Prisma `postgresql` no fija su versión instalada. Versiones declaradas/resueltas: `package.json` y `yarn.lock`.

```text
Flutter → src/pages/api → middleware/validaciones → servicios → database → Prisma → PostgreSQL
                                                            → Redis/BullMQ → worker simulado
```

| Carpeta | Responsabilidad |
| --- | --- |
| `src/pages/api/` | Adaptadores HTTP bajo `/api` |
| `src/middleware/` | Autenticación y guard ADMIN |
| `src/lib/` | Servicios, Zod, auth, errores, Cloudinary, caché y cola |
| `database/` | Consultas y selección explícita de campos |
| `prisma/` | Esquema, migraciones y seed |
| `generated/prisma/` | Cliente generado |
| `scripts/` | Worker, reconciliación y benchmarks |
| `tests/` | Unitarias e integración |
| `docs/`, `spec/` | Contratos, ejecución, diseño y evidencia |

## Funciones y relación con Flutter

La API implementa autenticación/sesiones, perfiles propios/públicos, cambio de contraseña, desactivación, categorías, donaciones, firma de imágenes, solicitudes, chat/mensajes, entrega bilateral, calificaciones/reputación, exenciones y administración auditada.

Flutter consume registro/login/refresh/logout, perfil editable, categorías, CRUD de donaciones, solicitudes y chat HTTP con ubicación como texto. Tiene caché de Explorar y outbox de creación; el backend no convierte todas las pantallas en offline. Entrega, calificaciones y administración no son flujos móviles terminados. Cambiar contraseña en Flutter muestra “próximamente” y no tiene un flujo móvil implementado.

## Requisitos e instalación

Node.js 24 y Yarn 1 son el entorno documentado; PostgreSQL, Redis y cuenta Cloudinary para publicar imágenes desde Flutter. Docker Desktop es opcional si los servicios se ejecutan de otra manera.

Copie `.env.example` a `.env` y configure localmente:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL |
| `AUTH_ACCESS_TOKEN_SECRET` | Secreto JWT, mínimo 32 caracteres |
| `AUTH_ACCESS_TOKEN_TTL` | Por defecto `15m`; entero positivo con `s/m/h/d`, máximo 24 h |
| `REDIS_URL` | Rate limiting/BullMQ, protocolo `redis:` o `rediss:` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Requeridas al solicitar firma de imágenes |

```powershell
yarn install
yarn.cmd prisma generate
yarn.cmd prisma migrate deploy
yarn.cmd prisma db seed
yarn.cmd dev
```

Generación del cliente y migraciones son pasos distintos. `migrate deploy` aplica migraciones existentes al destino configurado; compruebe el entorno. `migrate dev` sirve para desarrollar nuevas migraciones. El seed prepara roles y categorías, sin cuenta ADMIN con contraseña compartida.

La API local usa normalmente el puerto 3000. Flutter configura URL base sin `/api`; Android USB usa ADB reverse. La tarea conjunta está definida en `Proyecto/.vscode/tasks.json`. En `Proyecto/`, **Terminal — Run Task... — DonApp: Iniciar entorno** coordina Redis → ADB reverse → backend → Flutter. Requiere Docker Engine activo, contenedor existente `donapp-security-test-redis`, PostgreSQL disponible y Android autorizado. No inicia Docker Desktop/PostgreSQL ni worker. La tarea está fuera del repositorio y no está incluida al descargar solamente el backend.

## APIs principales

| Módulo | Operaciones |
| --- | --- |
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `/logout` |
| Usuarios | `GET/PATCH /api/usuarios/perfil`, perfil público/calificaciones; `PUT /api/usuarios/password`, `/desactivar` |
| Categorías | `GET/POST /api/categorias`, `GET/PATCH /{id}`, `PATCH /{id}/estado` |
| Donaciones | `GET/POST /api/donaciones`, `GET /mias`, `GET/PATCH/DELETE /{id}`, retirada, entrega y calificación |
| Imágenes | `POST /api/imagenes/firma`; archivo subido directamente a Cloudinary |
| Solicitudes | Crear, enviadas/recibidas, detalle, aceptar/rechazar/cancelar y habilitar chat |
| Chat | Listado/detalle y `GET/POST /api/chats/{id}/mensajes` |
| Administración | Usuarios/sesiones, donaciones/resolución, solicitudes, metadatos de chats, calificaciones/exenciones y auditorías |

El [inventario de APIs](docs/api.md) contiene todas las rutas, métodos, estados de éxito y restricciones. Éxito: `{ success: true, message, data }`; error: `{ success: false, status, message, data: null }`, con `errors` opcional por campo. Entradas inválidas usan 400, no 422; 405 incluye `Allow`.

## CRUD, ciudad e idempotencia

CREATE valida título, descripción, categoría activa y una a cinco referencias. Propietario proviene de la sesión y ciudad del perfil. Explorar devuelve `PUBLICADA` de la misma ciudad excluyendo propias; `/mias` consulta las del actor. Detalle aplica visibilidad por propiedad, publicación en la misma ciudad o receptor seleccionado según estado.

UPDATE exige propietario y `PUBLICADA`; admite título, descripción, categoría e imágenes. Flutter solo modifica los tres primeros. Si recibe `imagenes`, reemplaza referencias completas sin borrar archivos Cloudinary. El validador también acepta `clientId` en PATCH por derivarse de CREATE, aunque el servicio no lo actualiza: limitación en [APIs](docs/api.md).

DELETE exige propietario, `PUBLICADA` y ausencia de solicitudes de **cualquier estado**, solicitud aceptada, calificación, exención y auditoría de entidad `DONACION`. En una transacción bloquea la fila con `FOR UPDATE`, elimina `ImagenDonacion` y después `Donacion`. No borra solicitudes, chats, mensajes, calificaciones, exenciones, auditorías ni archivos Cloudinary. Retirada lógica conserva la publicación y cancela pendientes. DELETE responde 200 con `data: { id }`; ajena/inexistente 404, impedimentos de estado/historial 409. Edición/eliminación móvil son online.

`POST /api/donaciones` acepta UUID `clientId` opcional y deduplica mediante `UNIQUE(propietarioId, clientId)`. Devuelve la misma fila incluso ante carrera de unicidad; responde 201 también en repetición. No compara ni reemplaza el payload repetido. `operationId` local y request ID HTTP son distintos.

## Base de datos y optimizaciones

El [modelo de datos](docs/data-model.md) describe los doce modelos de `prisma/schema.prisma`: Usuario, Rol, Sesion, Categoria, Donacion, ImagenDonacion, Solicitud, Chat, Mensaje, Calificacion, ExencionCalificacion y AuditoriaAdministrativa. Las FK usan `onDelete: Restrict`; estados, índices y restricciones SQL protegen historial. Auditoría identifica entidades por texto, sin FK al recurso.

Listados paginados usan `skip/take`, conteos y selección limitada; donaciones selecciona una imagen principal y su cantidad. Categorías activas tiene caché en memoria por proceso de 60 s, invalidada al mutar; no es Redis distribuido y el catálogo no se pagina. Hay índices PostgreSQL y transacciones/actualizaciones condicionales. Benchmarks no prueban una mejora universal ni índices aplicados en una base concreta.

BullMQ encola `donation-created` después del commit con ID determinista, cinco intentos y backoff exponencial base 2 s. Inicie aparte `yarn.cmd worker:donations`. El worker simula procesamiento: no envía push/notificaciones reales. Un fallo conocido de enqueue devuelve `PENDING_RECONCILIATION`; hay reconciliación explícita por ID, sin outbox transaccional PostgreSQL/Redis. Consulte [BullMQ](docs/bullmq-robustness.md).

## Pruebas y despliegue

```powershell
yarn.cmd lint
yarn.cmd test:unit
yarn.cmd build
yarn.cmd start
```

`yarn.cmd test` equivale a unitarias. Integración HTTP/BD/Redis usa el [entorno aislado](docs/testing.md), crea/limpia fixtures y no debe apuntar a datos habituales. Postman: `docs/postman/DonApp.postman_collection.json` y `docs/postman/DonApp.local.postman_environment.json`.

`start` requiere build previo. Despliegue necesita variables del servidor, PostgreSQL, Redis, HTTPS/proxy y worker separado si se utiliza. No hay infraestructura que certifique un despliegue productivo completo.

## Seguridad y limitaciones

Bcrypt, JWT con `sid`, refresh opaco con hash SHA-256/rotación y sesiones persistentes. Guards comprueban sesión, usuario activo y rol actual en PostgreSQL. Límites Redis se aplican en Auth e imágenes según sus handlers y fallan cerrados si Redis no responde. Request ID/logging estructurado existen, con instrumentación principalmente en Auth/imágenes; no se generalizan a todos los endpoints.

ADMIN consulta metadatos de chats, sin mensajes privados mediante las APIs administrativas. Errores técnicos se sanitizan. No versione `.env`, secretos, tokens, credenciales ni claves privadas; exportaciones Postman deben mantener valores vacíos/ficticios.

No hay detección de reutilización de refresh por familia/historial, push real, WebSocket, mapa de donaciones ni búsqueda por distancia. HTTPS/proxy dependen del despliegue; caché de categorías es por proceso. `spec/features/` conserva especificaciones, planes y tareas históricos; el estado actual se describe en este README, `docs/api.md` y `docs/data-model.md`.
