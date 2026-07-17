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
- Exigir `AUTH_ACCESS_TOKEN_SECRET` suficientemente largo para firmar unicamente access tokens.
- Mantener las duraciones y el costo bcrypt en constantes internas aprobadas. El refresh token opaco no requiere secreto de firma.

## Validaciones

Se definiran esquemas independientes para:

- Registro.
- Inicio de sesion.
- Renovacion.
- Cierre de sesion.
- Variables de entorno.

El esquema de registro sera estricto y rechazara campos desconocidos, especialmente `rol`, `rolId`, `activo`, `passwordHash`, `id`, `createdAt` y `updatedAt`.

La normalizacion y validacion del registro sera:

- `nombreCompleto`: quitar espacios exteriores, reducir espacios repetidos a uno, conservar capitalizacion y tildes, y limitar a 100 caracteres.
- `nombreVisible`: quitar espacios exteriores, convertir a minusculas, exigir entre 3 y 30 caracteres y aceptar solo letras, numeros, punto y guion bajo sin espacios.
- `email`: quitar espacios exteriores, convertir a minusculas, validar el formato y limitar a 254 caracteres.
- `password`: exigir minimo 8 caracteres, una letra y un numero; rechazar cuando `bcrypt.truncates(password)` sea `true` para impedir entradas que superen 72 bytes UTF-8.
- `ciudad`: quitar espacios exteriores, reducir espacios repetidos a uno, conservar la capitalizacion ingresada y limitar a 100 caracteres.
- `telefono`: aceptar `null` o una cadena opcional; convertir la cadena vacia en `null` y permitir de 7 a 15 digitos con un `+` inicial opcional.
- `fotoPerfil`: convertir la cadena vacia en `null`, limitar a 500 caracteres y aceptar unicamente URL HTTP/HTTPS o ruta relativa iniciada por `/`.

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

bcryptjs se utilizara exclusivamente para crear y verificar `passwordHash`, con costo centralizado de 12 rondas. Antes de llamar a `hashPassword`, la validacion rechazara toda contrasena para la que `bcrypt.truncates(password)` sea `true`.

### Access Tokens

jose firmara access tokens de 15 minutos con un secreto exclusivo. Cada access token incluira `sub` y el UUID de la Sesion en `sid` dentro del token firmado.

La validacion comprobara firma, expiracion, `type: access`, `sub`, `sid`, existencia y vigencia de la Sesion, coincidencia de usuario y cuenta activa. Cuando se requiera rol, consultara el rol actual en la base de datos.

Sesion, Usuario y Rol se resolveran con una consulta eficiente que seleccione unicamente los identificadores, expiracion, revocacion, estado activo y codigo de rol necesarios.

### Refresh Tokens

El refresh token sera un valor opaco generado aleatoriamente con `node:crypto` y codificado en Base64URL. No sera JWT, no contendra claims, issuer ni audience y no se firmara con jose o HS256.

Antes de persistirlo se generara su hash SHA-256 hexadecimal. Solo ese hash se almacenara en `Sesion`; el token original se devolvera al cliente y nunca se almacenara en texto plano ni se registrara en logs. La persistencia, busqueda, rotacion y revocacion continuan pendientes.

### Rotacion

El endpoint de refresh validara el token, la sesion, el hash almacenado, la expiracion, la revocacion y el estado del usuario. Luego generara el nuevo par y actualizara atomicamente `refreshTokenHash` y `expiresAt`. La condicion de actualizacion debera impedir que dos solicitudes reutilicen simultaneamente el mismo token.

### Logout

El logout correlacionara la Sesion actual mediante `sid`, validara el refresh token recibido y asignara `revokedAt` solamente a esa Sesion. No afectara las demas sesiones del usuario. La revocacion invalidara inmediatamente los access tokens asociados a esa Sesion.

La revocacion de todas las sesiones invalidara todos los access tokens asociados. Una reactivacion posterior de la cuenta no restaurara sesiones ni tokens y requerira un nuevo login.

## Endpoints

### Registro

- Aceptar unicamente `POST`.
- Validar mediante un esquema Zod estricto y normalizar exclusivamente los siete campos aprobados.
- Comprobar unicidad del correo y nombre visible ya normalizados.
- Obtener exclusivamente `RolCodigo.USUARIO`; el cliente no podra seleccionar `ADMIN` ni enviar campos internos.
- Crear `passwordHash` mediante `hashPassword` y persistir solo los campos aprobados de `Usuario`.
- Usar las restricciones `UNIQUE` de PostgreSQL como garantia final ante concurrencia y traducir de forma segura los errores `P2002` conocidos a `409`.
- Tratar la ausencia del rol `USUARIO` como error interno `500`, sin asignar privilegios alternativos.
- Responder `201` con `data: {}` sin devolver `Usuario` ni `passwordHash`.
- No crear `Sesion`, access token ni refresh token y no iniciar sesion automaticamente.

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
- Confundir el access token JWT con el refresh token opaco permitiria usar un token en un flujo incorrecto.
- Devolver objetos Prisma completos podria exponer hashes o datos privados.
- Los secretos debiles o ausentes deben impedir el arranque de la aplicacion.
- La carpeta antigua del cliente Prisma no se eliminara hasta confirmar que no se utiliza.
- Antes de cerrar la feature se ejecutaran migracion, seed, generacion de Prisma, pruebas, lint y build.
