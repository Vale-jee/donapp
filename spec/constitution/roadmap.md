# Roadmap de DonApp

## Estado global

El backend funcional está implementado y verificado. Los `tasks.md` conservan además evidencia histórica y casos exhaustivos todavía pendientes.

## Completado con evidencia

- Entorno Next.js Pages Router, TypeScript, Prisma y PostgreSQL.
- Respuestas uniformes, errores sanitizados, request ID y logging de Auth.
- Auth, sesiones, usuarios y privacidad.
- Categorías y caché local.
- Donaciones y confirmación bilateral de entrega.
- Solicitudes, reserva atómica y concurrencia.
- Chat privado y mensajes.
- Calificaciones, reputación, pendientes y exenciones.
- Administración, resolución y auditoría.
- Suite Vitest, entorno aislado y colección Postman.
- Optimización representativa de consultas, auth consolidada y BullMQ robustecido.

La última verificación aprobó 10 pruebas unitarias y 6 de integración, además de lint, build y `git diff --check`.

## Pendiente real

- Detección de reutilización de refresh tokens mediante familia/historial persistente.
- Notificaciones reales; el worker actual solo simula procesamiento.
- Outbox transaccional para garantía fuerte PostgreSQL/Redis.
- Caché distribuida para despliegues con múltiples instancias.
- Logging estructurado homogéneo fuera de Auth y observabilidad avanzada.
- HTTPS, proxy confiable y despliegue productivo.
- Ampliación de casos negativos, privacidad y concurrencia exhaustiva.
- Recuperación de contraseña, permisos granulares, reportes y moderación avanzada.

El antiguo endpoint provisional `GET /api/usuarios` ya no existe; fue reemplazado por rutas protegidas con selección explícita.
