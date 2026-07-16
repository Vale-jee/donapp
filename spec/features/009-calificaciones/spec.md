# Calificaciones - Especificación

## Objetivo

Permitir que el receptor seleccionado califique al propietario de una donación después de que `Donacion.estado = ENTREGADA`, con el propósito de construir la reputación pública de los donantes y exigir que el receptor atienda todas sus calificaciones pendientes antes de crear nuevas solicitudes.


## Descripción

Esta feature administra calificaciones inmutables de uno a cinco puntos. Cada calificación corresponde a una única donación `ENTREGADA`, es creada exclusivamente por su receptor seleccionado y califica exclusivamente a su propietario.

También define cómo calcular las calificaciones pendientes y los agregados públicos de reputación sin almacenar estados, booleanos ni registros incompletos adicionales.


## Alcance

Esta feature incluye:

- Crear una calificación.
- Consultar la calificación de una donación.
- Listar las calificaciones recibidas por un usuario.
- Consultar las calificaciones pendientes del usuario autenticado.
- Calcular el promedio y el total de calificaciones recibidas.
- Definir la regla de bloqueo por calificación pendiente.
- Conservar las calificaciones como historial.
- Aplicar autenticación, autorización y privacidad.


## Fuera de Alcance

Esta feature no implementará:

- Confirmación de entrega.
- Cambios de estado en Donaciones.
- Cambios de estado en Solicitudes.
- Chat.
- Comentarios.
- Edición de calificaciones.
- Eliminación de calificaciones.
- Notificaciones.
- Caché.
- Frontend Flutter.
- Moderación administrativa.
- Resolución administrativa de bloqueos.


## Tecnologías

- Next.js 16.2.10 con Pages Router.
- TypeScript 5.9.3.
- PostgreSQL 16.
- Prisma ORM 7.8.
- Zod para validaciones.


## Actores

El autor será exclusivamente el receptor seleccionado. Se derivará mediante:

```text
Donacion.solicitudAceptadaId
-> Solicitud.solicitanteId
```

El usuario calificado será exclusivamente el propietario identificado por `Donacion.propietarioId`.

La identidad del autor se obtendrá desde el access token. La API nunca aceptará desde el cliente:

- `autorId`.
- `calificadoId`.
- `propietarioId`.
- `receptorId`.
- `solicitanteId`.

Se comprobará defensivamente que el autor y el calificado sean usuarios diferentes.


## Requisitos Funcionales

**RF-001** Crear una calificación para una donación cuyo estado sea exactamente `ENTREGADA`.

**RF-002** Consultar la calificación asociada a una donación visible para el actor.

**RF-003** Listar de forma paginada las calificaciones recibidas por un usuario activo.

**RF-004** Calcular la puntuación promedio y el total de calificaciones recibidas.

**RF-005** Consultar de forma paginada las calificaciones pendientes del usuario autenticado.

**RF-006** Impedir posteriormente la creación de nuevas solicitudes mientras exista al menos una calificación pendiente.

**RF-007** Conservar las calificaciones como historial inmutable.


## Dependencia con Donaciones y Solicitudes

Una calificación solo podrá crearse cuando:

- La donación exista.
- `Donacion.estado = ENTREGADA`.
- Exista `Donacion.solicitudAceptadaId`.
- La solicitud referenciada esté `ACEPTADA`.
- El usuario autenticado coincida con `Solicitud.solicitanteId`.
- Todavía no exista una calificación para esa donación.

Calificaciones no modificará:

- `Donacion.estado`.
- `Solicitud.estado`.
- Chat.
- Confirmaciones de entrega.

La calificación depende de `ENTREGADA`, no de la existencia, los mensajes o la actividad de un chat.


## Condición Exacta de Entrega

La condición habilitante será siempre `Donacion.estado = ENTREGADA`. Ningún otro estado permitirá crear una calificación.


## Modelo Conceptual Calificacion

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria |
| `donacionId` | Int | Obligatorio y único |
| `puntuacion` | Int | Obligatoria; entero entre 1 y 5 |
| `createdAt` | DateTime | Obligatorio; fecha de creación |

El modelo no incluirá:

- `autorId`.
- `calificadoId`.
- `comentario`.
- `updatedAt`.
- `estado`.
- `editadoAt`.
- `eliminadoAt`.

El autor y el usuario calificado se derivarán siempre desde Donación y Solicitud.


## Campos Derivados

El autor se derivará mediante `Donacion.solicitudAceptadaId -> Solicitud.solicitanteId`. El usuario calificado se derivará mediante `Donacion.propietarioId`.

Estos identificadores no se duplicarán en el modelo Calificacion.


## Puntuación y Validaciones

`puntuacion` será:

- Tipo JSON `number`.
- Obligatoria.
- Número entero.
- Mínimo `1`.
- Máximo `5`.
- Sin coerción.
- Sin redondeo.
- Sin decimales.

Se rechazarán:

- Strings como `"5"`.
- Números decimales.
- Valores menores que `1`.
- Valores mayores que `5`.
- `null`.
- Campos desconocidos.

Los identificadores de ruta, `page` y `limit` deberán ser enteros positivos. `limit` no podrá superar `100`.


## Comentarios

La primera versión no incluirá el campo `comentario`. La calificación contendrá únicamente la puntuación y no existirá texto libre, HTML, Markdown, edición ni moderación de comentarios.


## Inmutabilidad

Una calificación será inmutable. No existirán endpoints `PATCH`, `PUT` ni `DELETE`.

Los usuarios no podrán editar ni eliminar una calificación después de crearla. Las calificaciones nunca se eliminarán físicamente mediante esta feature.

La moderación o resolución excepcional pertenecerá posteriormente a la feature 010 mediante endpoints administrativos separados.


## Conservación del Historial

Todas las calificaciones se conservarán físicamente como historial. Las relaciones deberán impedir cascadas destructivas y esta feature no expondrá operaciones de eliminación.


## Reglas de Negocio

**RN-001** Solo el receptor seleccionado podrá crear la calificación.

**RN-002** El usuario calificado será el propietario de la donación.

**RN-003** Solo podrá existir una calificación por donación.

**RN-004** La donación deberá estar exactamente en estado `ENTREGADA`.

**RN-005** La solicitud seleccionada deberá estar `ACEPTADA` y coincidir con `Donacion.solicitudAceptadaId`.

**RN-006** No se permitirá la autoscalificación.

**RN-007** La creación no será idempotente; una segunda creación responderá `409 Conflict`.

**RN-008** Una calificación no modificará Donación, Solicitud ni Chat.

**RN-009** Las calificaciones serán inmutables y se conservarán como historial.

**RN-010** Un usuario con una o más calificaciones pendientes no podrá crear nuevas solicitudes hasta atenderlas todas.


## Representación Segura de Calificación

La representación conceptual será:

```json
{
  "id": 20,
  "puntuacion": 5,
  "createdAt": "2026-07-20T12:00:00.000Z",
  "donacion": {
    "id": 15,
    "titulo": "Bicicleta infantil",
    "imagenPrincipal": "/donaciones/bicicleta.jpg",
    "entregadaAt": "2026-07-19T18:00:00.000Z"
  },
  "autor": {
    "id": 8,
    "nombreVisible": "usuario.ejemplo",
    "fotoPerfil": "/perfiles/usuario.jpg"
  },
  "calificado": {
    "id": 3,
    "nombreVisible": "donante.ejemplo",
    "fotoPerfil": "/perfiles/donante.jpg"
  }
}
```

`imagenPrincipal` mantendrá el formato conceptual definido en Donaciones.

La representación nunca incluirá:

- `nombreCompleto`.
- `email`.
- `telefono`.
- `ciudad`, salvo que posteriormente sea necesaria.
- Sesiones.
- Tokens.
- Hashes.
- Datos de otras solicitudes.
- Objetos Prisma completos.
- Relaciones internas innecesarias.


## Endpoints Definitivos

La API incluirá únicamente:

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/donaciones/{id}/calificacion` | Crear una calificación |
| GET | `/api/donaciones/{id}/calificacion` | Consultar la calificación de una donación |
| GET | `/api/usuarios/{id}/calificaciones` | Listar las calificaciones recibidas por un usuario |
| GET | `/api/calificaciones/pendientes` | Consultar las pendientes del usuario autenticado |

No existirá un endpoint separado de resumen.


## Endpoints y Contratos

### POST `/api/donaciones/{id}/calificacion`

El identificador de la donación se obtendrá exclusivamente desde la ruta.

Entrada:

```json
{
  "puntuacion": 5
}
```

No aceptará:

- `donacionId` en el cuerpo.
- `autorId`.
- `calificadoId`.
- `comentario`.
- `estado`.
- Fechas.
- Campos desconocidos.

Solo el receptor seleccionado podrá realizar la operación. La respuesta exitosa será `201 Created`:

```json
{
  "success": true,
  "message": "Calificación creada correctamente.",
  "data": {
    "calificacion": {}
  }
}
```

El objeto `calificacion` utilizará la representación segura aprobada. Una segunda creación para la misma donación responderá `409 Conflict`.

### GET `/api/donaciones/{id}/calificacion`

Solo podrán consultarla:

- El receptor seleccionado.
- El propietario de la donación.
- `ADMIN` posteriormente mediante la feature 010.

Un usuario ajeno responderá `404 Not Found` con el mismo mensaje utilizado para una calificación o donación inexistente. Si todavía no existe la calificación, también responderá `404`.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Calificación consultada correctamente.",
  "data": {
    "calificacion": {}
  }
}
```

El objeto `calificacion` utilizará la representación segura aprobada.

### GET `/api/usuarios/{id}/calificaciones`

Requerirá autenticación y una cuenta activa. Podrá consultarlo cualquier usuario autenticado y activo cuando el usuario indicado también esté activo.

Un usuario inexistente o inactivo responderá `404 Not Found` con el mismo mensaje público.

Cada elemento mostrará:

- `id`.
- `puntuacion`.
- `createdAt`.
- Resumen mínimo de la donación: `id`, `titulo` e `imagenPrincipal`.
- Autor público: `id`, `nombreVisible` y `fotoPerfil`.

No repetirá el usuario calificado dentro de cada elemento.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Calificaciones consultadas correctamente.",
  "data": {
    "resumen": {
      "calificacionPromedio": null,
      "totalCalificaciones": 0
    },
    "calificaciones": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### GET `/api/calificaciones/pendientes`

Consultará exclusivamente las pendientes del usuario autenticado y no aceptará `usuarioId`.

La consulta excluirá donaciones ya calificadas y donaciones con `ExencionCalificacion`.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Calificaciones pendientes consultadas correctamente.",
  "data": {
    "tienePendientes": true,
    "totalPendientes": 2,
    "donaciones": [
      {
        "id": 15,
        "titulo": "Bicicleta infantil",
        "imagenPrincipal": "/donaciones/bicicleta.jpg",
        "entregadaAt": "2026-07-19T18:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

Cuando no existan pendientes, `tienePendientes` será `false`, `totalPendientes` será `0`, `donaciones` será `[]` y `totalPages` será `0`.


## Reputación Pública

`GET /api/usuarios/{id}/calificaciones` incluirá:

```json
{
  "resumen": {
    "calificacionPromedio": 4.5,
    "totalCalificaciones": 10
  }
}
```

Reglas:

- `calificacionPromedio` se calculará mediante una consulta agregada.
- Se redondeará a un decimal.
- Será `null` cuando no existan calificaciones.
- `totalCalificaciones` será un entero.
- Estos valores no se almacenarán como columnas de Usuario.
- No se almacenarán agregados derivados.
- No se incluirá `totalDonacionesEntregadas`.
- No se implementará caché todavía.
- Se evitarán consultas N+1.

La futura incorporación de estos campos al perfil público de la feature 003 queda como integración pendiente.


## Paginación y Orden

### Calificaciones Recibidas

`GET /api/usuarios/{id}/calificaciones` utilizará:

- `page`: valor predeterminado `1`.
- `limit`: valor predeterminado `20`; máximo `100`.

Orden:

1. `createdAt DESC`.
2. `id DESC` como desempate estable.

### Calificaciones Pendientes

`GET /api/calificaciones/pendientes` utilizará:

- `page`: valor predeterminado `1`.
- `limit`: valor predeterminado `20`; máximo `100`.

Orden:

1. `entregadaAt DESC`.
2. `id DESC` como desempate estable.

Cuando `total` sea `0`, `totalPages` será `0`.


## Regla de Calificación Pendiente

No se almacenará:

- Un estado de calificación pendiente.
- Un booleano en Usuario.
- Un booleano en Solicitud.
- Un booleano en Donación.
- Un registro incompleto de Calificación.

La condición se calculará mediante una consulta derivada. Existirá una calificación pendiente cuando:

- Exista una Donación con estado `ENTREGADA`.
- `Donacion.solicitudAceptadaId` apunte a una Solicitud.
- La Solicitud referenciada este `ACEPTADA`.
- `Solicitud.solicitanteId` coincida con el usuario.
- No exista una Calificación asociada a esa Donación.
- No exista una `ExencionCalificacion` asociada a esa Donación.

Se utilizarán índices adecuados para evitar consultas costosas.

`ExencionCalificacion` será creada únicamente por 010-administracion. No contendrá puntuación, no será una calificación, no se incluirá en `calificacionPromedio` ni `totalCalificaciones` y no alterará Donación, Solicitud o Chat.

La Exención eliminará de forma auditable únicamente la obligación pendiente de esa donación.


## Múltiples Pendientes

Un usuario podrá tener más de una calificación pendiente si varias donaciones llegaron a `ENTREGADA` antes de registrar sus calificaciones.

Para crear una nueva solicitud deberá atender o recibir exención para todas sus calificaciones pendientes. Al crear una Calificación o una `ExencionCalificacion` dejará de cumplirse la condición pendiente de esa donación, sin actualizar estados ni booleanos adicionales.


## Integración Futura con Solicitudes

Cuando se implemente la integración, `POST /api/solicitudes` comprobará, antes de crear la solicitud, si el usuario tiene al menos una calificación pendiente.

Si existe una o más pendientes responderá `409 Conflict`:

```json
{
  "success": false,
  "status": 409,
  "message": "Debes completar tus calificaciones pendientes antes de solicitar otra donación.",
  "data": null
}
```

El error no incluirá la lista de donaciones pendientes. El usuario podrá consultarla mediante `GET /api/calificaciones/pendientes`.

Esta feature no modifica todavía la documentación ni implementación de la feature 007.


## Restricciones Técnicas

- `Calificacion.donacionId` será obligatorio y `UNIQUE`.
- Existirá una clave foránea obligatoria hacia Donación.
- `puntuacion` será un entero entre `1` y `5`.
- La eliminación física estará restringida.
- Se prohibirán cascadas destructivas.
- Solo existirá una calificación por donación.
- La creación estará protegida frente a concurrencia.
- Se comprobará `Donacion.estado = ENTREGADA`.
- Se comprobará `Donacion.solicitudAceptadaId`.
- Se comprobará `Solicitud.estado = ACEPTADA`.
- Se comprobará que el actor autenticado sea el receptor.
- Se comprobará defensivamente que no exista autoscalificación.
- Las respuestas seleccionarán explícitamente campos públicos.
- Existirán índices para detectar pendientes.
- Existirán índices para listar calificaciones por propietario y fecha.

Las restricciones que Prisma no pueda representar directamente se incorporarán mediante una migración PostgreSQL revisada.


## Concurrencia

Si se reciben dos solicitudes simultáneas para calificar la misma donación:

- Solo se creará una calificación.
- `UNIQUE(donacionId)` impedirá duplicados.
- Una operación responderá `201 Created`.
- La otra responderá `409 Conflict`.

La comprobación de pendientes en `POST /api/solicitudes` se realizará lo más cerca posible de la creación para reducir carreras entre una nueva entrega, una calificación y una nueva solicitud.


## Cuentas Inactivas

Todos los endpoints requerirán que el usuario autenticado esté activo.

### Receptor Inactivo

- No podrá autenticarse.
- Su calificación permanecerá pendiente.
- Si su cuenta se reactiva, deberá registrarla antes de crear nuevas solicitudes.
- Los casos imposibles de resolver corresponderán a la feature 010.

### Propietario Inactivo

- El receptor activo sí podrá crear la calificación.
- La calificación se conservará como historial.
- No aparecerá en el listado público mientras el propietario permanezca inactivo.

### Desactivación Posterior

- La calificación no se eliminará.
- El historial se conservará.
- Si el propietario se reactiva, sus calificaciones volverán a estar disponibles según la política pública.

La feature 010 podrá crear `ExencionCalificacion` para pendientes bloqueadas. La exención no creará puntuación ni alterará entidades históricas. No se crearán calificaciones ficticias.


## Autenticación y Autorización

Todos los endpoints requerirán autenticación y una cuenta activa.


## Privacidad

Nunca se expondrán:

- `nombreCompleto`.
- `email`.
- `telefono`.
- Sesiones.
- Tokens.
- Hashes.
- Datos de solicitudes no aceptadas.
- Relaciones privadas.
- Objetos Prisma completos.
- Errores internos.

Un recurso inexistente o no visible responderá `404 Not Found` con el mismo mensaje público.

`ADMIN` no calificará mediante endpoints normales. La supervisión futura se realizará mediante endpoints administrativos separados.


## Manejo de Errores

Todas las respuestas seguirán el contrato transversal de la feature 004.

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

`errors` será opcional y se utilizará únicamente para validaciones por campo.

Los errores técnicos de Prisma, PostgreSQL, Zod y Next.js nunca se expondrán directamente.

| Código | Uso en Calificaciones |
|---|---|
| 200 | Consultas exitosas |
| 201 | Calificación creada |
| 400 | Identificador, puntuación o paginación inválidos |
| 401 | Autenticación ausente, inválida o sesión revocada |
| 403 | Operación prohibida únicamente cuando sea seguro revelar el recurso |
| 404 | Donación, calificación o usuario inexistente, inactivo o no visible |
| 405 | Método no permitido, con cabecera `Allow` |
| 409 | Calificación existente, donación visible no `ENTREGADA`, autoscalificación, bloqueo por pendiente o conflicto concurrente |
| 500 | Error interno seguro |

Casos específicos:

- Actor ajeno o donación no visible: `404`.
- Donación visible pero no `ENTREGADA`: `409`.
- Calificación ya existente: `409`.
- Autoscalificación: `409`.
- Conflicto de unicidad: `409`.


## Integraciones Futuras

### Gestión de Usuarios

Podrá incorporar `calificacionPromedio` y `totalCalificaciones` al perfil público. Los valores se calcularán y no se almacenarán. Esta feature no modifica todavía sus contratos.

### Solicitudes

Aplicará el bloqueo antes de crear nuevas solicitudes. Esta feature no modifica todavía la feature 007.

### Administración

La feature 010 podrá auditar calificaciones y crear exenciones para pendientes imposibles mediante endpoints administrativos separados. `ADMIN` no calificará como receptor. El ocultamiento lógico continuará fuera de esta versión.

### Caché

Podrá optimizar promedios y listados, pero no será fuente de verdad y no se implementará todavía.

### Notificaciones

Podrán avisar sobre calificaciones pendientes, no formarán parte de la transacción principal y no se implementarán todavía.


## Dependencias

Esta feature depende de:

- `002-autenticacion-core` para autenticar e identificar al usuario.
- `003-gestion-usuarios` para cuentas activas y perfiles públicos.
- `004-manejo-errores` para el contrato uniforme.
- `006-donaciones` para propiedad, estado `ENTREGADA` y fecha de entrega.
- `007-solicitudes` para identificar al receptor seleccionado.

No depende de la existencia ni actividad de Chat.


## Estado

Pendiente.


## Observaciones

La fuente de verdad será la relación entre Donación, Solicitud aceptada y Calificación. La unicidad por donación y las consultas derivadas evitarán duplicar estados de pendientes o agregados de reputación.
