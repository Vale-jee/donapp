# Roadmap de DonApp

## Estado Global

- **Documentación completada:** las diez features disponen de `spec.md`, `plan.md` y `tasks.md`; su diseño está aprobado y sincronizado.
- **Implementación pendiente:** la mayor parte de las funcionalidades todavía no está implementada.
- **En verificación:** existe infraestructura parcial de Next.js, PostgreSQL y Prisma, junto con una migración inicial.
- **Pruebas pendientes:** no existe todavía una suite automatizada ni una colección oficial de Postman.
- **Revisión necesaria:** existe código provisional que debe compararse con las features antes de conservarlo, reemplazarlo o retirarlo.

Los estados de implementación solo cambiarán a **Completado con evidencia** cuando existan verificaciones reproducibles. Las demás fases podrán figurar como **Implementación pendiente**, **En verificación** o **Bloqueado por dependencia**.

### Riesgo Inmediato

El endpoint provisional `GET /api/usuarios` debe retirarse, protegerse o reemplazarse antes de cualquier demostración o despliegue. Actualmente no tiene autenticación, devuelve objetos Prisma completos, podría exponer `passwordHash` y no cumple el contrato de `004-manejo-errores`.

## Fase 0 - Preparación y Seguridad Inicial

**Estado:** En verificación.

- Revisar el estado de Git y disponer de un respaldo verificable.
- Verificar las variables de entorno sin exponer secretos.
- Preparar posteriormente `.env.example` con ejemplos seguros.
- Verificar la conexión con PostgreSQL y la configuración de Prisma.
- Revisar la migración inicial y el estado real de la base de datos.
- Retirar endpoints de ejemplo.
- Resolver el endpoint inseguro `GET /api/usuarios`.
- Elegir el runner de pruebas antes de implementar 002 y 004.
- Preparar posteriormente la estructura `tests/`.
- Preparar posteriormente la colección oficial bajo una ruta conceptual como `docs/postman/`.
- Obtener una línea base reproducible de lint y build.

## Fase 1 - Infraestructura Transversal

**Estado:** Implementación pendiente.

- Cerrar `001-entorno` con evidencia.
- Implementar `004-manejo-errores`.
- Centralizar respuestas uniformes y errores sanitizados.
- Incorporar validaciones y utilidades compartidas para métodos permitidos.
- Incorporar logs seguros y un `requestId` o identificador de correlación.
- Establecer pruebas base de infraestructura y contratos.

## Fase 2 - Autenticación Core

**Estado:** Bloqueado por la infraestructura transversal necesaria.

- Implementar `002-autenticacion-core`.
- Completar los modelos `Rol`, `Usuario` y `Sesion`.
- Implementar autenticación por email y contraseña con bcryptjs.
- Emitir access tokens y refresh tokens mediante jose.
- Implementar rotación, `sid`, guards y múltiples sesiones.
- Validar la Sesión en solicitudes autenticadas.
- Implementar revocación inmediata y logout de la sesión actual.

## Fase 3 - Gestión de Usuarios Base

**Estado:** Bloqueado por 002.

- Implementar `003-gestion-usuarios`.
- Consultar y actualizar el perfil propio.
- Exponer el perfil público mínimo.
- Cambiar la contraseña y revocar sesiones.
- Desactivar la cuenta propia.
- Aplicar las reglas de privacidad aprobadas.

Los efectos completos de la desactivación sobre Donaciones y Solicitudes se cerrarán durante la integración transversal, cuando existan 006 y 007.

## Fase 4 - Categorías

**Estado:** Bloqueado por 002 y 004.

- Implementar `005-categorias`.
- Crear el modelo, migración, seed idempotente, validaciones y endpoints aprobados.
- Proteger las operaciones administrativas y conservar las categorías históricas.

## Fase 5 - Donaciones

**Estado:** Bloqueado por 003, 004 y 005.

- Implementar `006-donaciones`.
- Incorporar `Donacion` e `ImagenDonacion`.
- Implementar publicación, consultas, actualización, retirada y confirmación de entrega.
- Preparar `solicitudAceptadaId` para la integración aprobada con Solicitudes.

## Fase 6 - Solicitudes

**Estado:** Bloqueado por 006.

- Implementar `007-solicitudes`.
- Crear y consultar solicitudes conservando su historial.
- Implementar aceptación atómica, reserva de la donación y asignación de `solicitudAceptadaId`.
- Cancelar las demás solicitudes pendientes en la misma operación.
- Proteger las transiciones frente a concurrencia.

## Fase 7 - Chat

**Estado:** Bloqueado por 007.

- Implementar `008-chat`.
- Crear el chat diferido e idempotente después de una solicitud aceptada.
- Implementar mensajes privados e inmutables.
- Conservar el historial y aplicar modo de solo lectura cuando corresponda.

## Fase 8 - Calificaciones

**Estado:** Bloqueado por 006 y 007.

- Implementar `009-calificaciones`.
- Permitir una calificación por donación entregada.
- Calcular la reputación derivada.
- Exponer las obligaciones pendientes.
- Bloquear nuevas solicitudes mientras existan pendientes no atendidas ni eximidas.

## Fase 9 - Administración

**Estado:** Bloqueado por las features funcionales anteriores.

- Implementar `010-administracion`.
- Incorporar `AuditoriaAdministrativa` y `ExencionCalificacion`.
- Implementar el guard administrativo y proteger al último `ADMIN` activo.
- Resolver excepcionalmente `RESERVADA -> RETIRADA` conservando el historial.
- Limitar el acceso administrativo de Chat a metadatos.
- Mantener las mutaciones sensibles y sus auditorías en una sola transacción.

## Fase 10 - Integración Transversal

**Estado:** Bloqueado por dependencias.

- Completar la desactivación coordinada de cuentas.
- Integrar el bloqueo de Solicitudes por calificaciones pendientes.
- Integrar las exenciones administrativas.
- Verificar la conservación y privacidad de Chat.
- Verificar la resolución administrativa y sus auditorías.
- Ejecutar pruebas de concurrencia, privacidad y flujos integrales.

## Fase 11 - Optimización técnica y rendimiento

**Estado:** Implementación pendiente.

### Medición Inicial

- Medir cantidad de consultas y duración.
- Registrar las condiciones de cada prueba.
- Obtener evidencia reproducible mediante Postman.
- Conservar la respuesta funcional utilizada como línea base.

### Corrección de N+1

El caso inicial será `GET /api/donaciones`, especialmente al obtener:

- categoría;
- propietario público;
- imagen principal.

Se compararán el número de consultas, la duración y el resultado antes y después de optimizar.

### Cache-aside

El caso inicial será el catálogo de categorías activas:

- PostgreSQL continuará como fuente de verdad.
- TTL inicial: 5 minutos.
- Invalidación al crear, editar, activar o desactivar una categoría.
- La tecnología de caché requiere aprobación posterior.

### Queue y Worker

La extensión académica candidata será una notificación no crítica después de aceptar una solicitud:

- se ejecutará fuera de la transacción principal;
- utilizará reintentos controlados;
- un fallo no revertirá la Solicitud `ACEPTADA` ni la reserva;
- la tecnología de cola requiere aprobación posterior.

Las auditorías administrativas funcionales permanecerán atómicas y nunca se enviarán a una cola.

### Lazy y Eager Loading

Cada endpoint deberá justificar qué relaciones carga, evitando consultas repetidas y datos innecesarios.

### Autenticación Optimizada

La validación de `Sesion`, `Usuario` y `Rol` se resolverá mediante una consulta eficiente y selecciones explícitas, evitando consultas redundantes.

### Evidencias

- Colección Postman.
- Capturas y condiciones de prueba.
- Consultas y tiempos medidos.
- Tabla comparativa antes y después.
- Explicación técnica.
- Video académico.
- Repositorio actualizado.

## Fase 12 - Cierre

**Estado:** Bloqueado por las fases anteriores.

- Ejecutar pruebas completas, lint y build.
- Verificar migraciones, restricciones e índices.
- Actualizar la documentación con evidencia.
- Preparar la guía de despliegue con variables, migraciones, build y ejecución.
- Consolidar la evidencia académica.
- Ejecutar una revisión final de seguridad.
- Cerrar el backend únicamente con evidencia reproducible.

## Trabajo Futuro

- Cliente móvil Flutter y Dart.
- Notificaciones completas.
- Recuperación de contraseña.
- Permisos granulares.
- Reportes y exportaciones.
- Moderación avanzada y detección de fraude.
- Observabilidad avanzada.
- Despliegue productivo.
- Herramientas de soporte.
