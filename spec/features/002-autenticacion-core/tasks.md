# Autenticacion Core - Tareas

## Fase 1 - Documentacion y Decisiones

- [x] Definir autenticacion mediante correo electronico y contrasena.
- [x] Aprobar access tokens de 15 minutos y refresh tokens de 7 dias.
- [x] Aprobar rotacion de refresh tokens y hash SHA-256.
- [x] Aprobar varias sesiones por usuario y logout de la sesion actual.
- [x] Aprobar los modelos definitivos `Rol`, `Usuario` y `Sesion` para esta feature.
- [x] Aprobar los contratos de los cuatro endpoints.
- [x] Aprobar las reglas de privacidad y el formato uniforme de respuestas.
- [x] Separar la documentacion en `spec.md`, `plan.md` y `tasks.md`.
- [x] Sincronizar documentalmente la claim `sid` y la validacion de Sesion para access tokens.

## Fase 2 - Dependencias y Entorno

- [ ] Solicitar aprobacion inmediatamente antes de instalar las dependencias.
- [ ] Instalar `bcryptjs`, `jose` y `zod`.
- [x] Crear `.env.example` con `DATABASE_URL` y `AUTH_ACCESS_TOKEN_SECRET` ficticios.
- [x] Permitir el seguimiento de `.env.example` sin exponer `.env`.
- [x] Validar `DATABASE_URL` con zod.
- [x] Validar `AUTH_ACCESS_TOKEN_SECRET` como obligatorio, no vacio y con minimo 32 caracteres.
- [x] Confirmar que solo el access token requiere secreto de firma.

## Fase 3 - Esquema Prisma

- [x] Disponer de modelos iniciales `Rol` y `Usuario`.
- [x] Actualizar `Rol` con `codigo` y `updatedAt`.
- [x] Actualizar `Usuario` con los campos definitivos de esta feature.
- [x] Agregar las restricciones unicas de `email` y `nombreVisible`.
- [x] Crear el modelo `Sesion` con UUID.
- [x] Agregar relaciones e indices de sesiones.
- [x] Confirmar que no se agreguen `calificacionPromedio` ni `totalDonaciones`.
- [x] Validar el esquema Prisma.

## Fase 4 - Migracion y Cliente Prisma

- [x] Definir el tratamiento de registros existentes para los nuevos campos obligatorios.
- [x] Crear una migracion nueva.
- [x] Revisar el SQL generado y la integridad referencial.
- [x] Aplicar la migracion en el entorno de desarrollo.
- [x] Configurar `generated/prisma` como ubicacion oficial del cliente.
- [x] Regenerar el cliente Prisma en `generated/prisma`.
- [x] Verificar que ningun archivo utilice `src/generated/prisma`.
- [x] Eliminar `src/generated/prisma` despues de verificar sus referencias.

## Fase 5 - Seed de Roles

- [ ] Crear el seed idempotente.
- [ ] Crear o actualizar el rol `ADMIN` por codigo.
- [ ] Crear o actualizar el rol `USUARIO` por codigo.
- [ ] Configurar el comando de ejecucion del seed.
- [ ] Ejecutar el seed varias veces y comprobar que no duplique registros.

## Fase 6 - Validaciones

- [ ] Crear la validacion de registro.
- [ ] Crear la validacion de login.
- [ ] Crear la validacion de refresh.
- [ ] Crear la validacion de logout.
- [ ] Normalizar el correo antes de almacenarlo o buscarlo.
- [ ] Validar la politica de contrasena.
- [ ] Validar los campos opcionales `telefono` y `fotoPerfil`.

## Fase 7 - Contrasenas y Tokens

- [x] Definir los roles permitidos `ADMIN` y `USUARIO`.
- [x] Centralizar la duracion del access token, la duracion del refresh token y el issuer y audience del access token.
- [x] Crear el hash de contrasenas con bcryptjs.
- [x] Crear la verificacion de contrasenas con bcryptjs.
- [x] Centralizar el costo bcrypt en 12 rondas.
- [x] Crear access tokens con jose mediante `HS256` y duracion de 15 minutos.
- [x] Incluir `sub`, `sid`, `role`, `type`, `iat` y `exp` en los access tokens.
- [x] Validar criptograficamente firma, expiracion, issuer y audience del access token.
- [x] Validar el formato de `sub`, `sid`, `role` y `type` del access token.
- [ ] Validar Sesion vigente, coincidencia con Usuario, cuenta activa y rol actual en PostgreSQL.
- [x] Generar refresh tokens opacos con aleatoriedad criptograficamente segura y codificacion Base64URL.
- [x] Crear el hash SHA-256 hexadecimal de refresh tokens con `node:crypto`.
- [x] Calcular la expiracion del refresh token a siete dias.
- [ ] Evitar que tokens, contrasenas y hashes se escriban en logs.

## Fase 8 - Servicios y Sesiones

- [ ] Crear el servicio de registro.
- [ ] Crear el servicio de inicio de sesion.
- [ ] Crear sesiones independientes por dispositivo.
- [ ] Persistir unicamente el hash SHA-256 del refresh token en `Sesion`.
- [ ] Buscar el hash del refresh token y verificar que la sesion este vigente y no revocada.
- [ ] Crear el servicio de renovacion.
- [ ] Implementar rotacion atomica del refresh token.
- [ ] Reemplazar el hash anterior durante la rotacion.
- [ ] Impedir la reutilizacion concurrente del token anterior.
- [ ] Revocar la sesion ante reutilizacion detectada o cierre de sesion.
- [ ] Crear el servicio de cierre de sesion actual.
- [ ] Rechazar sesiones expiradas o revocadas.
- [ ] Rechazar login y refresh para cuentas inactivas.

## Fase 9 - Endpoints

- [ ] Implementar `POST /api/auth/register`.
- [ ] Implementar `POST /api/auth/login`.
- [ ] Implementar `POST /api/auth/refresh`.
- [ ] Implementar `POST /api/auth/logout`.
- [ ] Rechazar metodos HTTP no permitidos.
- [ ] Aplicar el formato uniforme con `data` en todas las respuestas.
- [ ] Seleccionar explicitamente los datos publicos del login.
- [ ] Confirmar que ningun endpoint exponga hashes o datos privados.

## Fase 10 - Proteccion de Rutas

- [ ] Crear un mecanismo reutilizable para extraer el Bearer token.
- [ ] Validar access tokens en endpoints protegidos.
- [ ] Consultar eficientemente Sesion, Usuario y Rol desde `sid`.
- [ ] Exponer al endpoint protegido la identidad y el rol actual autenticados.
- [ ] Invalidar inmediatamente access tokens cuando su Sesion sea revocada.
- [ ] Diferenciar el access token JWT del refresh token opaco en servicios y endpoints.

## Fase 11 - Pruebas y Verificacion

- [ ] Configurar la estrategia de pruebas aprobada para el proyecto.
- [ ] Probar registro, normalizacion y conflictos de unicidad.
- [ ] Probar politica y hash de contrasenas.
- [ ] Probar login valido, credenciales invalidas y cuenta inactiva.
- [ ] Probar privacidad de las respuestas.
- [ ] Probar varias sesiones simultaneas.
- [ ] Probar expiracion y tipo de tokens.
- [ ] Probar rotacion y rechazo del refresh token anterior.
- [ ] Probar concurrencia durante la rotacion.
- [ ] Probar logout sin afectar otras sesiones.
- [ ] Probar access tokens con `sid` ausente, invalido, revocado o expirado.
- [ ] Probar que el rol actual de base de datos prevalezca sobre el token.
- [ ] Probar que reactivar una cuenta no restaure sesiones ni access tokens.
- [ ] Probar el formato de respuestas exitosas y de error.
- [x] Ejecutar lint.
- [ ] Ejecutar las pruebas.
- [x] Ejecutar el build.

## Fase 12 - Cierre Documental

- [ ] Registrar los resultados de las pruebas.
- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Actualizar el estado de la feature solo cuando todos los requisitos esten implementados.

## Criterios de Finalizacion

La feature unicamente podra marcarse como completada cuando:

- [ ] Todos los requisitos funcionales del spec esten implementados.
- [ ] Todas las reglas de negocio esten cumplidas.
- [ ] Todas las pruebas hayan sido ejecutadas correctamente.
- [x] El proyecto compile sin errores.
- [ ] La documentacion de la feature este actualizada.
