# DonApp Backend

Backend REST para publicar donaciones, gestionar solicitudes, coordinar entregas y conservar reputación e historial administrativo. El cliente Flutter vive en un repositorio separado.

## Stack y arquitectura

- Next.js 16 Pages Router, React 19 y TypeScript.
- PostgreSQL 16 con Prisma ORM 7.8.
- Zod, `jose` y `bcryptjs`.
- Redis para rate limiting y BullMQ; la caché de categorías es local.
- Vitest y Postman para evidencia reproducible.

```text
Flutter -> API route -> validación/middleware -> servicio -> acceso a datos -> Prisma -> PostgreSQL
                                                \-> Redis/BullMQ -> worker simulado
```

Las rutas están en `src/pages/api`, validaciones y servicios en `src/lib`, guards en `src/middleware`, acceso Prisma en `database` y procesos en `scripts`.

## Módulos implementados

- Auth: registro, login, rotación, sesiones y logout.
- Usuarios: perfil propio/público, contraseña, desactivación y reputación.
- Categorías: listado, creación, detalle, edición y estado.
- Donaciones: publicación, consultas, edición, retirada y entrega bilateral.
- Solicitudes: creación, consultas, aceptación atómica, rechazo y cancelación.
- Chat y mensajes privados.
- Calificaciones, reputación, pendientes y exenciones.
- Administración de usuarios, sesiones, donaciones, solicitudes, chats, calificaciones y auditorías.
- Rate limiting, protección básica por email, request ID, pruebas, Postman y BullMQ robustecido.

## Endpoints

### Auth y usuarios

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `GET|PATCH /api/usuarios/perfil`
- `GET /api/usuarios/{id}/publico`
- `PUT /api/usuarios/password`, `PUT /api/usuarios/desactivar`
- `GET /api/usuarios/{id}/calificaciones`

### Categorías y donaciones

- `GET|POST /api/categorias`
- `GET|PATCH /api/categorias/{id}`
- `PATCH /api/categorias/{id}/estado`
- `GET|POST /api/donaciones`
- `GET /api/donaciones/mias`
- `GET|PATCH /api/donaciones/{id}`
- `PATCH /api/donaciones/{id}/estado`
- `GET /api/donaciones/{id}/solicitudes`
- `PATCH /api/donaciones/{id}/confirmacion-entrega`
- `GET|POST /api/donaciones/{id}/calificacion`

### Solicitudes, chats y pendientes

- `POST /api/solicitudes`
- `GET /api/solicitudes/enviadas`, `GET /api/solicitudes/recibidas`
- `GET /api/solicitudes/{id}`
- `PATCH /api/solicitudes/{id}/aceptar`
- `PATCH /api/solicitudes/{id}/rechazar`
- `PATCH /api/solicitudes/{id}/cancelar`
- `POST /api/solicitudes/{id}/chat`
- `GET /api/chats`, `GET /api/chats/{id}`
- `GET|POST /api/chats/{id}/mensajes`
- `GET /api/calificaciones/pendientes`

### Administración

- `GET /api/admin/usuarios`, `GET /api/admin/usuarios/{id}`
- `PATCH /api/admin/usuarios/{id}/estado`
- `POST /api/admin/usuarios/{id}/revocar-sesiones`
- `GET /api/admin/donaciones`, `GET /api/admin/donaciones/{id}`
- `POST /api/admin/donaciones/{id}/resolver`
- `GET /api/admin/solicitudes`, `GET /api/admin/solicitudes/{id}`
- `GET /api/admin/chats`, `GET /api/admin/chats/{id}`
- `GET /api/admin/calificaciones`, `GET /api/admin/calificaciones/{id}`
- `POST /api/admin/calificaciones/pendientes/{donacionId}/eximir`
- `GET /api/admin/auditorias`, `GET /api/admin/auditorias/{id}`

## Configuración y ejecución

Copie `.env.example` como `.env` y configure `DATABASE_URL`, `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_ACCESS_TOKEN_TTL` y `REDIS_URL`. No versione `.env`.

```powershell
yarn install
yarn.cmd prisma migrate deploy
yarn.cmd prisma db seed
yarn.cmd dev
```

Comandos principales:

```powershell
yarn.cmd lint
yarn.cmd build
yarn.cmd test
yarn.cmd test:unit
yarn.cmd test:integration
yarn.cmd worker:donations
yarn.cmd queue:reconcile:donations --donation-id=123
```

El worker procesa de forma simulada `donation-created`; no envía notificaciones reales. Consulte [docs/bullmq-robustness.md](docs/bullmq-robustness.md).

## Pruebas y Postman

La última verificación registró 10 pruebas unitarias y 6 de integración aprobadas (16/16): Auth, rate limiting, flujo completo, concurrencia, ADMIN y BullMQ. El conteo corresponde a esa ejecución, no es una promesa inmutable.

La integración exige servicios aislados según `.env.test.example`; consulte [docs/testing.md](docs/testing.md). Postman se importa desde:

- `docs/postman/DonApp.postman_collection.json`
- `docs/postman/DonApp.local.postman_environment.json`

Los valores versionados son ficticios o vacíos; nunca guarde secretos reales.

## Seguridad

Están implementados bcrypt, JWT, hash del refresh token, rotación, sesiones persistentes, rol actual desde PostgreSQL, ownership, rate limiting, protección básica de login, request ID y logging estructurado principalmente en Auth. El rate limiter falla cerrado si Redis no está disponible.

## Limitaciones conocidas

- No existe detección real de reutilización de refresh tokens por familia/historial.
- El worker no envía notificaciones reales.
- No existe Outbox transaccional PostgreSQL/Redis.
- La caché de categorías es local en memoria, con TTL de 60 segundos.
- HTTPS y proxy confiable dependen del despliegue.
- El logging estructurado completo está centrado principalmente en Auth.
