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
- [x] Reutilizar la autenticacion Bearer en `GET /api/usuarios/perfil` mediante `requireAuth`.
- [ ] Reutilizar la verificacion y hash de contrasenas.
- [ ] Reutilizar la politica de contrasenas.
- [ ] Reutilizar el servicio de revocacion de sesiones.
- [ ] Confirmar la estrategia de base de datos para la unicidad de `nombreVisible` sin distinguir mayusculas.

## Fase 3 - Validaciones y Normalizacion

- [ ] Crear el esquema de consulta publica por identificador.
- [ ] Crear el esquema de actualizacion parcial.
- [ ] Crear el esquema de cambio de contrasena.
- [ ] Crear el esquema de desactivacion.
- [ ] Normalizar `nombreCompleto`.
- [ ] Validar y comprobar `nombreVisible` sin distinguir mayusculas.
- [ ] Normalizar y validar `email`.
- [ ] Normalizar `ciudad`.
- [ ] Validar y normalizar `telefono`.
- [ ] Validar `fotoPerfil` como URL o ruta de hasta 500 caracteres.
- [ ] Rechazar cuerpos vacios, campos desconocidos y campos protegidos.

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
- [ ] Implementar la actualizacion parcial del perfil.
- [ ] Validar `passwordActual` al cambiar el correo.
- [ ] Implementar el cambio de contrasena.
- [ ] Revocar todas las sesiones despues de cambiar la contrasena.
- [ ] Implementar la desactivacion logica de la cuenta.
- [ ] Revocar todas las sesiones despues de desactivar la cuenta.
- [ ] Coordinar las donaciones `PUBLICADA -> RETIRADA` durante la desactivacion.
- [ ] Coordinar la cancelacion de solicitudes `PENDIENTE` con las causas aprobadas.
- [ ] Invalidar inmediatamente access tokens mediante la validacion de `sid`.
- [ ] Mantener sin cambios donaciones `RESERVADA`, solicitudes `ACEPTADA`, chats, mensajes y calificaciones.
- [ ] Garantizar la perdida inmediata de acceso de cuentas inactivas.
- [ ] Traducir conflictos de unicidad a `409`.

## Fase 6 - Endpoints

- [x] Implementar `GET /api/usuarios/perfil` con Next.js Pages Router.
- [ ] Implementar `PATCH /api/usuarios/perfil`.
- [ ] Implementar `GET /api/usuarios/{id}/publico`.
- [ ] Implementar `PUT /api/usuarios/password`.
- [ ] Implementar `PUT /api/usuarios/desactivar`.
- [x] Permitir unicamente `GET` en la consulta del perfil mediante `validateHttpMethod` y responder HTTP `405` con `Allow: GET`.
- [ ] Rechazar metodos HTTP no permitidos en los demas endpoints.
- [x] Rechazar parametros query en `GET /api/usuarios/perfil` con HTTP `400` y `"Datos inválidos."`.
- [x] Responder la consulta exitosa con HTTP `200`, `"Perfil consultado correctamente."` y `data.usuario`.
- [x] Aplicar respuestas uniformes con `data` en `GET /api/usuarios/perfil`.
- [ ] Aplicar respuestas uniformes con `data` en los demas endpoints.
- [ ] Retirar de forma segura el endpoint provisional `GET /api/usuarios`.

## Fase 7 - Manejo de Errores

- [x] Implementar el manejo de errores `400`, `401`, `403`, `405` y `500` en `GET /api/usuarios/perfil`.
- [ ] Implementar los errores requeridos por los demas endpoints, incluidos `404` y `409`.
- [x] Garantizar `data: null` en las respuestas de error de `GET /api/usuarios/perfil`.
- [ ] Garantizar `data: null` en las respuestas de error de los demas endpoints.
- [ ] Evitar informacion sensible en mensajes de error.
- [ ] Corregir posteriormente la feature 004 para incluir `data: null` en las respuestas de error.

## Fase 8 - Pruebas

- [x] Probar funcionalmente la consulta y privacidad del perfil propio.
- [ ] Probar los campos exactos del perfil publico.
- [ ] Probar el `404` indistinguible para cuentas inexistentes e inactivas.
- [ ] Probar todas las normalizaciones y formatos.
- [ ] Probar actualizaciones parciales y campos protegidos.
- [ ] Probar conflictos y concurrencia de campos unicos.
- [ ] Probar la validacion de `passwordActual` al cambiar correo.
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
