# Gestion de Usuarios - Especificacion

## Objetivo

Administrar el perfil de una cuenta previamente registrada y autenticada en DonApp, permitiendo consultar y actualizar su informacion de forma segura, cambiar la contrasena y desactivar la cuenta sin eliminar fisicamente su historial.

## Descripcion

Esta feature gestiona la informacion publica y privada del perfil de un usuario. Todas las operaciones sobre el perfil propio utilizaran la identidad obtenida del access token y no confiaran en identificadores enviados por el cliente.

La feature tambien permite consultar una representacion publica limitada de otros usuarios, sin exponer datos personales o secretos.

## Alcance

- Consulta del perfil propio.
- Actualizacion parcial del perfil propio.
- Consulta del perfil publico de un usuario activo.
- Cambio seguro de contrasena.
- Desactivacion logica de la cuenta.
- Proteccion de datos publicos, privados y secretos.

## Fuera de Alcance

- Registro de usuarios.
- Inicio de sesion.
- Renovacion de tokens.
- Cierre de sesion.
- Recuperacion de contrasena.
- Creacion administrativa de usuarios.
- Administracion global de usuarios.
- Cierre general de todas las sesiones solicitado directamente por el usuario.
- Endpoints de desactivacion, reactivacion o revocacion administrativa, que pertenecen a 010-administracion.

## Requisitos Funcionales

**RF-001** Consultar la informacion del perfil del usuario autenticado.

**RF-002** Consultar el perfil publico de un usuario activo.

**RF-003** Actualizar parcialmente el nombre completo, nombre visible, correo electronico, ciudad, telefono y foto de perfil.

**RF-004** Devolver el perfil propio actualizado despues de una modificacion exitosa.

**RF-005** Exigir la contrasena actual para modificar el correo electronico.

**RF-006** Permitir al usuario cambiar su contrasena despues de validar la contrasena actual.

**RF-007** Revocar todas las sesiones del usuario despues de cambiar la contrasena y exigir un nuevo inicio de sesion.

**RF-008** Permitir al usuario desactivar logicamente su propia cuenta despues de validar la contrasena actual.

**RF-009** Revocar todas las sesiones al desactivar la cuenta e impedir inmediatamente el acceso.

**RF-010** Validar en toda ruta protegida el access token, la existencia del usuario y que `Usuario.activo` sea `true`.

**RF-011** Impedir la actualizacion de campos protegidos o administrados por otras operaciones.

**RF-012** Retirar el endpoint provisional `GET /api/usuarios` cuando se implemente esta feature.

## Reglas de Negocio

**RN-001** Solo el propietario autenticado podra consultar y modificar su perfil propio.

**RN-002** La identidad del propietario se obtendra del access token y no de un identificador enviado por el cliente.

**RN-003** El perfil propio podra incluir `id`, `nombreCompleto`, `nombreVisible`, `email`, `ciudad`, `telefono`, `fotoPerfil`, `activo`, `rol`, `createdAt` y `updatedAt`.

**RN-004** El perfil publico incluira exclusivamente `id`, `nombreVisible`, `fotoPerfil` y `ciudad`.

**RN-005** El perfil publico de una cuenta inactiva no estara disponible.

**RN-006** La consulta publica de una cuenta inexistente o inactiva respondera con `404 Not Found` sin revelar cual de las dos condiciones ocurrio.

**RN-007** El nombre visible debera ser unico sin distinguir mayusculas y minusculas.

**RN-008** El correo electronico debera ser unico y se almacenara normalizado.

**RN-009** Para cambiar el correo electronico, el usuario debera validar su contrasena actual.

**RN-010** El telefono sera opcional y una cadena vacia se convertira en `null`.

**RN-011** La foto de perfil sera opcional.

**RN-012** `fotoPerfil` almacenara una URL o una ruta de la imagen de perfil; la imagen no se almacenara directamente en PostgreSQL.

**RN-013** Solo podran actualizarse `nombreCompleto`, `nombreVisible`, `email`, `ciudad`, `telefono` y `fotoPerfil` mediante el endpoint general de perfil.

**RN-014** No podran modificarse mediante el endpoint general `id`, `rolId`, `activo`, `passwordHash`, sesiones, `createdAt` ni `updatedAt`.

**RN-015** Para cambiar la contrasena, el usuario debera validar su contrasena actual.

**RN-016** La nueva contrasena respetara la politica definida en Autenticacion Core.

**RN-017** Una contrasena actual incorrecta producira una respuesta `401 Unauthorized`.

**RN-018** El cambio de contrasena revocara todas las sesiones y obligara a iniciar sesion nuevamente.

**RN-019** La desactivacion propia o administrativa establecera `activo = false`, revocara todas las sesiones activas y conservara fisicamente la cuenta y su historial.

**RN-020** La revocacion de todas las sesiones se realizara por cambio de contrasena o desactivacion de cuenta; 010 tambien podra ordenarla mediante su endpoint administrativo separado.

**RN-021** Esta feature no implementara un endpoint general para cerrar todas las sesiones ni duplicara el endpoint administrativo de 010.

**RN-022** La desactivacion coordinara Donaciones y Solicitudes segun las reglas transversales aprobadas, sin duplicar sus endpoints en esta feature.

**RN-023** El nombre completo solo podra ser consultado por el propietario y por los administradores mediante las funcionalidades que les correspondan.

**RN-024** El telefono solo podra ser consultado por el propietario.

**RN-025** El correo electronico nunca sera visible para otros usuarios.

**RN-026** El listado administrativo de usuarios pertenecera a la feature 010-administracion.

## Privacidad y Autorizacion

El perfil propio seleccionara explicitamente los campos permitidos. Nunca devolvera:

- `passwordHash`.
- Sesiones.
- `refreshTokenHash`.
- Secretos.
- Access tokens o refresh tokens almacenados o recibidos.

El perfil publico seleccionara exclusivamente `id`, `nombreVisible`, `fotoPerfil` y `ciudad`. No revelara si una cuenta fue desactivada o nunca existio.

Toda ruta protegida debera validar el access token, confirmar que el usuario exista y confirmar que `Usuario.activo` sea `true`.

## Coordinacion de la Desactivacion

Una desactivacion propia o administrativa debera coordinar consistentemente:

- `Usuario.activo = false`.
- Revocacion de todas sus sesiones activas.
- Rechazo inmediato de sus access tokens mediante la validacion de `sid`.
- Donaciones `PUBLICADA` del usuario a `RETIRADA`.
- Solicitudes `PENDIENTE` creadas por el usuario a `CANCELADA`, con causa `USUARIO_INACTIVO`.
- Solicitudes `PENDIENTE` recibidas en sus donaciones retiradas a `CANCELADA`, con causa `DONACION_RETIRADA`.

No modificara automaticamente donaciones `RESERVADA`, solicitudes `ACEPTADA`, chats, mensajes ni calificaciones. Las donaciones `RESERVADA` con participantes inactivos se resolveran mediante 010-administracion.

La reactivacion administrativa cambiara unicamente `Usuario.activo = true`. No restaurara sesiones, access tokens, donaciones retiradas, solicitudes canceladas ni estados historicos, y requerira un nuevo login.

Los endpoints administrativos pertenecen exclusivamente a 010. Esta feature aporta las reglas de dominio y coordinacion, pero no los duplica.

## Normalizacion y Validaciones

### Nombre Completo

- Se eliminaran los espacios al inicio y al final.
- Los espacios repetidos se reemplazaran por un solo espacio.

### Nombre Visible

- Se eliminaran los espacios al inicio y al final.
- Tendra entre 3 y 30 caracteres.
- Permitira letras, numeros, guion bajo y punto.
- No permitira espacios.
- Su unicidad se comprobara sin distinguir mayusculas y minusculas.

### Correo Electronico

- Se eliminaran los espacios al inicio y al final.
- Se convertira a minusculas.
- Debera tener un formato valido y ser unico.
- Su modificacion exigira `passwordActual`.

### Ciudad

- Se eliminaran los espacios al inicio y al final.
- La primera letra se almacenara en mayuscula y las demas en minusculas.

### Telefono

- Sera opcional.
- Tendra entre 7 y 15 digitos.
- Podra comenzar con el prefijo `+`.
- No admitira otros caracteres.
- Una cadena vacia se convertira en `null`.

### Foto de Perfil

- Sera opcional.
- Almacenara una URL o una ruta de la imagen de perfil.
- Tendra una longitud maxima de 500 caracteres.
- La imagen no se almacenara directamente en PostgreSQL.

### Actualizacion Parcial

- Debera incluir al menos un campo modificable.
- Rechazara campos desconocidos o protegidos.
- `passwordActual` sera una credencial auxiliar y no un campo persistente.
- `passwordActual` sera obligatorio cuando se modifique el correo electronico.

## Modelo de Datos Involucrado

La tabla principal es `Usuario`, definida por Autenticacion Core:

| Campo | Visibilidad o uso |
|---|---|
| id | Perfil propio y publico; no modificable |
| nombreCompleto | Perfil propio; administradores segun su feature |
| nombreVisible | Perfil propio y publico; modificable y unico |
| email | Perfil propio; modificable, privado y unico |
| passwordHash | Secreto; nunca se devuelve |
| ciudad | Perfil propio y publico; modificable |
| telefono | Perfil propio; modificable, opcional y privado |
| fotoPerfil | Perfil propio y publico; modificable y opcional |
| activo | Perfil propio; no modificable desde el perfil general |
| rolId | Interno; no modificable desde esta feature |
| rol | Perfil propio; no modificable desde esta feature |
| sesiones | Interno; nunca se devuelve |
| createdAt | Perfil propio; no modificable |
| updatedAt | Perfil propio; no modificable |

Esta feature no agregara `calificacionPromedio`, `totalDonaciones` ni campos pertenecientes a Donaciones o Calificaciones.

## Endpoints y Contratos

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/api/usuarios/perfil` | Consultar el perfil propio |
| PATCH | `/api/usuarios/perfil` | Actualizar parcialmente el perfil propio |
| GET | `/api/usuarios/{id}/publico` | Consultar un perfil publico activo |
| PUT | `/api/usuarios/password` | Cambiar la contrasena |
| PUT | `/api/usuarios/desactivar` | Desactivar la cuenta |

### GET `/api/usuarios/perfil`

Requiere un access token valido.

```json
{
  "success": true,
  "message": "Perfil consultado correctamente.",
  "data": {
    "usuario": {
      "id": 1,
      "nombreCompleto": "Nombre Apellido",
      "nombreVisible": "nombre.usuario",
      "email": "usuario@example.com",
      "ciudad": "Bogota",
      "telefono": "+573000000000",
      "fotoPerfil": "/perfiles/usuario.jpg",
      "activo": true,
      "rol": { "codigo": "USUARIO", "nombre": "Usuario" },
      "createdAt": "2026-07-15T12:00:00.000Z",
      "updatedAt": "2026-07-15T12:00:00.000Z"
    }
  }
}
```

### PATCH `/api/usuarios/perfil`

Requiere un access token valido. Todos los campos son opcionales, pero debe enviarse al menos un campo modificable.

Entrada:

```json
{
  "nombreCompleto": "Nombre Apellido",
  "nombreVisible": "nombre.usuario",
  "email": "nuevo@example.com",
  "passwordActual": "password1",
  "ciudad": "Bogota",
  "telefono": "",
  "fotoPerfil": "/perfiles/usuario.jpg"
}
```

`passwordActual` sera obligatorio unicamente cuando se envie `email`.

Salida:

```json
{
  "success": true,
  "message": "Perfil actualizado correctamente.",
  "data": {
    "usuario": {
      "id": 1,
      "nombreCompleto": "Nombre Apellido",
      "nombreVisible": "nombre.usuario",
      "email": "nuevo@example.com",
      "ciudad": "Bogota",
      "telefono": null,
      "fotoPerfil": "/perfiles/usuario.jpg",
      "activo": true,
      "rol": { "codigo": "USUARIO", "nombre": "Usuario" },
      "createdAt": "2026-07-15T12:00:00.000Z",
      "updatedAt": "2026-07-15T12:30:00.000Z"
    }
  }
}
```

### GET `/api/usuarios/{id}/publico`

Salida para una cuenta activa:

```json
{
  "success": true,
  "message": "Perfil publico consultado correctamente.",
  "data": {
    "usuario": {
      "id": 1,
      "nombreVisible": "nombre.usuario",
      "fotoPerfil": "/perfiles/usuario.jpg",
      "ciudad": "Bogota"
    }
  }
}
```

Si el usuario no existe o esta inactivo, respondera `404 Not Found` con el mismo mensaje para ambos casos.

### PUT `/api/usuarios/password`

Requiere un access token valido.

Entrada:

```json
{
  "passwordActual": "password1",
  "passwordNueva": "password2"
}
```

Salida:

```json
{
  "success": true,
  "message": "Contrasena actualizada correctamente. Debe iniciar sesion nuevamente.",
  "data": {}
}
```

La operacion revocara todas las sesiones.

### PUT `/api/usuarios/desactivar`

Requiere un access token valido.

Entrada:

```json
{
  "passwordActual": "password1"
}
```

Salida:

```json
{
  "success": true,
  "message": "Cuenta desactivada correctamente.",
  "data": {}
}
```

La operacion establecera `activo = false`, revocara todas las sesiones y conservara la cuenta y su historial.

## Manejo de Errores

Todas las respuestas conservaran el campo `data`.

```json
{
  "success": false,
  "status": 400,
  "message": "Descripcion del error.",
  "data": null
}
```

| Codigo | Situaciones principales |
|---|---|
| 400 | Datos invalidos, cuerpo vacio, campos desconocidos o protegidos |
| 401 | Access token ausente o invalido, o contrasena actual incorrecta |
| 403 | Operacion no autorizada |
| 404 | Usuario no encontrado o perfil publico inexistente o inactivo |
| 409 | Conflicto de correo electronico o nombre visible |
| 405 | Metodo HTTP no permitido |
| 500 | Error interno del servidor |

La contradiccion con la feature 004-manejo-errores se corregira posteriormente a favor de este formato.

## Dependencias

Esta feature depende de 002-autenticacion-core para validar access tokens, comprobar el estado activo, verificar y crear hashes de contrasenas, aplicar la politica de contrasenas, revocar sesiones y reutilizar zod.

No requiere dependencias adicionales a las aprobadas para Autenticacion Core.

## Estado

Implementada. Los endpoints de perfil, seguridad y consulta publica estan disponibles; los listados administrativos pertenecen a 010-administracion.

## Observaciones

El endpoint provisional `GET /api/usuarios` fue retirado. Los listados y operaciones administrativas pertenecen a 010-administracion.

Las calificaciones y el total de donaciones entregadas se incorporaran al perfil publico desde sus respectivas features.

La coordinacion de la desactivacion se implementara junto con Sesiones, Donaciones y Solicitudes. Las resoluciones de casos bloqueados y la reactivacion administrativa pertenecen a 010-administracion.
