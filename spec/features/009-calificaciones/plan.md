# Plan de Implementación - Calificaciones

## Dependencias

La implementación dependerá de:

- `002-autenticacion-core` para autenticar e identificar al usuario mediante el access token.
- `003-gestion-usuarios` para comprobar cuentas activas y seleccionar perfiles públicos.
- `004-manejo-errores` para normalizar respuestas y traducir errores técnicos.
- `006-donaciones` para propiedad, estado `ENTREGADA` y fecha de entrega.
- `007-solicitudes` para identificar al receptor seleccionado mediante la solicitud aceptada.

Calificaciones será independiente de la existencia, los mensajes y la actividad de Chat.


## Arquitectura

La feature utilizará Next.js con Pages Router y separará:

- Rutas REST para método HTTP, autenticación, validación y respuesta.
- Esquemas Zod para identificadores, puntuación y paginación.
- Servicios para autorización, reglas de negocio, agregaciones, concurrencia y pendientes.
- Prisma para consultas y persistencia en PostgreSQL.

Las rutas no contendrán reglas de negocio ni devolverán directamente objetos completos de Prisma.


## Organización Probable de Archivos

La implementación podrá requerir:

- `src/pages/api/donaciones/[id]/calificacion.ts`, con `POST` para crear y `GET` para consultar.
- `src/pages/api/usuarios/[id]/calificaciones.ts`.
- `src/pages/api/calificaciones/pendientes.ts`.
- Módulos compartidos de validación para Calificaciones.
- Servicios de creación, consultas, reputación y pendientes.
- Utilidades de selección de campos públicos y paginación.
- `prisma/schema.prisma`.
- Una migración Prisma revisada.
- Pruebas o colecciones de Postman/Insomnia según la estructura del proyecto.

La estructura de rutas será exclusivamente la correspondiente a Pages Router.


## Cambios Previstos en Prisma

Se incorporará únicamente el modelo `Calificacion` con `id`, `donacionId`, `puntuacion` y `createdAt`.

No se agregarán `autorId`, `calificadoId`, `comentario`, `updatedAt`, estados ni campos de edición o eliminación. Tampoco se almacenarán agregados o indicadores de pendientes en Usuario, Donación o Solicitud.


## Modelo Calificacion y Relaciones

`Calificacion.donacionId` será una clave foránea obligatoria y única hacia Donación. El autor se derivará mediante `Donacion.solicitudAceptadaId -> Solicitud.solicitanteId` y el usuario calificado mediante `Donacion.propietarioId`.

Las relaciones permitirán comprobar entrega, solicitud aceptada, receptor y propietario sin duplicar identificadores en Calificacion.


## Migración

La migración creará la tabla, la clave foránea, la restricción `UNIQUE` y los índices aprobados. También incorporará una restricción para que `puntuacion` sea un entero entre 1 y 5 y evitará eliminaciones en cascada que destruyan el historial.

Las restricciones que Prisma no represente directamente se agregarán al SQL PostgreSQL y se revisarán antes de aplicar la migración.


## Restricciones e Índices

Se implementarán:

- `UNIQUE(Calificacion.donacionId)`.
- Clave foránea obligatoria hacia Donación.
- Restricción de puntuación entre 1 y 5.
- Restricción de eliminación física y cascadas destructivas.
- Índices para localizar donaciones `ENTREGADA` por solicitud aceptada y receptor.
- Índices para detectar la ausencia de calificación de una donación.
- Índices para listar calificaciones por propietario, `createdAt` e `id`.


## Estrategia para Crear una Calificación

El servicio de creación obtendrá la donación desde la ruta y el actor desde el access token. Comprobará:

- Donación existente y visible.
- `Donacion.estado = ENTREGADA`.
- Existencia de `solicitudAceptadaId`.
- Solicitud en estado `ACEPTADA`.
- Actor igual a `Solicitud.solicitanteId`.
- Actor diferente de `Donacion.propietarioId`.
- Ausencia de una calificación previa.

Después persistirá únicamente `donacionId` y `puntuacion`. Una segunda creación responderá `409`.


## Derivación y Autorización

El autor y el calificado nunca se recibirán en el cuerpo. El servicio recorrerá las relaciones aprobadas para derivarlos y comprobará defensivamente la autoscalificación.

Las consultas usarán la misma cadena de relaciones para decidir visibilidad. Un actor ajeno recibirá el mismo `404` que un recurso inexistente.


## Protección Frente a Concurrencia

La lógica del servicio realizará comprobaciones previas, pero la garantía definitiva será `UNIQUE(donacionId)` en PostgreSQL. Si dos creaciones compiten, solo una responderá `201`; el conflicto esperado se traducirá a `409`.


## Consulta por Donación

La ruta compartida atenderá `GET` seleccionando la calificación y las relaciones mínimas necesarias. Solo el receptor y el propietario podrán verla mediante endpoints normales.

La respuesta utilizará la representación segura aprobada. Una calificación inexistente o no visible producirá el mismo `404` público.


## Listado de Calificaciones Recibidas

El servicio comprobará que el usuario indicado exista y esté activo. Consultará sus donaciones calificadas con paginación y orden estable, sin repetir el usuario calificado en cada elemento.

La consulta seleccionará únicamente el resumen mínimo de Donación y el perfil público del autor.


## Cálculo de Reputación

El promedio y el total se calcularán mediante una consulta agregada. El promedio se redondeará a un decimal y será `null` cuando no existan calificaciones.

No se almacenarán agregados en Usuario ni se implementará caché. El listado y la agregación se resolverán con consultas agrupadas para evitar una consulta adicional por cada calificación y prevenir N+1.


## Consulta Derivada de Pendientes

El servicio buscará donaciones `ENTREGADA` cuya solicitud esté `ACEPTADA`, pertenezca al usuario autenticado y para las que no exista Calificación ni `ExencionCalificacion`.

No creará registros incompletos, estados ni booleanos. La consulta devolverá todas las pendientes paginadas y calculará `tienePendientes` y `totalPendientes` a partir de la fuente de verdad.

Se incorporará la relación de consulta con `ExencionCalificacion` y los índices necesarios para excluir exenciones sin provocar N+1.


## Integración Futura con Solicitudes

El servicio de creación de Solicitudes consultará, lo más cerca posible de persistir, si existe al menos una pendiente. Si existe, responderá `409` con el mensaje aprobado y no incluirá el detalle de las donaciones.

Esta integración permanecerá pendiente y no modificará todavía la feature 007.


## Múltiples Pendientes

La consulta devolverá todas las donaciones pendientes aplicando paginación y orden. El usuario deberá registrar una calificación o contar con una exención para cada una antes de crear nuevas solicitudes. Calificación y Exención retirarán la donación de la consulta derivada sin alterar sus estados.


## Cuentas Inactivas

Todos los actores autenticados deberán estar activos. Un receptor inactivo conservará su pendiente y deberá atenderla si se reactiva. Un receptor activo podrá calificar a un propietario inactivo, pero esa calificación no aparecerá en el listado público hasta su reactivación.

Los casos imposibles de resolver corresponderán a la feature 010 sin crear calificaciones ficticias.


## Conservación y Campos Públicos

No se implementarán edición ni eliminación. Las relaciones preservarán el historial.

Cada respuesta seleccionará explícitamente los campos aprobados de Calificación, Donación, autor y calificado. Nunca se devolverán perfiles completos, datos privados, otras solicitudes ni estructuras Prisma completas.


## Manejo de Errores

Las rutas utilizarán el contrato de la feature 004. Los errores técnicos de Zod, Prisma, PostgreSQL y Next.js se traducirán antes de responder.

Los recursos inexistentes o no visibles compartirán el mismo `404`; las respuestas `405` incluirán `Allow`; y los duplicados, estados incompatibles, autoscalificación o conflictos concurrentes usarán `409`.


## Pruebas

Se comprobarán con Postman, Insomnia o herramienta equivalente:

- Creación válida por el receptor seleccionado.
- Rechazo de puntuaciones inválidas, strings, decimales y campos desconocidos.
- Rechazo de donaciones fuera de `ENTREGADA`.
- Rechazo de actores ajenos y autoscalificación.
- Duplicados secuenciales y concurrentes.
- Consulta por donación según el actor.
- Listado público para usuarios activos y ocultamiento de cuentas inactivas.
- Paginación y orden estable.
- Cálculo correcto del promedio y total, incluido el caso vacío.
- Ausencia de consultas N+1.
- Detección de una o múltiples pendientes.
- Desaparición de una pendiente después de calificar.
- Desaparición de una pendiente después de una `ExencionCalificacion`.
- Exclusión de exenciones en promedio y `totalCalificaciones`.
- Tratamiento de cuentas inactivas.
- Contratos y códigos HTTP de la feature 004.
- Conservación del historial.


## Riesgos

- Calificaciones duplicadas por concurrencia.
- Manipulación del autor o del usuario calificado.
- Calificación de una donación fuera de `ENTREGADA`.
- Promedios incorrectos o consultas N+1.
- Pendientes omitidas por relaciones o índices insuficientes.
- Usuarios bloqueados por no excluir correctamente `ExencionCalificacion`.
- Exenciones incluidas por error en promedios o totales de calificaciones.
- Carrera entre entrega, calificación y creación de solicitud.
- Filtración de datos privados o recursos ajenos.
- Eliminaciones en cascada del historial.
- Bloqueos permanentes en cuentas inactivas sin intervención futura.


## Verificaciones

Antes de completar la feature se verificará:

- Correspondencia entre modelo, migración y restricciones.
- Unicidad efectiva de `Calificacion.donacionId`.
- Puntuaciones enteras exclusivamente entre 1 y 5.
- Autorización exclusiva del receptor seleccionado.
- Condición exacta `Donacion.estado = ENTREGADA`.
- Protección frente a concurrencia.
- Funcionamiento de los cuatro endpoints.
- Agregaciones correctas sin columnas derivadas ni N+1.
- Consulta correcta de todas las pendientes.
- Conservación del historial y ausencia de edición o eliminación.
- Selección explícita de campos públicos.
- Cumplimiento de la feature 004.
- Pruebas, lint y build exitosos.
- Correspondencia entre documentación e implementación.


## Integraciones No Implementadas

Esta feature no implementará todavía cambios en Gestión de Usuarios o Solicitudes, Administración, caché, notificaciones, comentarios, edición ni eliminación.
