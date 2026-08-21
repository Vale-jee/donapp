# Solicitudes - Especificacion

## Objetivo

Administrar exclusivamente el ciclo de vida de las solicitudes asociadas a donaciones en DonApp.

Esta feature permite crear solicitudes, consultar solicitudes enviadas y recibidas, consultar solicitudes por donacion, consultar su detalle, aceptar, rechazar, cancelar, conservar el historial y coordinar la transicion `PUBLICADA -> RESERVADA` de una donacion.


## Descripcion

Este modulo permite que un usuario autenticado solicite una donacion publicada por otro usuario. El propietario podra revisar las solicitudes recibidas y seleccionar a la persona que recibira el articulo.

La aceptacion identificara al receptor, reservara la donacion y cancelara las demas solicitudes pendientes dentro de una sola operacion atomica.


## Alcance

Esta feature define:

- La creacion de solicitudes.
- La consulta de solicitudes enviadas.
- La consulta de solicitudes recibidas.
- La consulta de solicitudes asociadas a una donacion propia.
- La consulta individual segun la visibilidad del actor.
- La aceptacion y seleccion del receptor.
- El rechazo por el propietario.
- La cancelacion voluntaria por el solicitante.
- Las cancelaciones automaticas coordinadas con Donaciones y cuentas inactivas.
- Los estados, causas de cancelacion e historial.
- La transicion atomica `PUBLICADA -> RESERVADA`.
- Los contratos REST, validaciones, privacidad y restricciones de Solicitudes.


## Fuera de Alcance

No pertenecen a esta feature:

- La creacion o edicion de donaciones.
- La retirada de donaciones.
- El modelo y la mensajeria de Chat.
- Las calificaciones.
- La administracion global.
- Las notificaciones push, correo electronico u otros mecanismos externos.
- El frontend Flutter.


## Tecnologias

- Next.js 16.2.10.
- TypeScript 5.9.3.
- PostgreSQL 16.x.
- Prisma ORM 7.8.0.
- Zod para validaciones.


## Requisitos Funcionales

**RF-001** Crear una solicitud para una donacion `PUBLICADA`, visible y perteneciente a la misma ciudad del solicitante.

**RF-002** Consultar de forma paginada las solicitudes enviadas por el usuario autenticado.

**RF-003** Consultar de forma paginada las solicitudes recibidas en las donaciones del propietario autenticado.

**RF-004** Consultar de forma paginada las solicitudes de una donacion propia.

**RF-005** Consultar el detalle de una solicitud visible para el actor.

**RF-006** Permitir al propietario aceptar una solicitud pendiente.

**RF-007** Permitir al propietario rechazar una solicitud pendiente.

**RF-008** Permitir al solicitante cancelar voluntariamente su solicitud pendiente.

**RF-009** Cancelar automaticamente las demas solicitudes pendientes cuando una sea aceptada.

**RF-010** Conservar todas las solicitudes y sus transiciones como historial.


## Estados de Solicitud

Los estados oficiales seran:

- `PENDIENTE`.
- `ACEPTADA`.
- `RECHAZADA`.
- `CANCELADA`.


## Flujo de Estados

Transiciones permitidas:

```text
PENDIENTE -> ACEPTADA
PENDIENTE -> RECHAZADA
PENDIENTE -> CANCELADA
```

`ACEPTADA`, `RECHAZADA` y `CANCELADA` son estados finales e irreversibles. No se permitira volver a `PENDIENTE` ni ejecutar una transicion diferente desde un estado final.


## Causas de Cancelacion

Las causas oficiales seran:

- `VOLUNTARIA`: cancelacion realizada por el solicitante.
- `OTRA_SOLICITUD_ACEPTADA`: otra solicitud fue seleccionada.
- `DONACION_RETIRADA`: la publicacion fue retirada.
- `USUARIO_INACTIVO`: el solicitante fue desactivado.

El cliente nunca enviara `causaCancelacion`. El servidor la asignara automaticamente.

`causaCancelacion` sera obligatoria unicamente cuando el estado sea `CANCELADA` y sera `null` en `PENDIENTE`, `ACEPTADA` y `RECHAZADA`.


## Reglas de Negocio

**RN-001** Solo usuarios autenticados y activos podran crear o administrar solicitudes mediante los endpoints normales.

**RN-002** El solicitante se obtendra exclusivamente desde el access token.

**RN-003** La API no aceptara identificadores de solicitante, propietario o receptor enviados por el cliente.

**RN-004** Un usuario no podra solicitar una donacion propia.

**RN-005** Solo se podra solicitar una donacion existente, visible y `PUBLICADA`.

**RN-006** `Donacion.ciudad` debera coincidir con la ciudad actual del perfil del solicitante al crear la solicitud.

**RN-007** Un cambio posterior de ciudad no cancelara ni invalidara una solicitud existente.

**RN-008** No podra existir mas de una solicitud `PENDIENTE` o `ACEPTADA` del mismo usuario para la misma donacion.

**RN-009** Una solicitud anterior `RECHAZADA` o `CANCELADA` permitira crear otra mientras la donacion siga `PUBLICADA`.

**RN-010** Una solicitud anterior `ACEPTADA` impedira volver a solicitar la misma donacion.

**RN-011** Solo el propietario de la donacion podra aceptar o rechazar solicitudes recibidas.

**RN-012** Solo el solicitante podra cancelar voluntariamente su solicitud pendiente.

**RN-013** Solo una solicitud podra quedar `ACEPTADA` por donacion.

**RN-014** Rechazar una solicitud no modificara la donacion ni otras solicitudes.

**RN-015** Las solicitudes nunca se eliminaran fisicamente.

**RN-016** La aceptacion y la retirada conservaran todas las solicitudes como historial.

**RN-017** Una solicitud `ACEPTADA` habilitara la creacion posterior de un chat por la feature 008, pero esta feature no creara el modelo Chat.

**RN-018** Antes de crear una solicitud se comprobara que el usuario no tenga calificaciones pendientes derivadas.

**RN-019** Una donacion `ENTREGADA` sera pendiente cuando el usuario sea su receptor seleccionado y no exista `Calificacion` ni `ExencionCalificacion` para ella.

**RN-020** Todas las pendientes deberan calificarse o eximirse antes de crear una nueva solicitud.


## Idempotencia

Repetir exactamente la misma accion autorizada sobre el mismo estado final respondera `200 OK` sin modificar fechas ni historial nuevamente:

- Aceptar una solicitud ya `ACEPTADA` como propietario.
- Rechazar una solicitud ya `RECHAZADA` como propietario.
- Cancelar una solicitud ya `CANCELADA` como solicitante.

Intentar una accion diferente sobre un estado final producira `409 Conflict`, por ejemplo:

- Aceptar una solicitud `RECHAZADA`.
- Cancelar una solicitud `ACEPTADA`.
- Rechazar una solicitud `CANCELADA`.


## Modelo Conceptual Solicitud

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria |
| `donacionId` | Int | Donacion solicitada |
| `solicitanteId` | Int | Usuario obtenido del access token |
| `estado` | Enum | Estado oficial de la solicitud |
| `causaCancelacion` | Enum? | Obligatoria solo en `CANCELADA` |
| `createdAt` | DateTime | Fecha de creacion |
| `updatedAt` | DateTime | Fecha de ultima actualizacion |
| `aceptadaAt` | DateTime? | Fecha de aceptacion |
| `rechazadaAt` | DateTime? | Fecha de rechazo |
| `canceladaAt` | DateTime? | Fecha de cancelacion |

El modelo no incluira:

- `donanteId`.
- `receptorId`.
- Mensajes.
- Comentarios.
- Datos personales copiados.


## Referencia a la Solicitud Aceptada

`Donacion` conservara conceptualmente `solicitudAceptadaId` como referencia opcional y nullable.

La referencia se establecera al aceptar una solicitud y permitira identificar directamente:

- La solicitud seleccionada.
- Al receptor mediante `Solicitud.solicitanteId`.
- La relacion que utilizara Chat.
- La relacion utilizada por la doble confirmacion de entrega.
- El origen de la calificacion futura.

No se agregara `receptorId` directamente en `Donacion`.


## Restricciones Tecnicas

- `donacionId` y `solicitanteId` tendran claves foraneas obligatorias.
- La eliminacion fisica de solicitudes estara restringida.
- Solo podra existir una solicitud `PENDIENTE` o `ACEPTADA` por combinacion `donacionId + solicitanteId`.
- Solo podra existir una solicitud `ACEPTADA` por donacion.
- `causaCancelacion` sera obligatoria en `CANCELADA` y `null` en los demas estados.
- `aceptadaAt`, `rechazadaAt` y `canceladaAt` deberan ser coherentes con el estado correspondiente.
- Las garantias se aplicaran tanto en la logica del servicio como en PostgreSQL.
- Los indices parciales o restricciones que Prisma no pueda expresar directamente se implementaran mediante una migracion PostgreSQL revisada.


## Validaciones

### Creacion

- `donacionId` sera obligatorio y debera ser un entero positivo.
- Se rechazaran campos desconocidos y campos protegidos como `solicitanteId`, `propietarioId`, `receptorId`, `estado`, `causaCancelacion` y fechas.
- La donacion debera existir, ser visible, estar `PUBLICADA`, pertenecer a la misma ciudad y no ser propiedad del solicitante.
- No podra existir otra solicitud `PENDIENTE` o `ACEPTADA` del mismo solicitante para la misma donacion.
- No podra existir una calificacion pendiente para el solicitante. La comprobacion se ejecutara lo mas cerca posible de la creacion.

### Acciones

- Los identificadores de ruta deberan ser enteros positivos.
- Aceptar y rechazar requeriran que el actor sea propietario de la donacion.
- Cancelar voluntariamente requerira que el actor sea el solicitante.
- Los cuerpos de aceptar, rechazar y cancelar seran objetos JSON vacios; se rechazaran campos desconocidos.
- Se validaran el estado actual, la transicion permitida y las reglas de idempotencia.

### Consultas

- `page` y `limit` deberan ser enteros positivos dentro de los limites aprobados.
- `estado`, cuando exista, debera ser uno de los cuatro estados oficiales.
- Los recursos inexistentes y los no visibles utilizaran la misma respuesta publica `404` cuando corresponda proteger su existencia.


## Autenticacion y Autorizacion

Todos los endpoints requeriran autenticacion y una cuenta activa.


## Privacidad

### Solicitante

Podra consultar unicamente:

- Sus propias solicitudes.
- Estado y causa de cancelacion.
- Fechas relevantes.
- Resumen de la donacion.
- Datos publicos minimos del donante cuando se incluyan en el contrato.

Nunca podra consultar:

- Otras solicitudes.
- Cantidad total de solicitantes.
- Identidad del receptor seleccionado cuando sea otra persona.
- Datos privados del propietario.
- Datos de otros solicitantes.

Cuando otra solicitud sea aceptada, unicamente vera `causaCancelacion = OTRA_SOLICITUD_ACEPTADA`, sin informacion sobre el receptor.

### Propietario

Podra consultar las solicitudes actuales e historicas de sus donaciones, incluso cuando la donacion este `RESERVADA`, `ENTREGADA` o `RETIRADA`.

De cada solicitante podra ver exclusivamente el perfil publico aprobado:

- `id`.
- `nombreVisible`.
- `fotoPerfil`.
- `ciudad`.

Nunca recibira `nombreCompleto`, `email`, `telefono`, sesiones, tokens, hashes ni otros datos privados.

### Consulta Individual

`GET /api/solicitudes/{id}` sera visible unicamente para:

- El solicitante.
- El propietario de la donacion.
- `ADMIN` mediante los endpoints que se definan en 010.

Para cualquier otro usuario respondera `404 Not Found` con el mismo mensaje publico utilizado para una solicitud inexistente. La representacion podra variar segun el actor para evitar filtraciones.


## Endpoints Definitivos

La API incluira unicamente:

| Metodo | Endpoint | Descripcion |
|---|---|---|
| POST | `/api/solicitudes` | Crear una solicitud |
| GET | `/api/solicitudes/enviadas` | Consultar solicitudes enviadas |
| GET | `/api/solicitudes/recibidas` | Consultar solicitudes recibidas |
| GET | `/api/solicitudes/{id}` | Consultar el detalle de una solicitud |
| GET | `/api/donaciones/{id}/solicitudes` | Consultar solicitudes de una donacion propia |
| PATCH | `/api/solicitudes/{id}/aceptar` | Aceptar una solicitud |
| PATCH | `/api/solicitudes/{id}/rechazar` | Rechazar una solicitud |
| PATCH | `/api/solicitudes/{id}/cancelar` | Cancelar voluntariamente una solicitud |

No se utilizaran endpoints `PUT`.


## Endpoints y Contratos

### POST `/api/solicitudes`

Entrada:

```json
{
  "donacionId": 15
}
```

Es el unico campo aceptado. El solicitante se obtiene desde el access token.

No se aceptaran:

- `solicitanteId`.
- `propietarioId`.
- `receptorId`.
- `estado`.
- `causaCancelacion`.
- Fechas.

La solicitud se creara unicamente cuando la donacion exista, sea visible, este `PUBLICADA`, no pertenezca al solicitante, coincida en ciudad y no exista otra solicitud `PENDIENTE` o `ACEPTADA` del mismo usuario para esa donacion.

Respuesta exitosa `201 Created`:

```json
{
  "success": true,
  "message": "Solicitud creada correctamente.",
  "data": {
    "solicitud": {
      "id": 40,
      "estado": "PENDIENTE",
      "causaCancelacion": null,
      "donacion": {
        "id": 15,
        "titulo": "Bicicleta infantil",
        "estado": "PUBLICADA",
        "imagenPrincipal": "/donaciones/bicicleta.jpg"
      },
      "createdAt": "2026-07-16T12:00:00.000Z",
      "updatedAt": "2026-07-16T12:00:00.000Z"
    }
  }
}
```

`imagenPrincipal` representa la primera referencia ordenada de la donacion. Su formato fisico podra ser una URL o ruta segun la decision tecnica posterior de Donaciones.

### GET `/api/solicitudes/enviadas`

Devuelve exclusivamente las solicitudes del usuario autenticado. Puede incluir el resumen de la donacion y los siguientes datos publicos del donante:

- `id`.
- `nombreVisible`.
- `fotoPerfil`.
- `ciudad`.

Nunca incluira datos de otras solicitudes ni informacion privada.

### GET `/api/solicitudes/recibidas`

Devuelve solicitudes asociadas a las donaciones del propietario autenticado. Cada solicitud podra incluir el perfil publico del solicitante con:

- `id`.
- `nombreVisible`.
- `fotoPerfil`.
- `ciudad`.

### GET `/api/donaciones/{id}/solicitudes`

Solo el propietario de la donacion podra consultar sus solicitudes. Incluira solicitudes actuales e historicas y utilizara la misma representacion segura de solicitudes recibidas.

Una donacion inexistente o ajena respondera `404` con el mismo mensaje publico.

### GET `/api/solicitudes/{id}`

Devuelve el detalle al solicitante o al propietario de la donacion. La representacion variara segun el actor para incluir unicamente datos publicos y necesarios.

Una solicitud inexistente o no visible respondera `404` con el mismo mensaje publico.

### PATCH `/api/solicitudes/{id}/aceptar`

Solo el propietario de la donacion podra aceptar. Recibira:

```json
{}
```

Ejecutara en una sola transaccion:

- Solicitud seleccionada: `estado = ACEPTADA`.
- `aceptadaAt = fecha actual`.
- Donacion: `estado = RESERVADA`.
- `donacion.solicitudAceptadaId = solicitud.id`.
- Demas solicitudes `PENDIENTE`: `estado = CANCELADA`.
- `causaCancelacion = OTRA_SOLICITUD_ACEPTADA`.
- `canceladaAt = fecha actual`.

Solo una solicitud podra quedar `ACEPTADA` por donacion.

### PATCH `/api/solicitudes/{id}/rechazar`

Solo el propietario de la donacion podra rechazar una solicitud `PENDIENTE`. Recibira:

```json
{}
```

La operacion cambiara exclusivamente:

- `estado = RECHAZADA`.
- `rechazadaAt = fecha actual`.

No modificara la donacion ni otras solicitudes.

### PATCH `/api/solicitudes/{id}/cancelar`

Solo el solicitante podra cancelar su solicitud `PENDIENTE`. Recibira:

```json
{}
```

La operacion cambiara:

- `estado = CANCELADA`.
- `causaCancelacion = VOLUNTARIA`.
- `canceladaAt = fecha actual`.


## Paginacion y Orden

Los siguientes endpoints utilizaran paginacion desde la primera version:

- `GET /api/solicitudes/enviadas`.
- `GET /api/solicitudes/recibidas`.
- `GET /api/donaciones/{id}/solicitudes`.

Parametros:

- `page`: entero positivo; valor inicial `1`.
- `limit`: entero positivo; valor inicial `20`; maximo `100`.
- `estado`: filtro opcional con uno de los cuatro estados oficiales.

Los parametros invalidos produciran `400 Bad Request`.

La respuesta incluira:

```json
{
  "page": 1,
  "limit": 20,
  "total": 50,
  "totalPages": 3
}
```

Cuando `total` sea `0`, `totalPages` sera `0`.

El orden predeterminado sera:

1. `createdAt` descendente.
2. `id` descendente como desempate estable.


## Integracion con Donaciones

### Aceptacion

La aceptacion debera comprobar y actualizar condicionalmente la solicitud y la donacion para evitar dos aceptaciones, una retirada concurrente o una nueva solicitud durante la reserva.

La solicitud seleccionada, la donacion, `solicitudAceptadaId` y las cancelaciones de las demas solicitudes se actualizaran en una unica transaccion.

### Retirada

Cuando 006 retire una donacion `PUBLICADA`, la misma transaccion:

- Cambiara las solicitudes `PENDIENTE` a `CANCELADA`.
- Asignara `causaCancelacion = DONACION_RETIRADA`.
- Registrara `canceladaAt`.
- Conservara todos los registros.


## Cuentas Inactivas

### Solicitante Inactivo

Cuando un solicitante se desactive:

- Sus solicitudes `PENDIENTE` pasaran a `CANCELADA`.
- `causaCancelacion` sera `USUARIO_INACTIVO`.
- Se registrara `canceladaAt`.
- Las solicitudes `ACEPTADA` no se modificaran automaticamente.
- Su resolucion correspondera a 010.

Las solicitudes `RECHAZADA` y `CANCELADA` permaneceran como historial.

### Propietario Inactivo

Cuando el propietario se desactive:

- Sus donaciones `PUBLICADA` pasaran a `RETIRADA`.
- Las solicitudes `PENDIENTE` asociadas pasaran a `CANCELADA`.
- `causaCancelacion` sera `DONACION_RETIRADA`.
- Se registrara `canceladaAt`.
- Las solicitudes `ACEPTADA` permaneceran para resolucion administrativa futura.

Estas coordinaciones se realizaran de forma consistente con la desactivacion de la cuenta y conservaran el historial.


## Integraciones Futuras

### Chat

Esta feature no creara el modelo Chat. Una solicitud `ACEPTADA` unicamente habilitara la creacion de un chat por `008-chat`. La estrategia tecnica de integracion se decidira al revisar esa feature.

### Calificaciones

Antes de persistir `POST /api/solicitudes`, el servicio consultara si existe una Donacion `ENTREGADA` cuya solicitud aceptada pertenezca al usuario y que no tenga `Calificacion` ni `ExencionCalificacion`.

Si existe al menos una pendiente, no creara la solicitud y respondera `409 Conflict` con:

```json
{
  "success": false,
  "status": 409,
  "message": "Debes completar tus calificaciones pendientes antes de solicitar otra donación.",
  "data": null
}
```

El error no incluira la lista de donaciones. El usuario podra consultarlas mediante `GET /api/calificaciones/pendientes`.

Una `ExencionCalificacion` elimina unicamente la obligacion de esa donacion: no crea puntuacion, no altera Donacion, Solicitud o promedios. Varias pendientes deberan calificarse o eximirse antes de volver a solicitar.

La comprobacion se realizara lo mas cerca posible de la creacion para reducir carreras entre entrega, calificacion, exencion y nueva solicitud.

### Administracion

`010-administracion` sera responsable de:

- Supervision global.
- Consulta administrativa de solicitudes.
- Resolucion de solicitudes `ACEPTADA` con participantes inactivos.
- Auditoria de estados y causas.
- Intervencion en casos bloqueados.
- Endpoints administrativos separados.

`ADMIN` no utilizara los endpoints normales para aceptar, rechazar o cancelar como si fuera propietario o solicitante.


## Manejo de Errores

Todas las respuestas respetaran el contrato transversal de `004-manejo-errores`.

Respuesta de error:

```json
{
  "success": false,
  "status": 400,
  "message": "Descripción del error.",
  "data": null
}
```

El campo opcional `errors` se utilizara unicamente para errores de validacion por campo. En los demas errores sera `null` o se omitira.

| Codigo | Uso en Solicitudes |
|---|---|
| 200 | Consultas, acciones exitosas y operaciones idempotentes |
| 201 | Solicitud creada correctamente |
| 400 | Identificador, cuerpo, filtro o paginacion invalidos |
| 401 | Autenticacion ausente o invalida |
| 403 | Operacion prohibida cuando revelar la existencia sea aceptable |
| 404 | Donacion o solicitud inexistente o no visible; ciudad diferente o donacion fuera de `PUBLICADA` al solicitar |
| 405 | Metodo HTTP no permitido |
| 409 | Autosolicitud, duplicado, calificacion pendiente, transicion incompatible o conflicto concurrente |
| 500 | Error interno seguro |

Las respuestas `405 Method Not Allowed` incluiran la cabecera HTTP `Allow` con los metodos permitidos.


## Dependencias

Esta feature depende de:

- `001-entorno` para Next.js, TypeScript, PostgreSQL, Prisma, migraciones y cliente Prisma.
- `002-autenticacion-core` para autenticar al usuario y obtener su identidad.
- `003-gestion-usuarios` para perfiles publicos, ciudad, estado activo y desactivacion de cuentas.
- `004-manejo-errores` para el contrato uniforme de respuestas y errores.
- `006-donaciones` para estados, propiedad, ciudad, visibilidad, retirada y reserva.

Las dependencias futuras seran:

- `008-chat` para crear la conversacion habilitada por una solicitud aceptada.
- `009-calificaciones` para consultar posteriormente el bloqueo por calificacion pendiente.
- `010-administracion` para supervision y resolucion de casos administrativos.


## Estado

Implementada, con evidencia permanente del flujo principal y de dos aceptaciones simultaneas.


## Observaciones

La aceptacion, retirada y desactivacion de cuentas requeriran operaciones consistentes y proteccion frente a concurrencia. Ninguna solicitud se eliminara fisicamente y ningun endpoint expondra la identidad de otros solicitantes o datos privados de los usuarios.
