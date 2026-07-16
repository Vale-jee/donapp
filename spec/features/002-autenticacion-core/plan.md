# Autenticacion Core - Plan de Implementacion

## Estrategia Tecnica

La feature se implementara por capas para separar las rutas HTTP, las validaciones, la logica de autenticacion y el acceso a datos. Los endpoints de Next.js delegaran las operaciones a servicios y no consultaran Prisma directamente salvo a traves de la capa definida para la feature.

El flujo general sera:

```text
Flutter
  -> API REST de Next.js
  -> validaciones con zod
  -> servicios de autenticacion
  -> Prisma ORM
  -> PostgreSQL
```

## Arquitectura y Organizacion de Archivos

La ubicacion exacta respetara las convenciones existentes. Se preve crear o modificar archivos con estas responsabilidades:

```text
prisma/
  schema.prisma
  seed.ts
  migrations/

generated/
  prisma/

lib/
  config/
    env.ts
  auth/
    password.ts
    tokens.ts
    refresh-token.ts
    authenticate.ts
  validations/
    auth.ts
  services/
    auth-service.ts

src/pages/api/auth/
  register.ts
  login.ts
  refresh.ts
  logout.ts
```

Los nombres finales podran adaptarse a las convenciones que se confirmen al implementar, sin cambiar responsabilidades ni contratos.

## Orden de Implementacion

1. Actualizar los modelos Prisma.
2. Revisar el esquema de datos.
3. Crear y revisar la migracion.
4. Regenerar el cliente Prisma oficial.
5. Instalar exclusivamente las dependencias aprobadas.
6. Configurar y validar variables de entorno.
7. Verificar y retirar el cliente generado antiguo.
8. Crear y ejecutar el seed idempotente de roles.
9. Implementar validaciones.
10. Implementar utilidades criptograficas y de tokens.
11. Implementar servicios de autenticacion y sesiones.
12. Implementar los cuatro endpoints.
13. Implementar la validacion reutilizable de access tokens.
14. Crear y ejecutar las pruebas.
15. Verificar lint, build, migracion y documentacion.

## Cambios Previstos en Prisma

### Rol

- Mantener `id`, `nombre`, `descripcion`, `createdAt` y la relacion con usuarios.
- Agregar `codigo` como campo unico.
- Agregar `updatedAt`.
- Usar `codigo` para identificar `ADMIN` y `USUARIO` sin depender del texto visible.

### Usuario

- Sustituir `nombre` por `nombreCompleto` y `nombreVisible`.
- Marcar `nombreVisible` como unico.
- Mantener `email` unico y almacenar siempre su valor normalizado.
- Mantener `passwordHash`, `telefono`, `activo`, el rol y las fechas.
- Agregar `ciudad`, `fotoPerfil` y la relacion con sesiones.
- No agregar `calificacionPromedio` ni `totalDonaciones` en esta feature.

### Sesion

- Crear el modelo con UUID como identificador.
- Relacionarlo con `Usuario` mediante `usuarioId`.
- Almacenar unicamente `refreshTokenHash` con restriccion unica.
- Registrar expiracion, revocacion, creacion y actualizacion.
- Crear indices para `usuarioId` y `expiresAt`.

## Migracion y Generacion del Cliente

- Crear una migracion nueva sin modificar manualmente migraciones ya aplicadas.
- Revisar las operaciones generadas antes de ejecutarlas.
- Evaluar el tratamiento de datos existentes al reemplazar `Usuario.nombre` y agregar campos obligatorios.
- Regenerar el cliente en la ubicacion oficial `generated/prisma`.
- Buscar referencias a `src/generated/prisma` en todo el proyecto.
- Eliminar `src/generated/prisma` solo despues de confirmar que no tiene consumidores.

## Seed de Roles

El seed realizara operaciones idempotentes por `codigo` para garantizar:

| Codigo | Nombre |
|---|---|
| ADMIN | Administrador |
| USUARIO | Usuario |

El registro buscara el rol por `codigo: USUARIO`. Si el rol no existe, la operacion fallara de forma controlada sin asignar privilegios alternativos.

## Configuracion del Entorno

- Crear `.env.example` con todas las claves requeridas.
- Ajustar `.gitignore` para permitir versionar `.env.example` sin versionar `.env`.
- Ampliar `lib/config/env.ts` para validar variables con zod.
- Exigir secretos diferentes y suficientemente largos.
- Interpretar `15m`, `7d` y `BCRYPT_ROUNDS` desde configuracion validada.

## Validaciones

Se definiran esquemas independientes para:

- Registro.
- Inicio de sesion.
- Renovacion.
- Cierre de sesion.
- Variables de entorno.

El correo se normalizara con eliminacion de espacios exteriores y conversion a minusculas. La contrasena exigira al menos 8 caracteres, una letra y un numero. Los campos opcionales aceptaran solo los formatos establecidos en el contrato.

## Servicios de Autenticacion

Los servicios centralizaran:

- Registro y deteccion de conflictos de unicidad.
- Obtencion del rol `USUARIO`.
- Hash y verificacion de contrasenas.
- Validacion de cuenta activa.
- Creacion de sesiones.
- Emision y validacion de tokens.
- Rotacion atomica del refresh token.
- Revocacion de la sesion actual.
- Seleccion explicita de datos publicos para las respuestas.

## Tokens y Sesiones

### Contrasenas

bcryptjs se utilizara exclusivamente para crear y verificar `passwordHash`. El coste se obtendra de `BCRYPT_ROUNDS`.

### Access Tokens

jose firmara access tokens de 15 minutos con un secreto exclusivo. Cada access token incluira `sub` y el UUID de la Sesion en `sid` dentro del token firmado.

La validacion comprobara firma, expiracion, `type: access`, `sub`, `sid`, existencia y vigencia de la Sesion, coincidencia de usuario y cuenta activa. Cuando se requiera rol, consultara el rol actual en la base de datos.

Sesion, Usuario y Rol se resolveran con una consulta eficiente que seleccione unicamente los identificadores, expiracion, revocacion, estado activo y codigo de rol necesarios.

### Refresh Tokens

jose firmara refresh tokens de 7 dias con un secreto diferente. Cada token incluira el identificador de sesion en `sid`.

Antes de persistirlo, se generara un hash SHA-256 mediante `node:crypto`. El token original solo se devolvera al cliente y nunca se registrara en logs.

### Rotacion

El endpoint de refresh validara el token, la sesion, el hash almacenado, la expiracion, la revocacion y el estado del usuario. Luego generara el nuevo par y actualizara atomicamente `refreshTokenHash` y `expiresAt`. La condicion de actualizacion debera impedir que dos solicitudes reutilicen simultaneamente el mismo token.

### Logout

El logout correlacionara la Sesion actual mediante `sid`, validara el refresh token recibido y asignara `revokedAt` solamente a esa Sesion. No afectara las demas sesiones del usuario. La revocacion invalidara inmediatamente los access tokens asociados a esa Sesion.

La revocacion de todas las sesiones invalidara todos los access tokens asociados. Una reactivacion posterior de la cuenta no restaurara sesiones ni tokens y requerira un nuevo login.

## Endpoints

### Registro

- Aceptar unicamente `POST`.
- Validar y normalizar la entrada.
- Comprobar unicidad de correo y nombre visible.
- Obtener el rol `USUARIO`.
- Crear el hash de la contrasena y el usuario.
- No crear sesion ni devolver el usuario.

### Login

- Validar credenciales sin revelar si el correo existe.
- Rechazar cuentas inactivas.
- Crear una sesion nueva para el dispositivo.
- Devolver tokens y solo `id`, `nombreVisible`, `fotoPerfil` y rol.

### Refresh

- Recibir el refresh token en el cuerpo.
- Rotarlo de forma atomica.
- Devolver un access token y un refresh token nuevos.

### Logout

- Recibir el refresh token en el cuerpo.
- Revocar unicamente la sesion actual.
- Conservar `data: {}` en la respuesta exitosa.

Todos los errores incluiran `data: null` y todas las respuestas exitosas incluiran `data`.

## Pruebas

Se cubriran como minimo:

- Registro valido y normalizacion del correo.
- Conflictos de correo y nombre visible.
- Politica de contrasena.
- Asignacion exclusiva del rol `USUARIO`.
- Login valido, credenciales invalidas y cuenta inactiva.
- Privacidad de la respuesta del login.
- Varias sesiones para un usuario.
- Firma, tipo y expiracion de tokens.
- Refresh valido y rotacion.
- Rechazo del token anterior despues de rotar.
- Rechazo de sesiones expiradas o revocadas.
- Concurrencia sobre un mismo refresh token.
- Logout de la sesion actual sin afectar otras sesiones.
- Metodos HTTP no permitidos y formato uniforme de respuestas.

## Riesgos y Verificaciones

- La sustitucion de campos obligatorios puede fallar si existen usuarios sin datos equivalentes; la migracion debe revisarse antes de aplicarse.
- Los errores de unicidad deben manejar condiciones de carrera, no solo comprobaciones previas.
- Una rotacion no atomica permitiria reutilizar refresh tokens.
- Mezclar secretos o tipos de token permitiria usar un token en un flujo incorrecto.
- Devolver objetos Prisma completos podria exponer hashes o datos privados.
- Los secretos debiles o ausentes deben impedir el arranque de la aplicacion.
- La carpeta antigua del cliente Prisma no se eliminara hasta confirmar que no se utiliza.
- Antes de cerrar la feature se ejecutaran migracion, seed, generacion de Prisma, pruebas, lint y build.
