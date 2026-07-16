# Arquitectura y Stack Técnico de DonApp

## Estado del Documento

Este documento describe decisiones técnicas transversales. Las decisiones específicas de una feature permanecen en sus archivos `spec.md`, `plan.md` y `tasks.md`.

- **Implementado actualmente:** proyecto base de Next.js con React y TypeScript, Pages Router, PostgreSQL y Prisma configurados parcialmente, cliente Prisma oficial y una migración inicial.
- **Aprobado y pendiente de implementación:** autenticación, sesiones, validaciones, contratos uniformes y los modelos funcionales definidos por las diez features.
- **Futuro:** cliente Flutter, tecnologías concretas de caché y cola, observabilidad avanzada y despliegue productivo.

Las versiones exactas instaladas están determinadas por `yarn.lock`; este documento registra las versiones aprobadas del proyecto.

## Arquitectura General

```text
Cliente móvil Flutter y Dart
  -> API REST Next.js con Pages Router
  -> Prisma ORM
  -> PostgreSQL
```

## Cliente Móvil

Flutter y Dart están aprobados para el cliente móvil futuro. Todavía no forman parte de la implementación del backend actual.

## Backend

- Next.js 16.2.10.
- React 19.2.4.
- TypeScript 5.9.3.
- Yarn 1.x.
- Exclusivamente Pages Router.
- Rutas API bajo `src/pages/api/`.

No se utilizarán App Router, `app/api` ni `route.ts`.

## Base de Datos y ORM

- PostgreSQL 16.
- Prisma ORM y `@prisma/client` 7.8.
- Migraciones revisadas antes de aplicarse.
- Claves foráneas, restricciones únicas e índices según cada feature.
- Restricciones PostgreSQL adicionales cuando Prisma no pueda expresarlas.
- Prohibición de cambios destructivos sin revisión y autorización.
- Conservación del historial y prevención de cascadas destructivas.

Prisma Studio y DBeaver son herramientas locales opcionales. No son requisitos normativos del producto.

## Separación por Capas

La API separará:

- rutas API para HTTP y adaptación de solicitudes;
- validaciones estrictas con Zod;
- servicios para reglas de negocio, autorización y transacciones;
- Prisma para persistencia;
- utilidades compartidas;
- guard de autenticación;
- guard administrativo;
- respuestas y errores uniformes.

Las rutas no contendrán reglas de negocio complejas ni devolverán directamente resultados Prisma.

## Autenticación

La autenticación aprobada utiliza email y contraseña:

- bcryptjs para almacenar y comprobar contraseñas.
- jose para emitir y validar tokens.
- Access token con duración de 15 minutos.
- Refresh token con duración de 7 días.
- Rotación del refresh token.
- Hash SHA-256 del refresh token persistido.
- Múltiples sesiones por usuario.
- Claim `sid` para identificar la Sesión.
- Validación de firma, claims, Sesión vigente y usuario activo.
- Logout de la sesión actual.
- Revocación inmediata de los access tokens asociados a una Sesión revocada.
- Reactivación de cuenta sin restaurar sesiones anteriores.

Zod, bcryptjs y jose están aprobadas, pero todavía no están instaladas.

## Roles y Autorización

Los únicos roles aprobados son:

- `ADMIN`.
- `USUARIO`.

El rol actual almacenado en la base de datos será la fuente definitiva cuando una operación requiera autorización por rol. También se comprobarán el usuario activo, la propiedad del recurso y la participación aprobada. No se permitirá suplantación mediante identificadores enviados por el cliente. La administración protegerá la propia cuenta y al último administrador activo.

## Validaciones

- Zod será la herramienta aprobada.
- Los esquemas serán estrictos y rechazarán campos desconocidos.
- Cada feature definirá su normalización y sus límites.
- No se aplicará coerción cuando no esté expresamente aprobada.
- Las reglas dependientes del estado real se comprobarán en los servicios y, cuando corresponda, dentro de la transacción.

## Contratos HTTP

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

- `errors` es opcional y exclusivo de validaciones por campo.
- DonApp no utiliza `422`; las entradas inválidas utilizan `400`.
- `405 Method Not Allowed` incluye la cabecera `Allow`.
- Los errores técnicos se traducen y sanitizan.
- `status` aparece únicamente en respuestas de error.

## Modelos Principales

Los modelos y conceptos aprobados son:

- `Rol`.
- `Usuario`.
- `Sesion`.
- `Categoria`.
- `Donacion`.
- `ImagenDonacion`.
- `Solicitud`.
- `Chat`.
- `Mensaje`.
- `Calificacion`.
- `ExencionCalificacion`.
- `AuditoriaAdministrativa`.

`Organization` y `Venue` no forman parte del diseño actual ni son módulos futuros confirmados. Su incorporación requeriría una nueva decisión documental.

La mayoría de estos modelos está aprobada documentalmente pero todavía no ha sido incorporada al schema ni migrada.

## Relaciones Transversales Importantes

- Una Donación pertenece a un Usuario propietario y a una Categoría.
- Una ImagenDonacion pertenece a una Donación.
- Una Solicitud vincula al solicitante con una Donación.
- `solicitudAceptadaId` identifica la solicitud seleccionada y permite derivar al receptor.
- Chat depende de la solicitud aceptada.
- Calificación depende de una Donación `ENTREGADA`.
- ExencionCalificacion elimina una obligación pendiente sin crear puntuación.
- AuditoriaAdministrativa registra mutaciones administrativas sensibles.

## Transacciones y Concurrencia

Se utilizarán transacciones, restricciones únicas y actualizaciones condicionales para proteger:

- aceptación de una solicitud;
- reserva de la donación;
- cancelación de solicitudes competidoras;
- segunda confirmación de entrega;
- desactivación coordinada;
- resolución administrativa;
- creación de exenciones;
- auditoría atómica de mutaciones sensibles.

Los conflictos de estado o concurrencia se traducirán a `409` cuando corresponda. Una auditoría funcional y su mutación deberán confirmarse o revertirse juntas.

## Privacidad

- Selección explícita de campos en todas las respuestas.
- Perfiles públicos mínimos según la feature propietaria.
- Prohibición de devolver objetos Prisma completos.
- Prohibición de exponer `passwordHash`, `refreshTokenHash`, tokens o secretos.
- Chat privado para sus dos participantes.
- `ADMIN` solo podrá consultar metadatos de Chat, nunca el contenido de mensajes.
- Recursos inexistentes y privados utilizarán errores que no revelen su existencia cuando corresponda.

## Logging y Observabilidad

La observabilidad inicial incluirá logs estructurados con:

- `requestId` o identificador de correlación;
- método HTTP;
- ruta;
- código de respuesta;
- duración;
- errores sanitizados.

Nunca se registrarán contraseñas, hashes, tokens, secretos, cuerpos completos de autenticación, contenido de mensajes privados ni objetos Prisma completos. Los stack traces no aparecerán en respuestas públicas.

Las métricas avanzadas y APM quedan como trabajo futuro.

## Pruebas

- Las pruebas automatizadas se organizarán posteriormente bajo `tests/`.
- El runner se seleccionará antes de implementar 002 y 004.
- No se ha aprobado todavía Jest, Vitest u otra dependencia.
- Postman será la herramienta oficial para pruebas manuales, colecciones, evidencia académica y comparaciones antes y después.
- Se cubrirán pruebas unitarias, integración, concurrencia, privacidad y contratos.
- Lint y build formarán parte de las verificaciones de cierre.
- La colección se almacenará posteriormente bajo una ruta conceptual como `docs/postman/`.

## Optimización

Las decisiones académicas iniciales son:

- Analizar el N+1 de `GET /api/donaciones` al obtener categoría, propietario público e imagen principal.
- Aplicar cache-aside al catálogo de categorías activas.
- Usar un TTL inicial de 5 minutos.
- Invalidar al crear, editar, activar o desactivar una categoría.
- Mantener PostgreSQL como fuente de verdad.
- Utilizar una queue y un worker para una notificación no crítica posterior a la aceptación de una solicitud.
- Mantener esa notificación fuera de la transacción crítica y sin revertir la aceptación ante un fallo.
- Mantener las auditorías administrativas dentro de la transacción principal, nunca en una cola.
- Justificar lazy o eager loading por endpoint.
- Validar Sesión, Usuario y Rol sin consultas redundantes.
- Comparar consultas, duración y resultado antes y después de optimizar.

Las tecnologías específicas de caché y cola permanecen pendientes de aprobación.

## Variables de Entorno

- La configuración sensible utilizará variables de entorno y validación temprana.
- `.env` permanecerá ignorado y nunca se versionará.
- Posteriormente será obligatorio un `.env.example` sin secretos reales, sincronizado con las variables utilizadas.
- No se definen aquí nombres nuevos de variables; cada feature conserva sus decisiones aprobadas.

## Despliegue

El despliegue productivo está pendiente. Durante la fase final se documentarán las variables necesarias, aplicación de migraciones, build y ejecución del sistema.

## Elementos Futuros

- Cliente Flutter y Dart.
- Tecnología concreta de caché y cola.
- Notificaciones completas.
- Recuperación de contraseña.
- Observabilidad avanzada.
- Reportes y exportaciones.
- Permisos granulares.
- Despliegue productivo.
