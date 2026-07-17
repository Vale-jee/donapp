# Gestion de Usuarios - Tareas

## Fase 1 - Documentacion y Decisiones

- [x] Definir el alcance exclusivo de Gestion de Usuarios.
- [x] Aprobar los campos del perfil propio y publico.
- [x] Aprobar privacidad y autorizacion.
- [x] Aprobar los cinco endpoints y sus contratos.
- [x] Aprobar normalizaciones y validaciones.
- [x] Aprobar el cambio de correo con `passwordActual`.
- [x] Aprobar el cambio de contrasena y la revocacion total de sesiones.
- [x] Aprobar la desactivacion y conservacion del historial.
- [x] Sincronizar documentalmente la desactivacion propia y administrativa con Sesiones, Donaciones, Solicitudes y 010.
- [x] Aprobar el formato uniforme de respuestas.
- [x] Separar la documentacion en `spec.md`, `plan.md` y `tasks.md`.

## Fase 2 - Dependencia de Autenticacion Core

- [x] Disponer del modelo inicial `Usuario` como base provisional.
- [ ] Completar 002-autenticacion-core.
- [x] Confirmar el modelo definitivo `Usuario` y sus relaciones.
- [x] Reutilizar la autenticacion Bearer en `GET` y `PATCH /api/usuarios/perfil` mediante `requireAuth`.
- [x] Reutilizar la verificacion de contrasenas mediante bcrypt para el cambio de correo.
- [ ] Reutilizar el hash de contrasenas en las operaciones que lo requieran.
- [ ] Reutilizar la politica de contrasenas.
- [ ] Reutilizar el servicio de revocacion de sesiones.
- [ ] Confirmar la estrategia de base de datos para la unicidad de `nombreVisible` sin distinguir mayusculas.

## Fase 3 - Validaciones y Normalizacion

- [ ] Crear el esquema de consulta publica por identificador.
- [x] Crear el esquema Zod estricto y parcial de actualizacion del perfil.
- [ ] Crear el esquema de cambio de contrasena.
- [ ] Crear el esquema de desactivacion.
- [x] Normalizar `nombreCompleto` mediante trim y reduccion de espacios repetidos.
- [x] Normalizar `nombreVisible` a minusculas y validar su formato y longitud.
- [x] Normalizar y validar `email`.
- [x] Normalizar `ciudad` conservando la capitalizacion escrita por el usuario.
- [x] Validar y normalizar `telefono`, convirtiendo la cadena vacia a `null`.
- [x] Validar `fotoPerfil` como URL HTTP/HTTPS o ruta de hasta 500 caracteres y convertir la cadena vacia a `null`.
- [x] Rechazar cuerpos vacios, propiedades desconocidas y campos protegidos o administrativos.

## Fase 4 - Privacidad y Autorizacion

- [x] Crear la seleccion explicita del perfil propio con los campos aprobados y el rol.
- [ ] Crear la seleccion explicita del perfil publico.
- [x] Validar el access token en `GET /api/usuarios/perfil` mediante `requireAuth`.
- [ ] Validar el access token en las demas rutas protegidas de la feature.
- [x] Obtener la identidad del propietario exclusivamente desde `auth.userId`, sin identificadores en URL, query o body.
- [x] Comprobar que el usuario autenticado exista y tratar su ausencia como HTTP `401`.
- [x] Comprobar mediante el guard que el usuario autenticado permanezca activo.
- [x] Permitir a `USUARIO` y `ADMIN` consultar su propio perfil sin aplicar `requireRole`.
- [x] Impedir que la respuesta del perfil propio incluya hashes, sesiones, secretos, tokens u objetos Prisma.
- [ ] Impedir que las respuestas de los demas endpoints incluyan hashes, sesiones, secretos o tokens.
- [ ] Hacer indistinguible el `404` de una cuenta inexistente o inactiva.

## Fase 5 - Servicios

- [x] Crear el servicio separado `usuario-service.ts` para la consulta del perfil propio.
- [x] Implementar la consulta del perfil propio mediante `auth.userId` y seleccion explicita de campos seguros.
- [ ] Implementar la consulta del perfil publico activo.
- [x] Implementar la actualizacion parcial del perfil exclusivamente mediante `auth.userId`.
- [x] Exigir y validar `passwordActual` mediante `verifyPassword` al cambiar el correo.
- [x] Responder HTTP `401` con `"La contraseña actual es incorrecta."` sin actualizar el perfil cuando falle la verificacion.
- [ ] Implementar el cambio de contrasena.
- [ ] Revocar todas las sesiones despues de cambiar la contrasena.
- [ ] Implementar la desactivacion logica de la cuenta.
- [ ] Revocar todas las sesiones despues de desactivar la cuenta.
- [ ] Coordinar las donaciones `PUBLICADA -> RETIRADA` durante la desactivacion.
- [ ] Coordinar la cancelacion de solicitudes `PENDIENTE` con las causas aprobadas.
- [ ] Invalidar inmediatamente access tokens mediante la validacion de `sid`.
- [ ] Mantener sin cambios donaciones `RESERVADA`, solicitudes `ACEPTADA`, chats, mensajes y calificaciones.
- [ ] Garantizar la perdida inmediata de acceso de cuentas inactivas.
- [x] Comprobar la unicidad de `email` y `nombreVisible` excluyendo los valores actuales del usuario.
- [x] Traducir conflictos Prisma `P2002` de `email` y `nombreVisible` a HTTP `409` sin exponer metadata.

## Fase 6 - Endpoints

- [x] Implementar la convivencia de `GET` y `PATCH /api/usuarios/perfil` con Next.js Pages Router.
- [ ] Implementar `GET /api/usuarios/{id}/publico`.
- [ ] Implementar `PUT /api/usuarios/password`.
- [ ] Implementar `PUT /api/usuarios/desactivar`.
- [x] Permitir unicamente `GET` y `PATCH` mediante `validateHttpMethod` y responder HTTP `405` con `Allow: GET, PATCH`.
- [ ] Rechazar metodos HTTP no permitidos en los demas endpoints.
- [x] Rechazar parametros query en `GET /api/usuarios/perfil` con HTTP `400` y `"Datos inválidos."`.
- [x] Responder la consulta exitosa con HTTP `200`, `"Perfil consultado correctamente."` y `data.usuario`.
- [x] Responder la actualizacion exitosa con HTTP `200`, `"Perfil actualizado correctamente."` y `data.usuario`.
- [x] Aplicar respuestas uniformes con `data` en `GET` y `PATCH /api/usuarios/perfil`.
- [ ] Aplicar respuestas uniformes con `data` en los demas endpoints.
- [ ] Retirar de forma segura el endpoint provisional `GET /api/usuarios`.

## Fase 7 - Manejo de Errores

- [x] Implementar el manejo de errores `400`, `401`, `403`, `409`, `405` y `500` en `GET` y `PATCH /api/usuarios/perfil`.
- [ ] Implementar los errores requeridos por los demas endpoints, incluido `404`.
- [x] Garantizar `data: null` en las respuestas de error de `GET` y `PATCH /api/usuarios/perfil`.
- [ ] Garantizar `data: null` en las respuestas de error de los demas endpoints.
- [ ] Evitar informacion sensible en mensajes de error.
- [ ] Corregir posteriormente la feature 004 para incluir `data: null` en las respuestas de error.

## Fase 8 - Pruebas

- [x] Probar funcionalmente la consulta y privacidad del perfil propio.
- [ ] Probar los campos exactos del perfil publico.
- [ ] Probar el `404` indistinguible para cuentas inexistentes e inactivas.
- [ ] Probar todas las normalizaciones y formatos.
- [x] Probar funcionalmente una actualizacion parcial y el rechazo de body vacio y campos protegidos.
- [ ] Probar funcionalmente un `email` duplicado.
- [ ] Probar funcionalmente un `nombreVisible` duplicado.
- [ ] Probar la concurrencia de campos unicos.
- [x] Probar la exigencia y validacion de `passwordActual` al cambiar correo.
- [ ] Probar el cambio de contrasena y la revocacion de sesiones.
- [ ] Probar la desactivacion, el historial y la perdida inmediata de acceso.
- [ ] Probar la coordinacion con Donaciones, Solicitudes y Sesiones.
- [ ] Verificar que la reactivacion administrativa no restaure sesiones, tokens ni estados historicos.
- [x] Probar la autenticacion de `GET /api/usuarios/perfil` con token valido, ausente, mal formado y revocado.
- [ ] Probar funcionalmente una cuenta inactiva con HTTP `403`.
- [ ] Probar funcionalmente un access token vencido.
- [ ] Probar autenticacion y autorizacion de las demas rutas protegidas.
- [x] Probar el formato uniforme de las respuestas observadas de `GET /api/usuarios/perfil`.
- [ ] Probar el formato uniforme de respuestas de los demas endpoints.
- [x] Ejecutar lint.
- [ ] Ejecutar las pruebas.
- [ ] Crear y ejecutar pruebas automatizadas para Gestion de Usuarios.
- [x] Ejecutar el build.

Evidencia funcional de `GET /api/usuarios/perfil`:

- Access token valido: HTTP `200`, mensaje `"Perfil consultado correctamente."`; se devolvio el perfil del usuario autenticado con rol `USUARIO`.
- Sin encabezado `Authorization`: HTTP `401` con mensaje `"Access token inválido."`.
- Access token mal formado: HTTP `401` con mensaje `"Access token inválido."`.
- Access token utilizado despues de cerrar la Sesion: HTTP `401` con mensaje `"Access token inválido."`.
- Metodo `POST`: HTTP `405`, encabezado `Allow: GET` y mensaje `"Método HTTP no permitido."`.
- Solicitud `GET` con `id=2`: HTTP `400` con mensaje `"Datos inválidos."`; no fue posible consultar el perfil de otra persona mediante un identificador del cliente.
- La respuesta no contiene `passwordHash`, `refreshTokenHash`, `accessToken`, `refreshToken`, sesiones ni objetos Prisma.

Evidencia funcional de `PATCH /api/usuarios/perfil`:

- Actualizacion de ciudad: HTTP `200`, mensaje `"Perfil actualizado correctamente."` y ciudad actualizada a `"Quito Norte"`.
- Verificacion mediante `GET`: HTTP `200`; la ciudad actualizada fue devuelta correctamente.
- Body vacio: HTTP `400` con mensaje `"Datos inválidos."`; se indico que debe enviarse al menos un campo modificable.
- Intento de modificar `rol` a `"ADMIN"`: HTTP `400`; el campo administrativo fue rechazado.
- Cambio de correo sin `passwordActual`: HTTP `400`; se indico que la contraseña actual es obligatoria.
- Contraseña actual incorrecta: HTTP `401` con mensaje `"La contraseña actual es incorrecta."`; el correo no fue modificado.
- Cambio de correo correcto: HTTP `200`, mensaje `"Perfil actualizado correctamente."` y nuevo correo `prueba.cambio.04@donapp.test`.
- Verificacion mediante `GET`: HTTP `200`; el nuevo correo fue devuelto correctamente.
- Metodo `POST`: HTTP `405` con encabezado `Allow: GET, PATCH`.
- La respuesta no contiene `passwordActual`, `passwordHash`, sesiones, access tokens, refresh tokens ni objetos Prisma.

## Fase 9 - Cierre Documental

- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Confirmar que el endpoint provisional inseguro fue retirado.
- [ ] Registrar los resultados de pruebas, lint y build.
- [ ] Actualizar el estado solo cuando todos los criterios se cumplan.

## Criterios de Finalizacion

La feature solo podra marcarse como completada cuando:

- [ ] Todos los requisitos funcionales esten implementados.
- [ ] Se respeten todas las reglas de privacidad.
- [ ] Los cinco endpoints funcionen correctamente.
- [ ] Todas las pruebas pasen.
- [x] Lint y build finalicen correctamente.
- [ ] El endpoint provisional inseguro haya sido retirado.
- [ ] La documentacion coincida con la implementacion.
