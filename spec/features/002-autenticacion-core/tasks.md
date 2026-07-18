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
- [x] Crear un esquema Zod estricto para refresh y rechazar campos adicionales.
- [x] Validar `refreshToken` como Base64URL de exactamente 43 caracteres sin transformarlo.
- [x] Reutilizar el esquema estricto de refresh mediante `logoutSchema` y exportar `LogoutInput`.

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
- [x] Endurecer `sub` para aceptar unicamente identificadores enteros positivos y seguros.
- [x] Validar durante el refresh la Sesion vigente, la cuenta activa y el rol actual en PostgreSQL.
- [x] Validar Sesion vigente, coincidencia con Usuario, cuenta activa y rol actual en guards.
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
- [x] Calcular el hash SHA-256 del refresh token y buscar la Sesion mediante ese hash.
- [x] Consultar unicamente los campos necesarios de `Sesion`, `Usuario` y `Rol` durante el refresh.
- [x] Crear el servicio de renovacion.
- [x] Validar uniformemente la Sesion inexistente, revocada o vencida.
- [x] Implementar la rotacion atomica del refresh token en la misma Sesion.
- [x] Generar un refresh token opaco nuevo y reemplazar el hash anterior.
- [x] Conservar el mismo `sid` y renovar `expiresAt` por siete dias.
- [x] Obtener el rol actual desde PostgreSQL y generar un access token nuevo.
- [x] Ejecutar la renovacion mediante una transaccion interactiva.
- [x] Impedir el doble uso concurrente mediante `updateMany` condicionado y `rotation.count === 1`.
- [x] Calcular el hash SHA-256 del refresh token y localizar la Sesion mediante `refreshTokenHash` durante el logout.
- [x] Revocar unicamente la Sesion actual asignando `revokedAt` sin eliminarla ni modificar su hash o expiracion.
- [x] Crear el servicio de cierre de sesion actual mediante un `updateMany` atomico.
- [x] Rechazar uniformemente el logout con token desconocido, vencido o revocado.
- [ ] Revocar la sesion ante una reutilizacion detectada fuera del flujo de logout.
- [x] Rechazar durante el refresh las sesiones expiradas o revocadas con HTTP `401` uniforme.
- [x] Rechazar el login de cuentas inactivas con HTTP `403`.
- [x] Rechazar el refresh de cuentas inactivas con HTTP `403` sin rotar ni revocar la Sesion.

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
- [x] Implementar `POST /api/auth/refresh` con Pages Router.
- [x] Responder el refresh exitoso con HTTP `200`.
- [x] Responder HTTP `400` para un body o refresh token invalido.
- [x] Responder HTTP `401` uniformemente para un refresh token no utilizable.
- [x] Responder HTTP `403` para una cuenta inactiva.
- [x] Responder HTTP `405` para metodos no permitidos en refresh e incluir `Allow: POST`.
- [x] Responder HTTP `500` de forma sanitizada ante errores internos del refresh.
- [x] Implementar `POST /api/auth/logout` con Pages Router.
- [x] Responder el logout exitoso con HTTP `200` y `data: {}`.
- [x] Responder HTTP `400` para un body o refresh token invalido.
- [x] Responder HTTP `401` uniformemente para un refresh token no utilizable.
- [x] Responder HTTP `405` para metodos no permitidos en logout e incluir `Allow: POST`.
- [x] Responder HTTP `500` de forma sanitizada ante errores internos del logout.
- [x] Aplicar el formato uniforme con `data` en las respuestas del registro.
- [x] Aplicar el formato uniforme con `data` en login.
- [x] Aplicar el formato uniforme con `data` en refresh.
- [x] Aplicar el formato uniforme con `data` en logout.
- [x] Seleccionar explicitamente los datos publicos del login.
- [x] Confirmar que el endpoint de registro no exponga `passwordHash` ni datos internos.
- [x] Confirmar que el endpoint de login no exponga `passwordHash`, `refreshTokenHash` ni datos privados no aprobados.
- [x] Confirmar que el endpoint de refresh no exponga hashes ni datos internos.
- [x] Confirmar que el endpoint de logout no exponga usuario, identificadores, tokens, hashes ni datos internos.

## Fase 10 - Proteccion de Rutas

- [x] Crear un mecanismo reutilizable para leer estrictamente un unico encabezado `Authorization: Bearer <accessToken>`.
- [x] Rechazar uniformemente con HTTP `401` el encabezado `Authorization` ausente, duplicado o mal formado.
- [x] Validar access tokens en endpoints protegidos mediante `jose` y traducir los errores a `"Access token inválido."`.
- [x] Consultar eficientemente Sesion, Usuario y Rol desde `sid` mediante una unica consulta con seleccion explicita.
- [x] Rechazar Sesion inexistente, revocada o vencida y rechazar cuentas inactivas con HTTP `403`.
- [x] Exponer mediante `AuthContext` la identidad, la Sesion y el rol actual autenticados.
- [x] Implementar el guard reutilizable `requireAuth`.
- [x] Invalidar inmediatamente access tokens cuando su Sesion sea revocada.
- [x] Diferenciar el access token JWT del refresh token opaco en servicios y endpoints.
- [x] Implementar el guard reutilizable `requireRole` con HTTP `403` por rol insuficiente.
- [ ] Verificar funcionalmente la autorizacion por roles y el rechazo por rol insuficiente.
- [ ] Implementar y verificar rutas exclusivas para `ADMIN`.

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
- [x] Probar la privacidad de la respuesta del refresh.
- [x] Probar la privacidad de la respuesta del logout.
- [x] Probar la privacidad de las respuestas de rutas protegidas sin exponer tokens, hashes ni objetos Prisma.
- [ ] Probar varias sesiones simultaneas.
- [ ] Probar expiracion y tipo de tokens.
- [x] Probar funcionalmente la rotacion y el rechazo del refresh token anterior.
- [x] Probar funcionalmente el refresh token nuevo.
- [ ] Probar funcionalmente el refresh de una cuenta inactiva.
- [ ] Probar concurrencia durante la rotacion.
- [x] Probar funcionalmente el cierre de sesion y el rechazo de la reutilizacion del token.
- [x] Verificar `revokedAt`, cero sesiones activas y conservacion fisica de la Sesion en PostgreSQL.
- [ ] Probar concurrentemente dos solicitudes de logout con el mismo token.
- [ ] Probar logout sin afectar otras sesiones activas del mismo usuario.
- [x] Probar que un access token deje de ser utilizable cuando su Sesion sea revocada mediante logout.
- [ ] Probar access tokens con `sid` ausente, invalido o expirado.
- [ ] Probar funcionalmente el rechazo de una cuenta inactiva en un endpoint protegido.
- [ ] Probar funcionalmente el rechazo por rol insuficiente.
- [ ] Probar encabezados `Authorization` duplicados.
- [ ] Crear pruebas automatizadas para los guards.
- [ ] Probar que el rol actual de base de datos prevalezca sobre el token.
- [ ] Probar que reactivar una cuenta no restaure sesiones ni access tokens.
- [x] Probar el formato de las respuestas exitosas y de error del registro.
- [x] Probar el formato de las respuestas HTTP `200`, `401` y `405` del login.
- [ ] Probar funcionalmente las respuestas HTTP `400`, `403` y `500` del login.
- [x] Probar el formato de las respuestas HTTP `200` y `401` del refresh.
- [ ] Probar funcionalmente las respuestas HTTP `400`, `403`, `405` y `500` del refresh.
- [x] Probar el formato de las respuestas HTTP `200` y `401` del logout.
- [ ] Probar funcionalmente las respuestas HTTP `400`, `405` y `500` del logout.
- [x] Probar funcionalmente el acceso permitido y los rechazos HTTP `401` de una ruta protegida.
- [x] Ejecutar lint.
- [ ] Ejecutar las pruebas.
- [ ] Completar las pruebas automatizadas de autenticacion.
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

Evidencia funcional del refresh:

- Primer uso del refresh token: HTTP `200` con mensaje `"Tokens renovados correctamente."`.
- Reutilizacion del refresh token anterior: HTTP `401` con mensaje `"Refresh token inválido."`.
- Uso del refresh token nuevo: HTTP `200` con mensaje `"Tokens renovados correctamente."`.
- El access token mantiene una duracion de `900` segundos.
- El refresh token mantiene una duracion de `604800` segundos.
- Peticion guardada en Postman como `Auth - Renovar tokens`.

Evidencia funcional del logout:

- Primer uso del refresh token en logout: HTTP `200`, mensaje `"Sesión cerrada correctamente."` y `data: {}`.
- Segundo uso del mismo refresh token: HTTP `401` con mensaje `"Refresh token inválido."`.
- En PostgreSQL, `revokedAt` contiene fecha y hora y existen cero sesiones activas.
- La Sesion revocada se conserva fisicamente en PostgreSQL.
- Peticion guardada en Postman como `Auth - Cerrar sesión`.

Evidencia funcional de los guards:

- Access token valido en `GET /api/usuarios/perfil`: HTTP `200`; el guard permitio continuar.
- Solicitud sin encabezado `Authorization`: HTTP `401` con mensaje `"Access token inválido."`.
- Access token mal formado: HTTP `401` con mensaje `"Access token inválido."`.
- Access token reutilizado despues del logout: HTTP `401` con mensaje `"Access token inválido."`.
- La Sesion fue consultada en PostgreSQL mediante `sid`; su `revokedAt` impidio el acceso despues del logout.

## Fase 12 - Cierre Documental

- [ ] Registrar los resultados de las pruebas.
- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Completar las actividades planificadas de optimización técnica y rendimiento.
- [ ] Actualizar el estado de la feature solo cuando todos los requisitos esten implementados.

## Criterios de Finalizacion

La feature unicamente podra marcarse como completada cuando:

- [ ] Todos los requisitos funcionales del spec esten implementados.
- [ ] Todas las reglas de negocio esten cumplidas.
- [ ] Todas las pruebas hayan sido ejecutadas correctamente.
- [x] El proyecto compile sin errores.
- [ ] La documentacion de la feature este actualizada.
