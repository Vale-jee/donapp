# Arquitectura y stack técnico de DonApp

## Componentes actuales

- Cliente Flutter/Dart externo y separado.
- Next.js 16 Pages Router, React 19 y TypeScript 5.
- Zod 4, `bcryptjs` y `jose`.
- PostgreSQL 16 con Prisma ORM/Client 7.8.
- Redis/ioredis y BullMQ 5.
- Vitest 4 y Postman.

Las versiones exactas están en `package.json` y `yarn.lock`.

## Capas

```text
API route -> validación -> middleware/guard -> servicio -> data access -> Prisma -> PostgreSQL
```

Las rutas adaptan HTTP; los servicios concentran reglas/transacciones; `database` selecciona datos explícitos. Los efectos no críticos pueden continuar hacia Redis/BullMQ.

## Modelo de datos

Prisma contiene `Rol`, `Usuario`, `Sesion`, `Categoria`, `Donacion`, `ImagenDonacion`, `Solicitud`, `Chat`, `Mensaje`, `Calificacion`, `ExencionCalificacion` y `AuditoriaAdministrativa`, con sus enums. Las relaciones preservan historial y las transiciones críticas usan transacciones o actualizaciones condicionales.

## Seguridad

- Access token JWT de 15 minutos por defecto con `sid`.
- Refresh token opaco de 7 días, persistido mediante hash SHA-256 y rotado.
- Contraseñas bcrypt.
- Guards validan firma, sesión, usuario activo y rol actual de PostgreSQL.
- Roles `ADMIN` y `USUARIO`, ownership derivado de la sesión.
- Rate limiting Redis por IP y protección básica por email; indisponibilidad falla cerrada.
- Request ID y logging estructurado principalmente en Auth.

No existe detección de reuse por familia/historial de refresh tokens.

## HTTP

Éxito: `{ success: true, message, data }`. Error: `{ success: false, status, message, data: null }`; `errors` es exclusivo de validación. Los `405` incluyen `Allow` y no se utiliza `422`.

## Redis, caché y BullMQ

Redis sirve al rate limiter y BullMQ. Categorías usa un `Map` local cache-aside con TTL de 60 segundos, no Redis.

BullMQ encola `donation-created` con ID `donation-created-<donationId>`, 5 intentos, backoff exponencial de 2 segundos y retención acotada. La API informa `ENQUEUED` o `PENDING_RECONCILIATION`; existe reconciliación explícita. El worker es simulado y no hay Outbox.

## Pruebas

Vitest ejecuta pruebas bajo `tests/`. La última verificación registró 10 unitarias y 6 de integración aprobadas con PostgreSQL/Redis aislados. Postman vive en `docs/postman`; los benchmarks permanecen separados.

## Variables

- `DATABASE_URL`
- `AUTH_ACCESS_TOKEN_SECRET`
- `AUTH_ACCESS_TOKEN_TTL`
- `REDIS_URL`

Los valores reales no se versionan. HTTPS, TLS y confianza del proxy pertenecen al despliegue.
