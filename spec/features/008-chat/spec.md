# Chat - Especificación

## Objetivo

Permitir la comunicación privada entre el propietario de una donación y el solicitante cuya solicitud fue `ACEPTADA`, con el propósito de coordinar la entrega y conservar el historial de la conversación.

Los participantes se obtendrán mediante:

- `Donacion.propietarioId` para el propietario.
- `Donacion.solicitudAceptadaId` para identificar la solicitud aceptada.
- `Solicitud.solicitanteId` para identificar al receptor.


## Descripción

Esta feature administra chats privados y sus mensajes. Un chat estará vinculado de forma única a una solicitud aceptada y solo podrá ser utilizado por los dos participantes derivados de esa solicitud y su donación.

La creación será diferida e idempotente. Chat nunca modificará directamente los estados de Donación o Solicitud.


## Alcance

Esta feature incluye:

- Obtener o crear el chat habilitado.
- Listar los chats del usuario autenticado.
- Consultar los metadatos de un chat.
- Consultar mensajes.
- Enviar mensajes.
- Aplicar autenticación, autorización y privacidad.
- Conservar chats y mensajes como historial.


## Fuera de Alcance

Esta feature no implementará:

- Aceptación de solicitudes.
- Modificación del estado de Solicitudes.
- Modificación del estado de Donaciones.
- Confirmación de entrega.
- Calificaciones.
- Administración global.
- Notificaciones push o correo electrónico.
- WebSocket o comunicación en tiempo real.
- Archivos, fotografías o adjuntos.
- Edición de mensajes.
- Eliminación de mensajes.
- Eliminación de chats.
- Frontend Flutter.


## Tecnologías y Arquitectura

- Next.js 16.2.10 con Pages Router.
- TypeScript 5.9.3.
- PostgreSQL 16.
- Prisma ORM 7.8.
- Zod para validaciones.


## Requisitos Funcionales

**RF-001** Obtener o crear de forma diferida e idempotente el chat habilitado por una solicitud `ACEPTADA`.

**RF-002** Listar de forma paginada los chats donde el usuario autenticado sea participante.

**RF-003** Consultar los metadatos de un chat visible para el usuario autenticado.

**RF-004** Consultar de forma paginada el historial de mensajes de un chat.

**RF-005** Enviar mensajes de texto mientras la donación permanezca `RESERVADA` y ambas cuentas estén activas.

**RF-006** Conservar chats y mensajes como historial sin edición ni eliminación física.


## Creación del Chat

El chat no se creará automáticamente dentro de la transacción de aceptación de la feature 007.

La creación será diferida e idempotente. Cualquiera de los dos participantes podrá obtener o crear el chat mediante:

`POST /api/solicitudes/{id}/chat`

El identificador corresponde a la solicitud `ACEPTADA`. La operación solo será válida cuando:

- La solicitud exista.
- La solicitud esté `ACEPTADA`.
- La solicitud coincida con `Donacion.solicitudAceptadaId`.
- La donación esté `RESERVADA`.
- El usuario autenticado sea el propietario o el solicitante aceptado.
- Ambas cuentas permanezcan activas.

Si el chat ya existe, se devolverá el mismo chat sin crear otro registro.

- `201 Created` cuando se cree.
- `200 OK` cuando ya exista.

Un usuario ajeno recibirá `404 Not Found`, igual que si la solicitud o el chat no existieran.


## Estado del Chat y de la Donación

Chat no tendrá un enum ni un estado propio en la primera versión. No existirán estados como `ACTIVO`, `CERRADO` o `ARCHIVADO`.

La posibilidad de enviar mensajes se derivará de:

- El estado de la solicitud.
- El estado de la donación.
- La identidad del participante.
- El estado activo de ambas cuentas.

Solo se permitirán mensajes cuando `Donacion.estado = RESERVADA`.

Cuando la donación pase a `ENTREGADA`, el chat permanecerá disponible únicamente para consulta y no aceptará mensajes nuevos.

Una donación `RETIRADA` normalmente no tendrá chat porque ese estado procede desde `PUBLICADA`. Si existiera un chat relacionado por una intervención administrativa o inconsistencia histórica:

- Se conservará.
- Quedará en modo solo lectura.
- No aceptará mensajes nuevos.

Cuando 010 ejecute administrativamente `RESERVADA -> RETIRADA`, el Chat conservará todos sus mensajes y participantes, quedará en modo solo lectura y no se eliminará.

Chat nunca modificará los estados de Donación o Solicitud.


## Modelo Conceptual Chat

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria |
| `solicitudId` | Int | Obligatorio y único; referencia a la solicitud aceptada |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de última actualización |
| `ultimoMensajeAt` | DateTime? | `null` mientras no existan mensajes; se actualiza al enviar uno |

Chat no incluirá directamente:

- `donacionId`.
- `propietarioId`.
- `receptorId`.

Estos datos se derivarán mediante `Chat -> Solicitud -> Donacion`.


## Modelo Conceptual Mensaje

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria |
| `chatId` | Int | Chat al que pertenece |
| `remitenteId` | Int | Usuario autenticado que envía el mensaje |
| `contenido` | String | Texto plano validado |
| `createdAt` | DateTime | Fecha de envío |

Mensaje no incluirá:

- `updatedAt`.
- `leidoAt`.
- `editadoAt`.
- `eliminadoAt`.
- Archivos, imágenes o adjuntos.

Los mensajes serán inmutables.


## Participantes

No se creará una tabla `ParticipanteChat`. Siempre existirán exactamente dos participantes derivados:

- Propietario: `Donacion.propietarioId`.
- Receptor: `Solicitud.solicitanteId`.

El remitente se obtendrá exclusivamente desde el access token. La API nunca confiará en `remitenteId`, `propietarioId` o `receptorId` enviados por el cliente.


## Reglas de Negocio

**RN-001** Solo una solicitud `ACEPTADA` que coincida con `Donacion.solicitudAceptadaId` podrá habilitar un chat.

**RN-002** La donación deberá estar `RESERVADA` al crear el chat.

**RN-003** Existirá como máximo un chat por solicitud aceptada.

**RN-004** Solo el propietario y el solicitante aceptado podrán descubrir, consultar o utilizar el chat.

**RN-005** Solo se podrán enviar mensajes mientras la donación esté `RESERVADA` y ambas cuentas estén activas.

**RN-006** Los chats asociados a donaciones `ENTREGADA` o `RETIRADA` serán de solo lectura.

**RN-007** Chat no modificará estados de Donación o Solicitud.

**RN-008** Los chats y mensajes se conservarán como historial y nunca se eliminarán físicamente mediante esta feature.

**RN-009** Los mensajes no podrán editarse ni eliminarse.

**RN-010** El contenido de los mensajes será texto plano y no se interpretará como HTML o Markdown.


## Cuentas Inactivas

Una cuenta inactiva no podrá autenticarse ni utilizar los endpoints.

Cuando uno de los participantes se desactive:

- El chat y sus mensajes se conservarán.
- El participante activo podrá consultar el historial.
- No se permitirán mensajes nuevos.
- El caso podrá resolverse posteriormente mediante la feature 010.

No se eliminará ningún chat ni mensaje por la desactivación de una cuenta.

Una donación `RESERVADA` bloqueada por un participante inactivo podrá ser retirada administrativamente por 010. Esa resolución no modificará el Chat salvo por quedar en modo solo lectura derivado del estado `RETIRADA`.


## Autenticación y Autorización

Todos los endpoints requerirán autenticación. Solo los dos participantes podrán descubrir y consultar el chat.


## Privacidad

Los demás solicitantes nunca podrán conocer:

- Que existe el chat.
- Su identificador.
- Sus participantes.
- Sus mensajes.

Nunca se expondrán:

- `nombreCompleto`.
- `email`.
- `telefono`.
- `passwordHash`.
- Sesiones o tokens.
- Datos de solicitantes no aceptados.
- Consultas Prisma completas.
- Errores internos.

El contenido completo de los mensajes no se escribirá en logs ordinarios.

`ADMIN` no podrá acceder mediante los endpoints normales ni enviar mensajes como otro usuario. La supervisión futura se implementará mediante endpoints administrativos separados en la feature 010.

Un recurso inexistente o no visible utilizará el mismo mensaje público `404` para evitar revelar su existencia.


## Validación del Contenido

`contenido` será obligatorio y cumplirá estas reglas:

- Tipo `string`.
- `trim` al inicio y al final.
- Mínimo 1 carácter después del `trim`.
- Máximo 1000 caracteres.
- Conservación de saltos de línea.
- Conservación de espacios internos.
- Almacenamiento como texto plano.
- Sin interpretación de HTML.
- Sin interpretación de Markdown.
- Rechazo de mensajes vacíos o compuestos únicamente por espacios.

Los enlaces podrán existir únicamente como texto, sin vista previa ni contenido enriquecido.

No se aceptarán campos desconocidos ni `remitenteId` enviado por el cliente.

Los identificadores, `page` y `limit` deberán ser enteros positivos. `limit` no podrá superar `100`.


## Endpoints Definitivos

La API incluirá únicamente:

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/solicitudes/{id}/chat` | Obtener o crear el chat habilitado |
| GET | `/api/chats` | Listar los chats del usuario |
| GET | `/api/chats/{id}` | Consultar los metadatos de un chat |
| GET | `/api/chats/{id}/mensajes` | Listar los mensajes de un chat |
| POST | `/api/chats/{id}/mensajes` | Enviar un mensaje |

No existirán endpoints para editar o eliminar mensajes, eliminar chats, marcar mensajes como leídos, administrar participantes o realizar supervisión administrativa.


## Endpoints y Contratos

### Representación Segura del Chat

La creación, el listado y el detalle utilizarán una representación común:

```json
{
  "id": 12,
  "solicitudId": 40,
  "createdAt": "2026-07-18T12:00:00.000Z",
  "ultimoMensajeAt": null,
  "donacion": {
    "id": 15,
    "titulo": "Bicicleta infantil",
    "estado": "RESERVADA",
    "imagenPrincipal": "/donaciones/bicicleta.jpg"
  },
  "otroParticipante": {
    "id": 8,
    "nombreVisible": "usuario.ejemplo",
    "fotoPerfil": "/perfiles/usuario.jpg",
    "ciudad": "Quito"
  }
}
```

`imagenPrincipal` conservará el formato conceptual definido en Donaciones.

Esta representación no incluirá datos privados, otros solicitantes, todos los mensajes ni identificadores internos innecesarios.


### Representación Segura del Mensaje

Las respuestas de mensajes utilizarán:

```json
{
  "id": 90,
  "contenido": "Podemos coordinar la entrega mañana.",
  "createdAt": "2026-07-18T12:15:00.000Z",
  "remitente": {
    "id": 8,
    "nombreVisible": "usuario.ejemplo",
    "fotoPerfil": "/perfiles/usuario.jpg"
  }
}
```

No incluirán información privada.


### POST `/api/solicitudes/{id}/chat`

Obtendrá o creará idempotentemente el chat habilitado por la solicitud aceptada indicada en la ruta.

Entrada:

```json
{}
```

No aceptará en el cuerpo:

- `solicitudId`.
- `donacionId`.
- `propietarioId`.
- `receptorId`.
- `estado`.
- Participantes.
- Campos desconocidos.

El identificador de la solicitud se obtendrá exclusivamente desde la ruta y la identidad del actor desde el access token.

Cuando se cree responderá `201 Created`:

```json
{
  "success": true,
  "message": "Chat creado correctamente.",
  "data": {
    "chat": {}
  }
}
```

Cuando ya exista responderá `200 OK`:

```json
{
  "success": true,
  "message": "Chat consultado correctamente.",
  "data": {
    "chat": {}
  }
}
```

En ambas respuestas, `chat` utilizará la representación segura aprobada.

### GET `/api/chats`

Devolverá exclusivamente los chats donde el usuario autenticado sea propietario de la donación o solicitante aceptado.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Chats consultados correctamente.",
  "data": {
    "chats": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

Cada elemento de `chats` utilizará la representación segura del chat. El listado no incluirá el contenido completo de todos los mensajes.

### GET `/api/chats/{id}`

Devolverá los metadatos del chat, el resumen público de la donación y el perfil público del otro participante. No incluirá automáticamente todos los mensajes.

Solo podrá consultarlo uno de los dos participantes. Un chat inexistente o no visible responderá `404 Not Found` con el mismo mensaje público.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Chat consultado correctamente.",
  "data": {
    "chat": {}
  }
}
```

`chat` utilizará la representación segura aprobada y no incluirá automáticamente el historial de mensajes.

### GET `/api/chats/{id}/mensajes`

Devolverá los mensajes del chat únicamente a sus participantes.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Mensajes consultados correctamente.",
  "data": {
    "mensajes": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

Cada elemento de `mensajes` utilizará la representación segura del mensaje.

### POST `/api/chats/{id}/mensajes`

Entrada:

```json
{
  "contenido": "Podemos coordinar la entrega mañana."
}
```

El remitente se obtendrá desde el access token. Solo el propietario o el solicitante aceptado podrá enviar mensajes, ambas cuentas deberán estar activas y la donación deberá permanecer `RESERVADA`.

La creación del mensaje y la actualización de `ultimoMensajeAt` se realizarán consistentemente.

La respuesta exitosa utilizará `201 Created`:

```json
{
  "success": true,
  "message": "Mensaje enviado correctamente.",
  "data": {
    "mensaje": {}
  }
}
```

`mensaje` utilizará la representación segura aprobada.


## Paginación y Orden

### Chats

`GET /api/chats` utilizará:

- `page`: valor predeterminado `1`.
- `limit`: valor predeterminado `20`; máximo `100`.

Orden:

1. `ultimoMensajeAt DESC`, con valores `null` al final.
2. `createdAt DESC`.
3. `id DESC` como desempate estable.

### Mensajes

`GET /api/chats/{id}/mensajes` utilizará:

- `page`: valor predeterminado `1`.
- `limit`: valor predeterminado `20`; máximo `100`.

Orden:

1. `createdAt DESC`.
2. `id DESC` como desempate estable.

La API devolverá primero los mensajes más recientes.

Las respuestas paginadas incluirán `page`, `limit`, `total` y `totalPages`. Cuando `total` sea `0`, `totalPages` será `0`.


## Historial y Eliminación

Los chats y mensajes nunca se eliminarán físicamente mediante esta feature. No existirán endpoints para editar o eliminar.

Las claves foráneas deberán impedir eliminaciones en cascada accidentales que destruyan el historial.


## Restricciones Técnicas

- `Chat.solicitudId` será obligatorio y `UNIQUE`.
- Las claves foráneas serán obligatorias.
- Existirá como máximo un chat por solicitud aceptada.
- La creación estará protegida frente a solicitudes concurrentes.
- Cada mensaje tendrá un remitente obligatorio.
- La eliminación física estará restringida.
- Existirán índices apropiados para listar los chats del participante.
- Existirá un índice para mensajes por chat, `createdAt` e `id`.
- Las respuestas seleccionarán explícitamente los campos públicos.
- La creación del mensaje y la actualización de `ultimoMensajeAt` utilizarán una transacción o actualizaciones consistentes.
- La lógica comprobará que la solicitud esté `ACEPTADA` y coincida con `Donacion.solicitudAceptadaId`.


## Concurrencia

Si los dos participantes intentan crear el chat simultáneamente:

- Solo se creará uno.
- La restricción `UNIQUE` sobre `solicitudId` impedirá duplicados.
- Ambas operaciones podrán obtener el mismo chat.

No deberá crearse un chat antes de confirmar la aceptación.

Si se intenta enviar un mensaje mientras la donación cambia de `RESERVADA` a `ENTREGADA`, la operación comprobará condicionalmente el estado. Si ya no se permiten mensajes:

- Responderá `409 Conflict`.
- No persistirá un mensaje parcial.


## Manejo de Errores

Todas las respuestas respetarán el contrato transversal de la feature 004.

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

El campo `errors` será opcional y se utilizará únicamente para errores de validación por campo.

| Código | Uso en Chat |
|---|---|
| 200 | Consultas y obtención idempotente de un chat existente |
| 201 | Creación de un chat o mensaje |
| 400 | Identificador, cuerpo o paginación inválidos |
| 401 | Autenticación ausente, inválida o sesión revocada |
| 403 | Operación prohibida cuando sea seguro revelar el recurso |
| 404 | Solicitud, chat o conversación inexistente o no visible |
| 405 | Método HTTP no permitido, con cabecera `Allow` |
| 409 | Solicitud no `ACEPTADA`, donación no `RESERVADA`, chat de solo lectura, participante inactivo o conflicto concurrente |
| 500 | Error interno seguro |


## Integraciones Futuras

### Calificaciones

Chat no creará ni habilitará calificaciones. La feature 009 dependerá del estado `ENTREGADA`, no de los mensajes.

### Administración

La feature 010 utilizará endpoints administrativos separados y podrá consultar únicamente metadatos y la cantidad total de mensajes.

`ADMIN` no será participante normal y no podrá consultar o listar el contenido de mensajes, enviar mensajes, modificar participantes ni eliminar chats o mensajes. Esta feature no agrega endpoints administrativos.

### Notificaciones

Esta versión no implementará push, correo, WebSocket ni tiempo real. Una integración futura no deberá bloquear la creación del chat ni el envío del mensaje.


## Dependencias

Esta feature depende de:

- `002-autenticacion-core` para autenticar e identificar al usuario.
- `003-gestion-usuarios` para cuentas activas y perfiles públicos.
- `004-manejo-errores` para el contrato uniforme de respuestas y errores.
- `006-donaciones` para propiedad, solicitud aceptada y estado de la donación.
- `007-solicitudes` para la solicitud `ACEPTADA` y el solicitante seleccionado.

Las integraciones futuras serán `009-calificaciones`, `010-administracion` y los mecanismos de notificación que se aprueben posteriormente.


## Estado

Implementada, con evidencia permanente de creación del chat, mensajería y cierre en el flujo de entrega.


## Observaciones

El chat constituye el medio privado de coordinación dentro de DonApp. Su creación diferida evita ampliar la transacción de aceptación, mientras que la restricción única sobre `solicitudId` y las comprobaciones de autorización protegen contra duplicados y accesos no permitidos.
