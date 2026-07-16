# Donaciones - Plan de Implementacion

## Dependencias Previas

La implementacion depende de:

- `002-autenticacion-core` para validar access tokens, obtener la identidad y comprobar que la cuenta permanezca activa.
- `003-gestion-usuarios` para utilizar el perfil definitivo, copiar la ciudad al publicar y coordinar la desactivacion de cuentas.
- `004-manejo-errores` para aplicar respuestas uniformes y traducir errores tecnicos de forma segura.
- `005-categorias` para disponer de `Categoria` y comprobar que exista y este activa al crear o cambiar `categoriaId`.

La implementacion comenzara despues de disponer de estas bases o de las partes reutilizables necesarias para cada fase.

## Arquitectura

La feature se implementara mediante el siguiente flujo:

```text
Rutas API de Next.js
  -> autenticacion y autorizacion
  -> validaciones y normalizacion con Zod
  -> servicios de donaciones
  -> Prisma ORM
  -> PostgreSQL
```

Las rutas gestionaran HTTP, parametros, metodos permitidos y respuestas. Las validaciones aceptaran exclusivamente los contratos aprobados. Los servicios aplicaran propiedad, visibilidad, estados, transacciones y selecciones explicitas. Prisma administrara la persistencia.

## Organizacion Probable de Archivos

La ubicacion final respetara las convenciones del proyecto. Se preve crear o modificar archivos con estas responsabilidades:

```text
prisma/
  schema.prisma
  migrations/

generated/
  prisma/

lib/
  auth/
    authenticate.ts
  validations/
    donaciones.ts
  services/
    donacion-service.ts
  api/
    respuestas y errores compartidos

src/pages/api/donaciones/
  index.ts
  mias.ts
  [id]/
    index.ts
    estado.ts
    confirmacion-entrega.ts

tests/
  donaciones/
```

Los nombres finales podran ajustarse sin modificar los siete endpoints ni sus responsabilidades.

## Organizacion de Rutas

- `GET /api/donaciones` y `POST /api/donaciones` compartiran la ruta de coleccion.
- `GET /api/donaciones/mias` resolvera exclusivamente las publicaciones creadas por el usuario autenticado.
- `GET /api/donaciones/{id}` y `PATCH /api/donaciones/{id}` compartiran la ruta de recurso.
- `PATCH /api/donaciones/{id}/estado` gestionara unicamente la retirada logica.
- `PATCH /api/donaciones/{id}/confirmacion-entrega` registrara la confirmacion del actor autenticado.

Cada ruta rechazara metodos no permitidos con `405` y la cabecera `Allow`. No se crearan rutas `PUT` ni `DELETE`.

## Servicios

Los servicios centralizaran:

- Creacion con propietario y ciudad obtenidos del usuario autenticado.
- Listado general por estado y ciudad, excluyendo publicaciones propias.
- Listado de publicaciones propias.
- Consulta individual con reglas de visibilidad.
- Actualizacion parcial de publicaciones `PUBLICADA`.
- Reemplazo completo de imagenes cuando se envie la coleccion.
- Retirada logica y registro de `retiradaAt`.
- Registro idempotente de confirmaciones.
- Transicion atomica a `ENTREGADA` con la segunda confirmacion.
- Seleccion explicita de campos para cada respuesta.

Las reglas de Solicitudes, Chat y Calificaciones no se implementaran en estos servicios.

## Validaciones

Se definiran esquemas separados para:

- Identificadores enteros positivos.
- Creacion de donaciones.
- Actualizacion parcial.
- Retirada logica.
- Confirmacion de entrega.
- Filtros del listado general.
- Filtros de publicaciones propias.
- Paginacion.

El titulo se normalizara mediante `trim` y reduccion de espacios repetidos, y tendra entre 5 y 100 caracteres. La descripcion sera texto plano obligatorio de 20 a 1000 caracteres, conservara saltos de linea y rechazara HTML, Markdown y cadenas vacias.

Los esquemas seran estrictos: rechazaran campos desconocidos, cuerpos vacios cuando correspondan y cualquier intento de asignar propietario, ciudad, estado, confirmaciones, fechas o relaciones protegidas.

## Organizacion de Imagenes

La API recibira un arreglo ordenado de entre una y cinco referencias. La posicion del arreglo definira el orden interno y la primera referencia sera la imagen principal.

No existira `esPrincipal`. PostgreSQL almacenara referencias, orden y metadatos necesarios, nunca archivos binarios.

Durante la creacion se persistira la coleccion completa. Cuando el `PATCH` incluya `imagenes`, la coleccion existente se reemplazara completamente dentro de una operacion consistente. No se implementaran actualizaciones incrementales.

Solo las donaciones `PUBLICADA` permitiran modificar imagenes.

## Cambios Previstos en Prisma

Se agregara el enum de estado con:

- `PUBLICADA`.
- `RESERVADA`.
- `ENTREGADA`.
- `RETIRADA`.

Se agregara `Donacion` con los campos conceptuales aprobados y sus relaciones con `Usuario`, `Categoria`, `ImagenDonacion` y la referencia nullable `solicitudAceptadaId`.

Se agregara `ImagenDonacion` con `id`, `donacionId`, `referencia` y `orden`.

La implementacion debera garantizar la propiedad de las imagenes y evitar ordenes repetidos dentro de una misma donacion.

`solicitudAceptadaId` referenciara la Solicitud seleccionada y permitira derivar al receptor sin agregar `receptorId`. No se agregaran modelos completos de `Chat` o `Calificacion`.

## Migracion y Cliente Prisma

Despues de aprobar el cambio de `schema.prisma` se creara una migracion nueva sin modificar migraciones aplicadas.

Antes de aplicarla se revisaran:

- El enum y sus valores.
- Campos obligatorios y opcionales.
- Valores iniciales.
- Claves foraneas con Usuario y Categoria.
- Relacion y restricciones de ImagenDonacion.
- Indices necesarios para propietario, categoria, estado, ciudad y ordenacion.
- Consistencia de `solicitudAceptadaId` con una Solicitud `ACEPTADA` de la misma donacion.

Despues se aplicara la migracion y se regenerara el cliente oficial en `generated/prisma`.

## Estrategia de Estados

La creacion asignara siempre `PUBLICADA`.

Las transiciones se comprobaran en el servidor y no se permitira que el cliente asigne libremente estados:

```text
PUBLICADA -> RETIRADA
RESERVADA -> ENTREGADA
```

La transicion `PUBLICADA -> RESERVADA` sera ejecutada posteriormente por Solicitudes al aceptar una solicitud.

No se permitiran retornos desde `ENTREGADA` ni `RETIRADA`, ni `RESERVADA -> PUBLICADA`.

`RESERVADA -> RETIRADA` existira unicamente como resolucion administrativa originada por 010 cuando un participante este inactivo. No formara parte de las rutas normales de Donaciones.

Las actualizaciones condicionales y transacciones deberan impedir carreras entre retirada, aceptacion de solicitudes y confirmaciones.

## Confirmacion de Entrega

`PATCH /api/donaciones/{id}/confirmacion-entrega` obtendra al actor desde el access token y la participacion registrada. No aceptara identificadores de usuario, tipo de actor ni estado.

Para una donacion `RESERVADA`:

- El propietario registrara `donanteConfirmoAt`.
- El receptor seleccionado registrara `receptorConfirmoAt`.
- Una confirmacion repetida respondera `200` sin duplicarse.
- La segunda confirmacion actualizara atomicamente el estado a `ENTREGADA` y registrara `entregadaAt`.

Un usuario ajeno recibira el mismo `404` que una donacion inexistente. `ENTREGADA` sera irreversible.

La identificacion persistente del receptor utilizara `solicitudAceptadaId -> Solicitud.solicitanteId`. La referencia debera apuntar a una Solicitud `ACEPTADA` de la misma donacion.

## Retirada Logica

`PATCH /api/donaciones/{id}/estado` aceptara exclusivamente `RETIRADA` y comprobara que el actor sea el propietario.

Si la donacion esta `PUBLICADA`, registrara `RETIRADA` y `retiradaAt`. Si ya esta `RETIRADA`, respondera `200` idempotente al propietario. Si esta `RESERVADA` o `ENTREGADA`, respondera `409`.

Cuando existan solicitudes pendientes, el cambio de estado y su cancelacion deberan realizarse atomicamente y conservar todo el historial. Esta coordinacion se implementara junto con 007, sin definir aqui el modelo completo de Solicitud.

## Paginacion y Orden

Los listados utilizaran:

- `page` con valor inicial `1`.
- `limit` con valor inicial `20` y maximo `100`.
- Metadatos `page`, `limit`, `total` y `totalPages`.

El orden sera estable:

1. `createdAt` descendente.
2. `id` descendente.

Los parametros invalidos produciran `400`.

## Listado General y Publicaciones Propias

El listado general filtrara simultaneamente:

- Estado `PUBLICADA`.
- Ciudad historica igual a la ciudad actual del usuario autenticado.
- Propietario diferente del usuario autenticado.
- Categoria, cuando se envie `categoriaId`.

Las publicaciones propias filtraran por `propietarioId` obtenido del token y aceptaran opcionalmente uno de los cuatro estados aprobados. No incluiran donaciones donde el usuario sea solo receptor.

Los campos exactos de ambos listados se aprobaran antes de implementar, como establece la especificacion.

## Visibilidad y Privacidad

La consulta individual aplicara las reglas por estado y participacion antes de construir la respuesta.

Una donacion inexistente y una donacion no visible produciran el mismo `404` y mensaje publico. No se devolveran objetos Prisma completos ni datos privados del propietario o receptor.

La supervision de `ADMIN` se implementara posteriormente mediante rutas de 010. Los endpoints normales no permitiran editar ni retirar publicaciones ajenas.

## Cuenta del Propietario Desactivada

La desactivacion del usuario debera coordinarse con Gestion de Usuarios para cambiar sus donaciones `PUBLICADA` a `RETIRADA` y conservar los demas estados como historial.

Una cuenta inactiva no podra autenticarse ni confirmar. Una donacion `RESERVADA` bloqueada por la inactividad del propietario o receptor requerira resolucion administrativa en 010; no se agregara ese flujo a los endpoints normales de esta feature.

010 podra ejecutar excepcionalmente `RESERVADA -> RETIRADA`, conservando `solicitudAceptadaId`, la Solicitud `ACEPTADA`, Chat, mensajes y confirmaciones, y dejando el chat en modo solo lectura.

## Integracion Futura con Solicitudes

La feature 007 implementara:

- Relacion definitiva con Solicitud.
- Seleccion del receptor.
- `PUBLICADA -> RESERVADA`.
- Cancelacion de las demas solicitudes al aceptar.
- Coordinacion atomica entre aceptacion y retirada.
- Cancelacion historica de solicitudes pendientes al retirar.
- Asignacion atomica de `solicitudAceptadaId` a una Solicitud `ACEPTADA` de la misma donacion.

El receptor se derivara mediante `Solicitud.solicitanteId`; no se agregara `receptorId` en Donacion.

## Integracion Administrativa

010 implementara la excepcion `RESERVADA -> RETIRADA`. La transaccion conservara `solicitudAceptadaId`, Solicitud `ACEPTADA`, Chat, mensajes y confirmaciones, registrara `retiradaAt` y su auditoria, y dejara el chat en modo solo lectura.

Este plan no implementa el modelo completo ni los endpoints de Solicitudes.

## Integracion Futura con Chat

La feature 008 creara la conversacion despues de aceptar una solicitud y conservara su historial. Donaciones solo proporcionara la referencia y el estado necesarios cuando esa integracion sea definida.

Este plan no implementa modelos, rutas ni mensajes de Chat.

## Integracion Futura con Calificaciones

La feature 009 utilizara `ENTREGADA` como condicion previa para habilitar la calificacion del donante.

Este plan no implementa el modelo, calculo ni endpoints de Calificaciones.

## Manejo de Errores

Las rutas reutilizaran el contrato de 004:

- `200` para consultas, actualizaciones, retirada, confirmaciones y operaciones idempotentes.
- `201` para creacion.
- `400` para datos, filtros, parametros, identificadores o imagenes invalidos.
- `401` para autenticacion ausente o invalida.
- `403` para una operacion prohibida cuando revelar la existencia sea aceptable.
- `404` para donacion inexistente o no visible.
- `405` con cabecera `Allow`.
- `409` para transiciones invalidas, edicion fuera de `PUBLICADA`, categoria inactiva o concurrencia.
- `500` seguro para errores internos.

## Riesgos

- Una transicion sin condicion atomica podria permitir reservar y retirar simultaneamente.
- Confirmaciones no atomicas podrian perder la segunda confirmacion o duplicar la entrega.
- Aceptar propietario, ciudad o actor desde el cliente permitiria suplantacion.
- Devolver el mismo detalle sin considerar el estado podria exponer publicaciones restringidas.
- Un reemplazo de imagenes no transaccional podria dejar la donacion sin referencias.
- No comprobar la categoria en la actualizacion permitiria asignar una categoria inactiva.
- Una desactivacion de usuario incompleta podria dejar publicaciones visibles sin propietario activo.
- Agregar anticipadamente modelos de Solicitudes, Chat o Calificaciones cambiaria responsabilidades no aprobadas.
- Una referencia `solicitudAceptadaId` inconsistente podria identificar un receptor incorrecto.
- Una resolucion administrativa incompleta podria perder la solicitud aceptada o parte del historial.

## Pruebas

Se cubriran como minimo:

- Creacion con propietario, ciudad y estado derivados por el servidor.
- Validaciones exactas de titulo y descripcion.
- Entre una y cinco imagenes, orden e imagen principal.
- Reemplazo completo de imagenes.
- Categoria inexistente, activa, inactiva y desactivada posteriormente.
- Listado general por estado, ciudad, propietario y categoria.
- Publicaciones propias y filtro por estado.
- Paginacion, limites y orden estable.
- Visibilidad individual por estado y participacion.
- Mismo `404` para inexistente y no visible.
- Actualizacion exclusiva del propietario y solo en `PUBLICADA`.
- Rechazo de campos protegidos y desconocidos.
- Retirada exitosa, idempotente y bloqueada por estados incompatibles.
- Confirmaciones del propietario y receptor.
- Confirmacion repetida idempotente.
- Segunda confirmacion atomica e irreversibilidad de `ENTREGADA`.
- Asignacion y consistencia de `solicitudAceptadaId`.
- Resolucion administrativa `RESERVADA -> RETIRADA` sin reescribir la Solicitud `ACEPTADA`.
- Conservacion de Chat, mensajes, confirmaciones e historial durante la resolucion.
- Respuestas `400`, `401`, `403`, `404`, `405`, `409` y `500`.
- Contrato uniforme y ausencia de datos sensibles.

Las pruebas se ejecutaran con Postman o herramienta equivalente y con la estrategia automatizada que se apruebe para el proyecto.

## Verificaciones

Antes de cerrar la feature se verificara:

- Schema Prisma valido.
- Migracion aplicada.
- Cliente Prisma regenerado.
- Siete endpoints funcionales.
- Reglas de propiedad, visibilidad y estados.
- Retirada y confirmacion doble.
- Paginacion y orden.
- Contrato de Manejo de Errores.
- Pruebas ejecutadas correctamente.
- Lint y build sin errores.
- Documentacion coincidente con la implementacion.
