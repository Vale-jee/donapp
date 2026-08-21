# Categorias - Especificacion

## Objetivo

Administrar exclusivamente el catalogo de categorias utilizado por DonApp para clasificar las donaciones.

Esta feature se encarga de crear, consultar, actualizar, activar y desactivar categorias. No implementa donaciones, autenticacion, administracion general ni frontend.


## Descripcion

Este modulo define el catalogo de categorias disponible en la aplicacion. Las categorias facilitan la organizacion de las publicaciones y permiten que los usuarios seleccionen una clasificacion valida al crear nuevas donaciones.

La feature establece las reglas funcionales y los contratos REST del catalogo. La autenticacion y la autorizacion tecnica seran reutilizadas desde las features correspondientes.


## Alcance

Esta feature define:

- El CRUD de categorias mediante creacion, consulta, actualizacion y desactivacion logica.
- Las reglas de negocio del catalogo.
- Las validaciones de categorias.
- Los contratos de la API REST.
- La politica de autorizacion administrativa.
- Los datos iniciales del catalogo.
- La relacion futura con Donaciones.


## Fuera de Alcance

No pertenecen a esta feature:

- La autenticacion.
- La implementacion tecnica de la autorizacion.
- Las donaciones.
- Las solicitudes.
- El chat.
- Las calificaciones.
- El frontend Flutter.
- Las imagenes o iconos de categorias.
- Las jerarquias de categorias.
- Las estadisticas.


## Tecnologias

- Next.js 16.2.10.
- TypeScript 5.9.3.
- PostgreSQL 16.x.
- Prisma ORM 7.8.0.
- Zod para las validaciones.


## Requisitos Funcionales

**RF-001** Consultar publicamente el catalogo de categorias activas.

**RF-002** Consultar una categoria activa por su identificador.

**RF-003** Permitir a un administrador consultar los detalles de categorias activas e inactivas mediante autenticacion.

**RF-004** Permitir unicamente a los administradores crear categorias.

**RF-005** Permitir unicamente a los administradores actualizar categorias.

**RF-006** Permitir unicamente a los administradores activar y desactivar categorias.

**RF-007** Listar unicamente categorias activas para crear nuevas donaciones.

**RF-008** Crear las categorias iniciales mediante un seed idempotente.


## Reglas de Negocio

**RN-001** No podran existir dos categorias con el mismo nombre normalizado, sin distinguir mayusculas y minusculas.

**RN-002** Solo los administradores podran crear categorias.

**RN-003** Solo los administradores podran actualizar categorias.

**RN-004** Solo los administradores podran activar o desactivar categorias.

**RN-005** Una categoria desactivada no podra utilizarse para nuevas donaciones.

**RN-006** Las donaciones existentes conservaran su categoria aunque esta sea desactivada.

**RN-007** Una categoria desactivada podra reactivarse.

**RN-008** Activar una categoria que ya se encuentre activa sera una operacion idempotente exitosa.

**RN-009** Desactivar una categoria que ya se encuentre inactiva sera una operacion idempotente exitosa.

**RN-010** No se permitira eliminar fisicamente una categoria.


## CRUD y Eliminacion Logica

La feature implementara las siguientes operaciones:

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/api/categorias` | Consultar publicamente las categorias activas |
| GET | `/api/categorias/{id}` | Consultar una categoria por identificador |
| POST | `/api/categorias` | Crear una categoria como administrador |
| PATCH | `/api/categorias/{id}` | Actualizar parcialmente una categoria como administrador |
| PATCH | `/api/categorias/{id}/estado` | Activar o desactivar una categoria como administrador |

No existira un endpoint `DELETE`. La eliminacion fisica no forma parte del diseño porque DonApp utiliza desactivacion logica para conservar la integridad historica de las donaciones asociadas.


## Modelo Conceptual Categoria

| Campo | Tipo conceptual | Reglas |
|---|---|---|
| `id` | Int | Clave primaria autoincremental |
| `nombre` | String | Obligatorio y unico bajo comparacion normalizada |
| `descripcion` | String? | Opcional |
| `activo` | Boolean | Obligatorio; valor inicial `true` |
| `createdAt` | DateTime | Fecha de creacion |
| `updatedAt` | DateTime | Fecha de ultima actualizacion |

Esta feature no agrega todavia relaciones Prisma. La feature Donaciones dependera posteriormente de `Categoria` y definira la relacion correspondiente con `Donacion`.


## Normalizacion y Validaciones

### Nombre

- Es obligatorio.
- Debe tener entre 3 y 80 caracteres despues de normalizarse.
- Se eliminaran los espacios al inicio y al final.
- Los espacios internos repetidos se reduciran a un solo espacio.
- La comparacion de unicidad no distinguira mayusculas y minusculas.
- Debe ser unico despues de la normalizacion.

### Descripcion

- Es opcional.
- Tendra un maximo de 250 caracteres despues de normalizarse.
- Se eliminaran los espacios al inicio y al final.
- Una cadena vacia se convertira en `null`.

### Identificador

- Debe ser un entero positivo.

### Reglas de los Cuerpos

- Se rechazaran campos desconocidos.
- Se rechazaran cuerpos vacios cuando la operacion requiera datos.
- El `PATCH` general no permitira modificar `id`, `activo`, `createdAt` ni `updatedAt`.
- El estado se modificara exclusivamente mediante `PATCH /api/categorias/{id}/estado`.


## Autenticacion y Autorizacion

`GET /api/categorias` es publico y no requiere autenticacion.

La consulta publica individual de una categoria activa tampoco requiere autenticacion. Los detalles administrativos de categorias activas o inactivas podran consultarse mediante autenticacion y requeriran rol `ADMIN`.

Unicamente un usuario autenticado, activo y con rol `ADMIN` podra:

- Crear categorias.
- Actualizar categorias.
- Activar o desactivar categorias.

Una solicitud a una operacion protegida sin autenticacion valida respondera `401 Unauthorized`. Un usuario autenticado sin los permisos requeridos respondera `403 Forbidden`.

Esta feature define la politica de acceso, pero reutilizara la implementacion tecnica de autenticacion y autorizacion aprobada en `002-autenticacion-core`.


## Endpoints y Contratos

### GET `/api/categorias`

Es un endpoint publico. Devuelve unicamente categorias activas y no requiere paginacion para el catalogo inicial.

La representacion publica incluye exclusivamente:

- `id`.
- `nombre`.
- `descripcion`, cuando exista.

No devuelve:

- `activo`.
- `createdAt`.
- `updatedAt`.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Categorias consultadas correctamente.",
  "data": {
    "categorias": [
      {
        "id": 1,
        "nombre": "Ropa y calzado",
        "descripcion": null
      }
    ]
  }
}
```

### GET `/api/categorias/{id}`

La consulta publica devuelve `200 OK` cuando la categoria existe y esta activa. Si la categoria no existe o esta inactiva para el consumidor publico, responde `404 Not Found`.

Si la categoria no existe o esta inactiva para una consulta publica, la API respondera siempre con el mismo codigo HTTP `404` y el mismo mensaje publico. El cliente nunca podra distinguir si el identificador no existe o si la categoria esta inactiva. Esta regla evita revelar informacion sobre el estado interno del catalogo.

Los detalles administrativos de categorias activas e inactivas podran consultarse mediante autenticacion con rol `ADMIN`.

Respuesta publica exitosa:

```json
{
  "success": true,
  "message": "Categoria consultada correctamente.",
  "data": {
    "categoria": {
      "id": 1,
      "nombre": "Ropa y calzado",
      "descripcion": null
    }
  }
}
```

### POST `/api/categorias`

Requiere autenticacion y rol `ADMIN`.

Entrada:

```json
{
  "nombre": "Ropa y calzado",
  "descripcion": "Prendas de vestir y calzado."
}
```

La categoria se creara activa. Una categoria creada correctamente respondera `201 Created`.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Categoria creada correctamente.",
  "data": {
    "categoria": {
      "id": 1,
      "nombre": "Ropa y calzado",
      "descripcion": "Prendas de vestir y calzado.",
      "activo": true,
      "createdAt": "2026-07-16T12:00:00.000Z",
      "updatedAt": "2026-07-16T12:00:00.000Z"
    }
  }
}
```

### PATCH `/api/categorias/{id}`

Requiere autenticacion y rol `ADMIN`. Permite actualizar parcialmente `nombre` y `descripcion`; debe enviarse al menos uno de estos campos.

El endpoint solo permite modificar `nombre` y `descripcion`. No permite modificar `id`, `activo`, `createdAt`, `updatedAt` ni relaciones actuales o futuras del modelo. Cualquier intento de modificar relaciones sera rechazado.

Entrada:

```json
{
  "nombre": "Ropa, calzado y accesorios",
  "descripcion": "Prendas, zapatos y accesorios."
}
```

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Categoria actualizada correctamente.",
  "data": {
    "categoria": {
      "id": 1,
      "nombre": "Ropa, calzado y accesorios",
      "descripcion": "Prendas, zapatos y accesorios.",
      "activo": true,
      "createdAt": "2026-07-16T12:00:00.000Z",
      "updatedAt": "2026-07-16T13:00:00.000Z"
    }
  }
}
```

### PATCH `/api/categorias/{id}/estado`

Requiere autenticacion y rol `ADMIN`. Permite activar o desactivar una categoria y devuelve la categoria actualizada.

Entrada:

```json
{
  "activo": false
}
```

La categoria podra reactivarse. Solicitar el mismo estado actual producira una respuesta exitosa sin crear un conflicto.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Estado de la categoria actualizado correctamente.",
  "data": {
    "categoria": {
      "id": 1,
      "nombre": "Ropa y calzado",
      "descripcion": null,
      "activo": false,
      "createdAt": "2026-07-16T12:00:00.000Z",
      "updatedAt": "2026-07-16T13:00:00.000Z"
    }
  }
}
```


## Manejo de Errores

Todas las respuestas se alinearan con el contrato transversal aprobado en `004-manejo-errores`.

Respuesta de error:

```json
{
  "success": false,
  "status": 400,
  "message": "Descripción del error.",
  "data": null
}
```

Cuando existan errores de validacion asociados a campos concretos, podra incluirse el campo opcional `errors`:

```json
{
  "success": false,
  "status": 400,
  "message": "Los datos enviados no son validos.",
  "data": null,
  "errors": {
    "nombre": [
      "El nombre debe tener entre 3 y 80 caracteres."
    ]
  }
}
```

`errors` solo se utilizara para validaciones por campo. En cualquier otro error sera `null` o se omitira.

| Codigo | Uso en Categorias |
|---|---|
| 200 | Consulta, actualizacion o cambio de estado exitoso |
| 201 | Categoria creada correctamente |
| 400 | Datos, cuerpo o identificador invalidos |
| 401 | Autenticacion ausente o invalida en una operacion protegida |
| 403 | Usuario autenticado sin rol `ADMIN` |
| 404 | Categoria inexistente o categoria inactiva para el consumidor publico |
| 405 | Metodo HTTP no permitido |
| 409 | Nombre de categoria duplicado bajo comparacion normalizada |
| 500 | Error interno del servidor |

Las respuestas `405 Method Not Allowed` incluiran la cabecera HTTP `Allow` con los metodos permitidos.


## Datos Iniciales y Seed

Las categorias iniciales del sistema seran:

- Ropa y calzado.
- Alimentos.
- Libros.
- Juguetes.
- Tecnología.
- Muebles.
- Artículos para el hogar.
- Salud.
- Útiles escolares.
- Otros.

Las diez categorias iniciales se crearan mediante un seed idempotente. En cada ejecucion, el seed:

- Creara las categorias inexistentes.
- Nunca eliminara categorias existentes.
- Nunca modificara categorias existentes.
- Nunca reactivara categorias existentes.


## Paginacion

El catalogo inicial de categorias activas no requiere paginacion. La necesidad de paginacion podra evaluarse en versiones futuras.


## Dependencias

Esta feature depende de:

- `002-autenticacion-core` para autenticar usuarios y comprobar el rol `ADMIN` en las operaciones protegidas.
- `004-manejo-errores` para aplicar el contrato uniforme de respuestas y errores.

La feature `006-donaciones` dependera posteriormente de Categorias para asociar una donacion y comprobar que la categoria seleccionada se encuentre activa.

Se reutilizaran Next.js, TypeScript, Prisma ORM y Zod. No se requieren dependencias adicionales.


## Estado

Implementada. La API expone los cinco metodos documentados y utiliza cache local con TTL de 60 segundos.


## Observaciones

Las donaciones existentes conservaran su categoria cuando esta sea desactivada. La relacion Prisma y la validacion que impide utilizar categorias inactivas en nuevas donaciones se definiran e implementaran en `006-donaciones`.
