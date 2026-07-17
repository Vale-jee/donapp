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
- [x] Instalar `tsx` como dependencia de desarrollo para ejecutar el seed TypeScript.
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

- [x] Crear el seed idempotente de roles en `prisma/seed.ts`.
- [x] Configurar oficialmente `tsx prisma/seed.ts` en `prisma.config.ts`.
- [x] Crear idempotentemente `RolCodigo.ADMIN` con nombre `Administrador`.
- [x] Crear idempotentemente `RolCodigo.USUARIO` con nombre `Usuario`.
- [x] Utilizar `createMany` con `skipDuplicates: true` sin modificar registros existentes.
- [x] Verificar despues de la insercion los codigos y nombres aprobados.
- [x] Detectar roles ausentes o nombres inconsistentes sin corregirlos automaticamente.
- [x] Cerrar correctamente Prisma al finalizar, incluso ante errores.
- [x] Ejecutar el seed dos veces y comprobar que no duplique registros.

Evidencia de ejecucion:

- Primera ejecucion: `created: 2`; `ADMIN` - `Administrador`; `USUARIO` - `Usuario`.
- Segunda ejecucion: `created: 0`; `ADMIN` - `Administrador`; `USUARIO` - `Usuario`.

## Fase 6 - Validaciones

- [x] Crear un esquema Zod estricto para el registro y rechazar campos no permitidos, incluido `rol`.
- [x] Validar y normalizar `nombreCompleto`, conservando capitalizacion y tildes.
- [x] Validar y normalizar `nombreVisible` a minusculas.
- [x] Validar y normalizar el correo a minusculas.
- [x] Validar la politica de contrasena y rechazar entradas truncadas por `bcrypt.truncates`.
- [x] Validar y normalizar `ciudad`, conservando su capitalizacion.
- [x] Validar el campo opcional `telefono`.
- [x] Validar el campo opcional `fotoPerfil`.
- [x] Crear un esquema Zod estricto para login.
- [x] Normalizar el correo de login quitando espacios exteriores y convirtiendolo a minusculas.
- [x] Conservar la contrasena de login sin transformaciones.
- [x] Rechazar la contrasena de login vacia o truncada por `bcrypt.truncates`.
- [ ] Crear la validacion de refresh.
- [ ] Crear la validacion de logout.

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

- [x] Crear el servicio de registro con datos previamente validados y normalizados.
- [x] Buscar y asignar automaticamente `RolCodigo.USUARIO`, seleccionando unicamente su identificador.
- [x] Comprobar previamente conflictos de correo y nombre visible.
- [x] Generar `passwordHash` mediante bcryptjs y crear `Usuario` sin exponer el hash.
- [x] Traducir de forma segura los conflictos Prisma `P2002` conocidos y desconocidos.
- [x] Tratar la ausencia del rol `USUARIO` como error interno seguro sin asignar otro rol.
- [x] Confirmar que el registro no crea `Sesion` ni genera access token o refresh token.
- [x] Crear el servicio de inicio de sesion.
- [x] Consultar unicamente los campos necesarios de `Usuario` y `Rol` durante el login.
- [x] Responder genericamente cuando el correo no exista o la contrasena sea incorrecta.
- [x] Verificar la contrasena mediante `verifyPassword`.
- [x] Crear una sesion independiente para cada login correcto.
- [x] Generar un refresh token opaco y persistir unicamente su hash SHA-256 en `Sesion`.
- [x] Crear `Sesion` con expiracion de siete dias.
- [x] Crear el access token con `sub`, `sid` y `role`.
- [x] Ejecutar en una transaccion la creacion de `Sesion` y del access token asociado.
- [ ] Buscar el hash del refresh token y verificar que la sesion este vigente y no revocada.
- [ ] Crear el servicio de renovacion.
- [ ] Implementar rotacion atomica del refresh token.
- [ ] Reemplazar el hash anterior durante la rotacion.
- [ ] Impedir la reutilizacion concurrente del token anterior.
- [ ] Revocar la sesion ante reutilizacion detectada o cierre de sesion.
- [ ] Crear el servicio de cierre de sesion actual.
- [ ] Rechazar sesiones expiradas o revocadas.
- [x] Rechazar el login de cuentas inactivas con HTTP `403`.
- [ ] Rechazar el refresh de cuentas inactivas.

## Fase 9 - Endpoints

- [x] Implementar `POST /api/auth/register` con Pages Router.
- [x] Responder el registro exitoso con HTTP `201` y `data: {}`.
- [x] Responder HTTP `400` para datos invalidos.
- [x] Responder HTTP `405` para metodos no permitidos e incluir `Allow: POST`.
- [x] Responder HTTP `409` para correo o nombre visible duplicados.
- [x] Responder HTTP `500` de forma segura ante errores internos.
- [x] Implementar `POST /api/auth/login`.
- [x] Responder el login exitoso con HTTP `200`.
- [x] Responder HTTP `400` para datos de login invalidos.
- [x] Responder HTTP `401` para correo inexistente o contrasena incorrecta.
- [x] Responder HTTP `403` para una cuenta inactiva.
- [x] Responder HTTP `405` para metodos no permitidos en login e incluir `Allow: POST`.
- [x] Responder HTTP `500` de forma segura ante errores internos del login.
- [ ] Implementar `POST /api/auth/refresh`.
- [ ] Implementar `POST /api/auth/logout`.
- [x] Aplicar el formato uniforme con `data` en las respuestas del registro.
- [x] Aplicar el formato uniforme con `data` en login.
- [ ] Aplicar el formato uniforme con `data` en refresh y logout.
- [x] Seleccionar explicitamente los datos publicos del login.
- [x] Confirmar que el endpoint de registro no exponga `passwordHash` ni datos internos.
- [x] Confirmar que el endpoint de login no exponga `passwordHash`, `refreshTokenHash` ni datos privados no aprobados.
- [ ] Confirmar que los endpoints de refresh y logout no expongan hashes o datos privados.

## Fase 10 - Proteccion de Rutas

- [ ] Crear un mecanismo reutilizable para extraer el Bearer token.
- [ ] Validar access tokens en endpoints protegidos.
- [ ] Consultar eficientemente Sesion, Usuario y Rol desde `sid`.
- [ ] Exponer al endpoint protegido la identidad y el rol actual autenticados.
- [ ] Invalidar inmediatamente access tokens cuando su Sesion sea revocada.
- [ ] Diferenciar el access token JWT del refresh token opaco en servicios y endpoints.

## Fase 11 - Pruebas y Verificacion

- [ ] Configurar la estrategia de pruebas aprobada para el proyecto.
- [x] Probar funcionalmente el registro, la normalizacion y los conflictos de unicidad.
- [x] Probar funcionalmente la politica y el hash de contrasenas durante el registro.
- [x] Verificar que el registro asigne `USUARIO`, conserve la cuenta activa y no cree sesiones.
- [x] Registrar en Postman la evidencia del registro exitoso con HTTP `201`.
- [ ] Registrar en Postman las evidencias de los casos de error del registro.
- [ ] Crear pruebas automatizadas para el registro.
- [x] Probar funcionalmente el login valido.
- [x] Probar funcionalmente la contrasena incorrecta.
- [x] Probar que `GET /api/auth/login` responda HTTP `405` con encabezado `Allow: POST`.
- [x] Verificar en PostgreSQL la creacion de una sesion activa y el rol asociado al usuario.
- [x] Registrar en Postman la evidencia del login exitoso con HTTP `200`.
- [x] Registrar en Postman la evidencia de credenciales invalidas con HTTP `401`.
- [x] Registrar la evidencia del HTTP `405`, el encabezado `Allow: POST` y la sesion activa en PostgreSQL.
- [ ] Probar funcionalmente el login de una cuenta inactiva.
- [x] Probar la privacidad de la respuesta del login.
- [ ] Probar la privacidad de las respuestas de refresh, logout y rutas protegidas.
- [ ] Probar varias sesiones simultaneas.
- [ ] Probar expiracion y tipo de tokens.
- [ ] Probar rotacion y rechazo del refresh token anterior.
- [ ] Probar concurrencia durante la rotacion.
- [ ] Probar logout sin afectar otras sesiones.
- [ ] Probar access tokens con `sid` ausente, invalido, revocado o expirado.
- [ ] Probar que el rol actual de base de datos prevalezca sobre el token.
- [ ] Probar que reactivar una cuenta no restaure sesiones ni access tokens.
- [x] Probar el formato de las respuestas exitosas y de error del registro.
- [x] Probar el formato de las respuestas HTTP `200`, `401` y `405` del login.
- [ ] Probar funcionalmente las respuestas HTTP `400`, `403` y `500` del login.
- [ ] Probar el formato de respuestas de refresh, logout y rutas protegidas.
- [x] Ejecutar lint.
- [ ] Ejecutar las pruebas.
- [x] Ejecutar el build.

Evidencia funcional del registro:

- Registro valido: HTTP `201`, `success: true` y `data: {}`; captura del caso exitoso conservada en Postman.
- Correo duplicado: HTTP `409`.
- `nombreVisible` duplicado sin distinguir mayusculas: HTTP `409`.
- Contrasena invalida: HTTP `400`.
- Intento de enviar `rol: ADMIN`: HTTP `400`, sin asignacion administrativa.
- Metodo `GET`: HTTP `405` con encabezado `Allow: POST`.
- Usuario almacenado con rol `USUARIO`, cuenta activa y datos normalizados.
- Cero sesiones creadas y ningun access token o refresh token generado.
- `passwordHash` no expuesto; hash verificado mediante bcryptjs sin registrar su valor.

Evidencia funcional del login:

- Login correcto: HTTP `200` con mensaje `"Sesión iniciada correctamente."`; evidencia conservada en Postman.
- Contrasena incorrecta: HTTP `401`; evidencia conservada en Postman.
- Metodo `GET /api/auth/login`: HTTP `405` con encabezado `Allow: POST`.
- Una sesion activa verificada en PostgreSQL; evidencia conservada de la consulta.
- Rol del usuario obtenido desde PostgreSQL.
- Refresh token opaco entregado al cliente y almacenamiento exclusivo de su hash SHA-256.
- Cero exposicion de contrasenas, `passwordHash` o `refreshTokenHash` en la respuesta.

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
