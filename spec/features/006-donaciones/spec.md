# Donaciones - Especificacion

## Objetivo

Administrar exclusivamente el ciclo de vida de las donaciones publicadas en DonApp.

Esta feature comprende la creacion, consulta, actualizacion, retirada y confirmacion de entrega de las donaciones. No implementa solicitudes, chat, calificaciones, administracion general ni almacenamiento fisico de imagenes.


## Descripcion

Este modulo permite que los usuarios autenticados publiquen articulos que desean donar, administren sus propias publicaciones y consulten las donaciones publicadas en su ciudad.

Cada donacion pertenece a un propietario y a una categoria. Su ciudad se conserva como dato historico desde el momento de publicacion y su ciclo de vida se representa mediante estados explicitos.


## Alcance

Esta feature define:

- La creacion de donaciones.
- La consulta del listado general y de publicaciones propias.
- La consulta individual segun la visibilidad del actor.
- La actualizacion de publicaciones propias.
- La retirada logica.
- La confirmacion de entrega por ambas partes.
- Los estados y transiciones pertenecientes a Donaciones.
- La asociacion y orden de referencias de imagenes.
- La relacion con el propietario y la categoria.
- Los contratos REST, validaciones y reglas de negocio de Donaciones.


## Fuera de Alcance

No pertenecen a esta feature:

- La creacion, aceptacion o cancelacion funcional de solicitudes.
- La seleccion del receptor.
- La mensajeria y el chat.
- Las calificaciones.
- La supervision administrativa global.
- La resolucion administrativa de entregas bloqueadas.
- El almacenamiento fisico de archivos de imagen.
- El frontend Flutter.


## Tecnologias

- Next.js 16.2.10.
- TypeScript 5.9.3.
- PostgreSQL 16.x.
- Prisma ORM 7.8.0.
- Zod para validaciones.


## Requisitos Funcionales

**RF-001** Crear una donacion asociada al usuario autenticado y a una categoria activa.

**RF-002** Consultar de forma paginada las donaciones `PUBLICADA` de la misma ciudad, excluyendo las publicaciones propias.

**RF-003** Filtrar el listado general por categoria.

**RF-004** Consultar las publicaciones propias de forma paginada y filtrarlas por estado.

**RF-005** Consultar el detalle de una donacion cuando resulte visible para el usuario autenticado.

**RF-006** Actualizar parcialmente una donacion propia mientras permanezca `PUBLICADA`.

**RF-007** Retirar logicamente una donacion propia.

**RF-008** Asociar entre una y cinco referencias de imagenes ordenadas a una donacion.

**RF-009** Registrar de forma idempotente la confirmacion del donante y del receptor seleccionado.

**RF-010** Cambiar una donacion `RESERVADA` a `ENTREGADA` cuando ambas partes hayan confirmado.


## Estados de la Donacion

El estado se representara mediante un enum con los siguientes valores:

- `PUBLICADA`.
- `RESERVADA`.
- `ENTREGADA`.
- `RETIRADA`.

Flujo principal:

```text
PUBLICADA -> RESERVADA -> ENTREGADA
```

Flujo de retirada:

```text
PUBLICADA -> RETIRADA
```

No se permitiran por ahora las siguientes transiciones:

- `RESERVADA -> PUBLICADA`.
- `ENTREGADA -> cualquier estado`.
- `RETIRADA -> PUBLICADA`.

El estado `ENTREGADA` es irreversible. Una donacion `RETIRADA` no podra volver a `PUBLICADA`.


## Distribucion de Transiciones

Esta feature implementara:

- `PUBLICADA -> RETIRADA` mediante retirada logica.
- `RESERVADA -> ENTREGADA` mediante la confirmacion obligatoria de ambas partes.

La feature `007-solicitudes` implementara:

- `PUBLICADA -> RESERVADA` al aceptar una solicitud.
- La seleccion del receptor.
- La cancelacion de las demas solicitudes en la misma operacion.

La feature `010-administracion` podra ejecutar excepcionalmente:

- `RESERVADA -> RETIRADA`, unicamente como resolucion administrativa cuando el propietario o receptor este inactivo.

Esta excepcion no estara disponible en los endpoints normales. Conservara `solicitudAceptadaId`, la Solicitud `ACEPTADA`, Chat, mensajes y confirmaciones; registrara `retiradaAt`, quedara auditada por 010 y dejara el chat en modo solo lectura.


## Reglas de Negocio

**RN-001** Solo usuarios autenticados y activos podran crear y consultar donaciones.

**RN-002** El propietario se obtendra exclusivamente desde el access token.

**RN-003** La API nunca aceptara `usuarioId` ni `propietarioId` enviados por el cliente para asignar la propiedad.

**RN-004** Solo el propietario podra actualizar o retirar su donacion mediante los endpoints normales.

**RN-005** Cada donacion pertenecera a una unica categoria.

**RN-006** La categoria debera existir y estar activa al crear la donacion o enviar un nuevo `categoriaId`.

**RN-007** Una categoria desactivada posteriormente conservara su asociacion y no ocultara automaticamente la donacion.

**RN-008** Una donacion con categoria desactivada podra actualizar titulo, descripcion e imagenes sin cambiar de categoria.

**RN-009** Cada donacion tendra entre una y cinco imagenes.

**RN-010** La primera imagen segun el orden sera la imagen principal.

**RN-011** Solo las donaciones `PUBLICADA` podran modificar titulo, descripcion, categoria o imagenes.

**RN-012** La ciudad se copiara desde el perfil del propietario al crear la publicacion y no cambiara si el usuario modifica posteriormente su perfil.

**RN-013** El listado general incluira unicamente donaciones `PUBLICADA` de la misma ciudad y excluira las publicaciones del usuario autenticado.

**RN-014** No existira eliminacion fisica de donaciones.

**RN-015** La retirada conservara la donacion, sus solicitudes y su historial.

**RN-016** Una donacion `RESERVADA` pasara a `ENTREGADA` unicamente cuando el donante confirme la entrega y el receptor seleccionado confirme la recepcion.

**RN-017** La confirmacion repetida del mismo actor sera idempotente y no duplicara el registro.

**RN-018** La segunda confirmacion cambiara atomicamente la donacion a `ENTREGADA` y registrara `entregadaAt`.

**RN-019** La supervision global de donaciones pertenecera a `010-administracion`.

**RN-020** Un administrador no podra editar ni retirar publicaciones ajenas mediante los endpoints normales de esta feature.


## CRUD y Ciclo de Vida

La API incluira unicamente los siguientes endpoints:

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/api/donaciones` | Consultar donaciones publicadas de la misma ciudad |
| GET | `/api/donaciones/mias` | Consultar publicaciones propias |
| GET | `/api/donaciones/{id}` | Consultar una donacion visible para el actor |
| POST | `/api/donaciones` | Crear una donacion |
| PATCH | `/api/donaciones/{id}` | Actualizar parcialmente una donacion publicada |
| PATCH | `/api/donaciones/{id}/estado` | Retirar logicamente una donacion |
| PATCH | `/api/donaciones/{id}/confirmacion-entrega` | Registrar la confirmacion de entrega o recepcion |

No existiran endpoints `PUT` ni `DELETE`. DonApp utilizara retirada logica para conservar solicitudes, chat, calificaciones e historial.


## Modelo Conceptual

### Donacion

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria |
| `titulo` | String | Obligatorio |
| `descripcion` | String | Obligatoria |
| `ciudad` | String | Copia historica del perfil al publicar |
| `estado` | Enum | `PUBLICADA`, `RESERVADA`, `ENTREGADA` o `RETIRADA` |
| `propietarioId` | Int | Propietario de la publicacion |
| `categoriaId` | Int | Categoria asociada |
| `solicitudAceptadaId` | Int? | Solicitud seleccionada; opcional y nullable |
| `createdAt` | DateTime | Fecha de creacion |
| `updatedAt` | DateTime | Fecha de ultima actualizacion |
| `donanteConfirmoAt` | DateTime? | Confirmacion del donante |
| `receptorConfirmoAt` | DateTime? | Confirmacion del receptor |
| `entregadaAt` | DateTime? | Fecha de la segunda confirmacion |
| `retiradaAt` | DateTime? | Fecha de retirada logica |

`solicitudAceptadaId` se asignara cuando una solicitud sea aceptada, debera referenciar una Solicitud `ACEPTADA` perteneciente a la misma donacion y permitira derivar al receptor mediante `Solicitud.solicitanteId`.

No se agregara `receptorId` directamente en Donacion. La referencia se utilizara para la doble confirmacion de entrega, Chat, Calificaciones y supervision administrativa.

### ImagenDonacion

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria |
| `donacionId` | Int | Donacion propietaria |
| `referencia` | String | URL o ruta de la imagen |
| `orden` | Int | Posicion asignada por el backend |

PostgreSQL almacenara unicamente la referencia, el orden y los metadatos necesarios. No almacenara el archivo binario.

No se agrega todavia una relacion Prisma definitiva con `Solicitud`. La seleccion persistente del receptor y la relacion correspondiente se coordinaran con `007-solicitudes`.


## Validaciones

### Titulo

- Es obligatorio.
- Tendra entre 5 y 100 caracteres despues de normalizarse.
- Se eliminaran los espacios al inicio y al final.
- Los espacios internos repetidos se reduciran a uno.
- No admitira una cadena vacia.
- Permitira letras, numeros, acentos y signos basicos.
- No requerira unicidad.
- Los emojis no se documentan como soportados.

### Descripcion

- Es obligatoria.
- Tendra entre 20 y 1000 caracteres despues de normalizarse.
- Se eliminaran los espacios al inicio y al final.
- Conservara los saltos de linea.
- Sera texto plano.
- No admitira HTML ni Markdown.
- Una cadena vacia producira un error de validacion.

### Categoria

- `categoriaId` debera ser un entero positivo.
- La categoria debera existir y estar activa al crear.
- Si un `PATCH` envia un nuevo `categoriaId`, la nueva categoria debera existir y estar activa.
- Una categoria desactivada posteriormente no impedira modificar otros campos permitidos.
- Intentar asignar una categoria inactiva producira `409 Conflict`.

### Imagenes

- La donacion tendra un minimo de una imagen y un maximo de cinco.
- La API recibira un arreglo ordenado de referencias.
- El orden sera el orden del arreglo recibido.
- El backend asignara automaticamente el valor interno de `orden`.
- La primera referencia sera la imagen principal.
- No existira un campo `esPrincipal`.
- Si un `PATCH` incluye `imagenes`, reemplazara completamente la coleccion existente.
- No se admitiran actualizaciones incrementales de imagenes.
- El reemplazo no podra dejar la donacion sin imagenes.

### Identificadores, Filtros y Cuerpos

- Todo identificador debera ser un entero positivo.
- Se rechazaran campos desconocidos.
- Se rechazaran cuerpos vacios cuando la operacion requiera datos.
- `page` y `limit` deberan cumplir las reglas de paginacion.


## Autenticacion, Propiedad y Visibilidad

Todos los endpoints de Donaciones requeriran autenticacion y una cuenta activa.

### Visibilidad por Estado

- `PUBLICADA`: visible para usuarios autenticados de la misma ciudad y para su propietario en publicaciones propias.
- `RESERVADA`: visible unicamente para el propietario, el receptor seleccionado y `ADMIN` cuando se implemente 010.
- `ENTREGADA`: visible unicamente para el propietario, el receptor y `ADMIN`.
- `RETIRADA`: visible unicamente para el propietario y `ADMIN`.

Cuando una donacion exista pero no sea visible para el usuario autenticado, la API respondera `404 Not Found` con el mismo mensaje publico utilizado para una donacion inexistente. El cliente no podra distinguir ambas condiciones.


## Endpoints y Contratos

### GET `/api/donaciones`

Requiere autenticacion. Devuelve unicamente donaciones `PUBLICADA` de la misma ciudad del usuario autenticado y excluye sus publicaciones propias.

Permitira filtrar por `categoriaId` y utilizara paginacion mediante `page` y `limit`. El orden sera `createdAt` descendente y `id` descendente como criterio de desempate.

La definicion exacta de los campos de cada elemento se aprobara antes de implementar el endpoint.

### GET `/api/donaciones/mias`

Requiere autenticacion. Devuelve las publicaciones creadas por el usuario autenticado y puede incluir `PUBLICADA`, `RESERVADA`, `ENTREGADA` y `RETIRADA`.

Permitira filtrar por estado y utilizara paginacion. No incluira donaciones en las que el usuario sea unicamente receptor. El orden sera `createdAt` descendente e `id` descendente.

La definicion exacta de los campos de cada elemento se aprobara antes de implementar el endpoint.

### GET `/api/donaciones/{id}`

Requiere autenticacion. Devuelve el detalle cuando la donacion sea visible para el actor segun su estado, propiedad y participacion.

Una donacion inexistente o no visible respondera con el mismo `404` y el mismo mensaje publico.

La representacion exacta del detalle se aprobara antes de implementar el endpoint.

### POST `/api/donaciones`

Requiere autenticacion. La propiedad y la ciudad se obtendran en el servidor desde el usuario autenticado.

Entrada:

```json
{
  "titulo": "Bicicleta infantil",
  "descripcion": "Bicicleta infantil en buen estado y lista para usar.",
  "categoriaId": 4,
  "imagenes": [
    "/donaciones/bicicleta-1.jpg",
    "/donaciones/bicicleta-2.jpg"
  ]
}
```

El cliente no enviara propietario, ciudad, estado, confirmaciones ni fechas. Una creacion exitosa respondera `201 Created`.

### PATCH `/api/donaciones/{id}`

Requiere autenticacion y propiedad. Solo permite modificar una donacion `PUBLICADA`.

Campos permitidos:

- `titulo`.
- `descripcion`.
- `categoriaId`.
- `imagenes`.

Debe enviarse al menos un campo modificable. Si se envian imagenes, la coleccion completa sera reemplazada respetando el minimo de una y el maximo de cinco.

No permite modificar:

- Propietario.
- Ciudad.
- Estado.
- Confirmaciones.
- Fechas.
- Relaciones actuales o futuras.

Una edicion fuera de `PUBLICADA` producira `409 Conflict`.

### PATCH `/api/donaciones/{id}/estado`

Requiere autenticacion y propiedad. Solo permite solicitar la retirada logica.

Entrada:

```json
{
  "estado": "RETIRADA"
}
```

No aceptara ningun otro estado enviado por el cliente.

Si la donacion esta `PUBLICADA`, la operacion cambiara atomicamente su estado a `RETIRADA`, registrara `retiradaAt`, cancelara las solicitudes pendientes y las conservara como historial. Esta coordinacion se implementara junto con `007-solicitudes`.

Si la donacion ya esta `RETIRADA` y el actor es su propietario, la operacion respondera `200` de forma idempotente. Una donacion `RESERVADA` o `ENTREGADA` no podra retirarse y respondera `409`.

### PATCH `/api/donaciones/{id}/confirmacion-entrega`

Requiere autenticacion. Solo se aplicara a una donacion `RESERVADA` visible para el propietario o el receptor seleccionado.

La solicitud no recibira:

- `usuarioId`.
- `propietarioId`.
- `receptorId`.
- Tipo de actor.
- Estado.

El backend identificara automaticamente al actor desde el access token y la participacion registrada. Si no es el propietario ni el receptor seleccionado, la donacion se tratara como no visible y respondera `404`.

Si el mismo actor ya confirmo, respondera `200` sin duplicar la confirmacion. Cuando exista la segunda confirmacion, la operacion cambiara atomicamente `RESERVADA -> ENTREGADA` y registrara `entregadaAt`.


## Paginacion y Orden

`GET /api/donaciones` y `GET /api/donaciones/mias` utilizaran paginacion desde la primera version.

Parametros:

- `page`: entero positivo; valor inicial `1`.
- `limit`: entero positivo; valor inicial `20`; maximo `100`.

Los parametros invalidos produciran `400 Bad Request`.

La respuesta incluira metadatos equivalentes a:

```json
{
  "page": 1,
  "limit": 20,
  "total": 50,
  "totalPages": 3
}
```

El orden predeterminado sera:

1. `createdAt` descendente.
2. `id` descendente como criterio de desempate.


## Cuenta del Propietario Desactivada

Cuando una cuenta se desactive:

- Sus donaciones `PUBLICADA` pasaran automaticamente a `RETIRADA`.
- Sus donaciones `RESERVADA` permaneceran registradas y conservaran el acceso del receptor seleccionado al historial y al proceso de entrega.
- Sus donaciones `ENTREGADA` se conservaran como historial.
- Sus donaciones `RETIRADA` se conservaran como historial.

La cuenta inactiva no podra autenticarse ni confirmar una entrega. Una donacion `RESERVADA` con propietario o receptor inactivo podra resolverse exclusivamente desde 010 mediante `RESERVADA -> RETIRADA`, conservando solicitud aceptada, Chat, mensajes, confirmaciones e historial.

Esta feature no expondra esa transicion en sus endpoints normales ni cancelara o reescribira la Solicitud `ACEPTADA`.


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

| Codigo | Uso en Donaciones |
|---|---|
| 200 | Consultas, actualizaciones, retirada, confirmaciones y operaciones idempotentes exitosas |
| 201 | Donacion creada correctamente |
| 400 | Cuerpos, filtros, parametros, identificadores o imagenes invalidos |
| 401 | Autenticacion ausente o invalida |
| 403 | Operacion prohibida para un usuario autenticado cuando revelar la existencia sea aceptable |
| 404 | Donacion inexistente o no visible para el actor |
| 405 | Metodo HTTP no permitido |
| 409 | Transicion invalida, edicion fuera de `PUBLICADA`, categoria inactiva o conflicto concurrente |
| 500 | Error interno seguro |

Las respuestas `405 Method Not Allowed` incluiran la cabecera HTTP `Allow` con los metodos permitidos.


## Dependencias

Esta feature depende de:

- `001-entorno` para Next.js, TypeScript, PostgreSQL, Prisma, migraciones y cliente Prisma.
- `002-autenticacion-core` para autenticar al usuario y obtener su identidad.
- `003-gestion-usuarios` para el perfil, la ciudad y el estado activo del propietario.
- `004-manejo-errores` para el contrato uniforme de respuestas y errores.
- `005-categorias` para asociar y validar categorias.

La distribucion de responsabilidades futuras sera:

- `006-donaciones`: creacion, consulta, edicion, retirada y confirmacion.
- `007-solicitudes`: aceptacion, seleccion del receptor, transicion `PUBLICADA -> RESERVADA` y cancelacion del resto de solicitudes.
- `008-chat`: creacion de la conversacion despues de aceptar una solicitud.
- `009-calificaciones`: calificacion despues de que la donacion llegue a `ENTREGADA`.
- `010-administracion`: supervision global, resolucion de casos y origen exclusivo de la transicion administrativa `RESERVADA -> RETIRADA`.

Donaciones no implementara todavia los modelos completos de `Solicitud`, `Chat` ni `Calificacion`.


## Estado

Implementada, con evidencia permanente del flujo principal y de la robustez del enqueue BullMQ.


## Observaciones

La retirada y la aceptacion de solicitudes se coordinan para impedir transiciones concurrentes incompatibles. La relacion con `Solicitud` y la identificacion persistente del receptor estan integradas con `007-solicitudes`.
