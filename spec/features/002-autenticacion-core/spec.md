# Autenticacion Core - Especificacion

## Objetivo

Implementar el sistema de autenticacion de DonApp para permitir el registro, inicio de sesion, renovacion de tokens y cierre de sesion de los usuarios, garantizando la seguridad de las credenciales y el acceso controlado a la API.

## Descripcion

La autenticacion se realizara mediante correo electronico y contrasena. Despues de iniciar sesion, Flutter enviara el access token en los endpoints protegidos mediante:

```http
Authorization: Bearer <access_token>
```

El access token durara 15 minutos. El refresh token durara 7 dias y Flutter lo enviara en el cuerpo de las peticiones de renovacion y cierre de sesion mediante HTTPS.

Cada dispositivo podra mantener una sesion independiente. Un mismo usuario podra tener varias sesiones activas simultaneamente.

## Requisitos Funcionales

**RF-001** Registrar usuarios mediante nombre completo, nombre visible, correo electronico, contrasena, ciudad, telefono opcional y fotografia de perfil opcional.

**RF-002** Permitir el inicio de sesion utilizando exclusivamente el correo electronico registrado y la contrasena.

**RF-003** Generar un access token con una duracion de 15 minutos despues de validar correctamente las credenciales.

**RF-004** Generar un refresh token con una duracion de 7 dias y asociarlo a una sesion.

**RF-005** Permitir varias sesiones simultaneas para un mismo usuario.

**RF-006** Renovar el access token mediante un refresh token valido.

**RF-007** Rotar el refresh token cada vez que sea utilizado.

**RF-008** Invalidar inmediatamente el refresh token anterior despues de una rotacion exitosa.

**RF-009** Cerrar unicamente la sesion asociada al refresh token recibido.

**RF-010** Validar el access token antes de permitir el acceso a endpoints protegidos.

**RF-011** Impedir el inicio de sesion y la renovacion de tokens de usuarios con cuentas inactivas.

**RF-012** Asignar automaticamente el rol `USUARIO` a toda cuenta nueva.

## Reglas de Negocio

**RN-001** El correo electronico sera el identificador utilizado para la autenticacion.

**RN-002** El correo electronico se normalizara eliminando espacios al inicio y al final y convirtiendolo a minusculas antes de almacenarlo o buscarlo.

**RN-003** No podran existir dos usuarios con el mismo correo electronico normalizado.

**RN-004** El nombre visible se normalizara a minusculas antes de consultar y almacenar. No podran existir dos usuarios con el mismo nombre visible normalizado.

**RN-005** La contrasena debera tener como minimo 8 caracteres.

**RN-006** La contrasena debera incluir al menos una letra y un numero.

**RN-006A** La contrasena se rechazara cuando `bcrypt.truncates(password)` sea `true`; no podra superar los 72 bytes UTF-8 procesados por bcrypt.

**RN-007** La contrasena nunca se almacenara ni se registrara en texto plano.

**RN-008** La contrasena se almacenara utilizando bcryptjs.

**RN-009** Todo usuario registrado recibira automaticamente el rol cuyo codigo sea `USUARIO`.

**RN-010** Los roles iniciales del sistema seran `ADMIN` y `USUARIO`.

**RN-011** Los roles iniciales se crearan mediante un seed idempotente.

**RN-012** Solo los usuarios con una cuenta activa podran iniciar sesion o renovar tokens.

**RN-013** Un usuario podra mantener varias sesiones activas simultaneamente.

**RN-014** Cada sesion tendra un refresh token independiente.

**RN-015** El access token tendra una duracion de 15 minutos.

**RN-016** El refresh token tendra una duracion de 7 dias.

**RN-017** Cada renovacion valida generara un access token nuevo y un refresh token nuevo.

**RN-018** Despues de una rotacion exitosa, el refresh token anterior dejara de ser valido.

**RN-019** El cierre de sesion revocara unicamente la sesion asociada al refresh token recibido.

**RN-020** El cierre simultaneo de todas las sesiones queda planificado para una version futura.

**RN-021** El nombre completo unicamente podra ser consultado por el propietario de la cuenta y por los administradores del sistema.

**RN-022** El telefono unicamente podra ser consultado por el propietario de la cuenta.

**RN-023** El correo electronico nunca sera visible para otros usuarios.

## Reglas de Seguridad

- Todas las operaciones de autenticacion deberan realizarse mediante HTTPS.
- Las entradas se validaran con zod.
- Las contrasenas se almacenaran exclusivamente como hashes de bcryptjs.
- Los refresh tokens se almacenaran exclusivamente como hashes SHA-256 generados con `node:crypto`.
- Unicamente el access token utilizara un secreto de firma, jose y `HS256`.
- Los secretos no se incluiran en el codigo ni se expondran al cliente.
- Los access tokens validaran firma, tipo, expiracion y claims requeridos.
- Un access token no podra utilizarse como refresh token ni viceversa.
- Los refresh tokens expirados, revocados o rotados seran rechazados.
- La rotacion actualizara el hash de forma atomica para evitar reutilizacion.
- `passwordHash` y `refreshTokenHash` nunca formaran parte de una respuesta HTTP.
- Las contrasenas y tokens nunca se escribiran en logs.
- Los errores de credenciales no revelaran si el correo existe.
- El rol enviado por el cliente durante el registro sera ignorado.
- Las respuestas seleccionaran explicitamente los campos permitidos.
- La informacion privada no se incluira en los claims del access token.
- `fotoPerfil` almacenara una URL o ruta, no la imagen directamente en PostgreSQL.

## Modelos de Datos Involucrados

### Rol

| Campo | Tipo | Reglas |
|---|---|---|
| id | Int | Clave primaria autoincremental |
| codigo | String | Obligatorio y unico |
| nombre | String | Obligatorio y unico |
| descripcion | String? | Opcional |
| createdAt | DateTime | Fecha de creacion |
| updatedAt | DateTime | Fecha de actualizacion |
| usuarios | Usuario[] | Usuarios asociados al rol |

Codigos iniciales: `ADMIN` y `USUARIO`.

### Usuario

| Campo | Tipo | Reglas |
|---|---|---|
| id | Int | Clave primaria autoincremental |
| nombreCompleto | String | Obligatorio; maximo 100 caracteres despues de normalizar |
| nombreVisible | String @db.VarChar(30) | Obligatorio; entre 3 y 30 caracteres; unico y normalizado a minusculas |
| email | String | Obligatorio; maximo 254 caracteres; unico y normalizado |
| passwordHash | String | Hash bcrypt de 60 caracteres; no forma parte del body ni de respuestas |
| ciudad | String | Obligatorio; maximo 100 caracteres despues de normalizar |
| telefono | String? | Opcional y privado; entre 7 y 15 digitos y maximo 16 caracteres con `+` |
| fotoPerfil | String? @db.VarChar(500) | URL HTTP/HTTPS o ruta relativa segura opcional; maximo 500 caracteres |
| activo | Boolean | Valor inicial `true` |
| rolId | Int | Clave foranea del rol |
| rol | Rol | Rol asignado |
| sesiones | Sesion[] | Sesiones del usuario |
| createdAt | DateTime | Fecha de creacion |
| updatedAt | DateTime | Fecha de actualizacion |

`calificacionPromedio` y `totalDonaciones` no forman parte de `Usuario` en esta feature. Se evaluaran al implementar Donaciones y Calificaciones.

### Sesion

| Campo | Tipo | Reglas |
|---|---|---|
| id | String | UUID y clave primaria |
| usuarioId | Int | Clave foranea del usuario |
| usuario | Usuario | Usuario propietario |
| refreshTokenHash | String | Hash SHA-256 unico |
| expiresAt | DateTime | Fecha de expiracion |
| revokedAt | DateTime? | Fecha de revocacion opcional |
| createdAt | DateTime | Fecha de creacion |
| updatedAt | DateTime | Fecha de actualizacion |

`Sesion` tendra indices para `usuarioId` y `expiresAt`, ademas de la restriccion unica para `refreshTokenHash`.

## Gestion de Tokens

### Access Token

- Firmado con jose.
- Duracion de 15 minutos.
- No se almacena en PostgreSQL.
- Claims: `sub`, `sid`, `role`, `type: access`, `iat` y `exp`.
- No contiene contrasenas, hashes ni informacion personal sensible.
- `sid` contiene el UUID de la `Sesion` que origino el token, forma parte del token firmado, no se recibe libremente del cliente y no se expone en respuestas normales.
- `sid` no contiene el refresh token ni su hash.

### Refresh Token

- Es un valor opaco generado aleatoriamente con `node:crypto` y codificado en Base64URL.
- No es un JWT, no contiene claims, no tiene issuer ni audience y no se firma con jose.
- Su duracion funcional es de 7 dias.
- En PostgreSQL se almacenara unicamente su hash SHA-256 hexadecimal en `Sesion`; el valor original se entregara al cliente y nunca se persistira en texto plano.
- La persistencia, busqueda, rotacion y revocacion funcionales continuan pendientes de implementacion.

## Validacion de Access Tokens y Sesiones

Todo guard autenticado comprobara firma valida, token no expirado, existencia de `sub` y `sid`, existencia de la Sesion, coincidencia `Sesion.usuarioId = sub`, `Sesion.revokedAt = null`, `Sesion.expiresAt` posterior a la fecha actual y `Usuario.activo = true`.

Cuando un endpoint requiera autorizacion por rol, el rol actual almacenado en la base de datos sera la fuente definitiva. No se confiara unicamente en un rol antiguo incluido en el token.

La validacion se resolvera mediante una consulta eficiente que seleccione solo `Sesion.id`, `Sesion.usuarioId`, `Sesion.expiresAt`, `Sesion.revokedAt`, `Usuario.id`, `Usuario.activo` y `Rol.codigo` cuando sea necesario. No se devolveran objetos Prisma completos.

El logout actual revocara la Sesion identificada por `sid`. Revocar una Sesion invalidara inmediatamente su access token; revocar todas las sesiones invalidara todos los access tokens asociados. Reactivar una cuenta no reactivara sesiones revocadas y exigira un nuevo inicio de sesion.

## Endpoints y Contratos

| Metodo | Endpoint | Descripcion |
|---|---|---|
| POST | `/api/auth/register` | Registrar un usuario |
| POST | `/api/auth/login` | Iniciar sesion |
| POST | `/api/auth/refresh` | Renovar y rotar tokens |
| POST | `/api/auth/logout` | Revocar la sesion actual |

### POST `/api/auth/register`

Entrada:

```json
{
  "nombreCompleto": "Nombre Apellido",
  "nombreVisible": "nombreusuario",
  "email": "usuario@example.com",
  "password": "password1",
  "ciudad": "Bogota",
  "telefono": "3000000000",
  "fotoPerfil": "https://example.com/foto.jpg"
}
```

`telefono` y `fotoPerfil` son opcionales. El registro no inicia sesion automaticamente.

El body sera estricto y aceptara exclusivamente `nombreCompleto`, `nombreVisible`, `email`, `password`, `ciudad`, `telefono` y `fotoPerfil`. Se rechazaran campos desconocidos, incluidos `rol`, `rolId`, `activo`, `passwordHash`, `id`, `createdAt` y `updatedAt`.

Las reglas de validacion y normalizacion del registro seran:

- `nombreCompleto`: obligatorio, entre 1 y 100 caracteres despues de quitar espacios exteriores y reducir espacios repetidos a uno. Conservara las mayusculas, minusculas y tildes ingresadas.
- `nombreVisible`: obligatorio, entre 3 y 30 caracteres; permitira unicamente letras, numeros, punto y guion bajo, sin espacios. Se quitaran espacios exteriores y se convertira a minusculas antes de consultar y almacenar.
- `email`: obligatorio, maximo 254 caracteres, con formato de correo valido. Se quitaran espacios exteriores y se convertira a minusculas antes de consultar y almacenar.
- `password`: obligatorio, minimo 8 caracteres, al menos una letra y un numero. Se rechazara cuando `bcrypt.truncates(password)` sea `true`, por lo que no podra superar los 72 bytes UTF-8 aceptados por bcrypt. Nunca se almacenara directamente; se transformara mediante `hashPassword`.
- `ciudad`: obligatoria, entre 1 y 100 caracteres despues de quitar espacios exteriores y reducir espacios repetidos a uno. Conservara la capitalizacion ingresada.
- `telefono`: opcional; una cadena vacia se convertira en `null`. Permitira de 7 a 15 digitos con un unico signo `+` inicial opcional y ningun otro caracter.
- `fotoPerfil`: opcional, maximo 500 caracteres; una cadena vacia se convertira en `null`. Aceptara unicamente una URL HTTP/HTTPS valida o una ruta relativa que comience con `/`; rechazara `data:`, `javascript:` y cualquier otro esquema.

El registro buscara exclusivamente `RolCodigo.USUARIO` y nunca aceptara un rol elegido por el cliente. Comprobara conflictos de `email` y `nombreVisible` normalizados antes de crear, y las restricciones `UNIQUE` de PostgreSQL seran la garantia final ante concurrencia. Un error Prisma `P2002` conocido se traducira de forma segura a `409`, sin exponer detalles internos. Si el rol `USUARIO` no existe, se respondera con un error interno `500` sin asignar un rol alternativo.

El exito respondera `201` con `data: {}`. No devolvera el objeto `Usuario`, la contrasena ni `passwordHash`. Tampoco creara `Sesion`, access token ni refresh token, y no iniciara sesion automaticamente.

Salida exitosa:

```json
{
  "success": true,
  "message": "Usuario registrado correctamente.",
  "data": {}
}
```

### POST `/api/auth/login`

Entrada:

```json
{
  "email": "usuario@example.com",
  "password": "password1"
}
```

Salida exitosa:

```json
{
  "success": true,
  "message": "Sesion iniciada correctamente.",
  "data": {
    "accessToken": "<access_token>",
    "refreshToken": "<refresh_token>",
    "accessTokenExpiresIn": 900,
    "refreshTokenExpiresIn": 604800,
    "usuario": {
      "id": 1,
      "nombreVisible": "nombreusuario",
      "fotoPerfil": "https://example.com/foto.jpg",
      "rol": {
        "codigo": "USUARIO",
        "nombre": "Usuario"
      }
    }
  }
}
```

La salida no incluye `nombreCompleto`, `telefono`, `email` ni otros datos privados.

### POST `/api/auth/refresh`

Entrada:

```json
{
  "refreshToken": "<refresh_token_actual>"
}
```

Salida exitosa:

```json
{
  "success": true,
  "message": "Tokens renovados correctamente.",
  "data": {
    "accessToken": "<access_token_nuevo>",
    "refreshToken": "<refresh_token_nuevo>",
    "accessTokenExpiresIn": 900,
    "refreshTokenExpiresIn": 604800
  }
}
```

La operacion conserva el identificador de la sesion, reemplaza atomicamente el hash anterior y actualiza su expiracion por 7 dias.

### POST `/api/auth/logout`

Entrada:

```json
{
  "refreshToken": "<refresh_token_actual>"
}
```

Salida exitosa:

```json
{
  "success": true,
  "message": "Sesion cerrada correctamente.",
  "data": {}
}
```

Solo se asigna `revokedAt` a la sesion correspondiente. Las demas sesiones permanecen activas.

## Formato Uniforme de Respuestas

Todas las respuestas incluiran el campo `data`.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Operacion realizada correctamente.",
  "data": {}
}
```

Respuesta con error:

```json
{
  "success": false,
  "status": 400,
  "message": "Descripcion del error.",
  "data": null
}
```

| Codigo | Uso |
|---|---|
| 200 | Login, refresh o logout exitoso |
| 201 | Usuario registrado |
| 400 | Datos invalidos |
| 401 | Credenciales o token invalidos |
| 403 | Cuenta inactiva |
| 409 | Correo o nombre visible duplicado |
| 405 | Metodo HTTP no permitido |
| 500 | Error interno del servidor |

## Variables de Entorno

```env
DATABASE_URL=
AUTH_ACCESS_TOKEN_SECRET=
```

El secreto del access token sera suficientemente largo y no usara el prefijo `NEXT_PUBLIC_`. El refresh token opaco no requiere secreto de firma.

## Dependencias Aprobadas

- `bcryptjs`: hash y verificacion de contrasenas.
- `jose`: generacion y validacion exclusiva de access tokens JWT.
- `zod`: validacion de solicitudes y variables de entorno.
- `node:crypto`: generacion aleatoria del refresh token opaco y hash SHA-256 hexadecimal.

No se instalaran dependencias adicionales sin aprobacion.

## Estado

Pendiente.

## Observaciones

Esta feature se completara antes de implementar la gestion de usuarios, donaciones, solicitudes y cualquier funcionalidad que requiera identificar al usuario autenticado.

El cierre de todas las sesiones y la recuperacion de contrasena quedan para versiones futuras.
