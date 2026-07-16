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
- [ ] Reutilizar la autenticacion Bearer.
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

- [ ] Crear la seleccion explicita del perfil propio.
- [ ] Crear la seleccion explicita del perfil publico.
- [ ] Validar el access token en todas las rutas protegidas.
- [ ] Obtener la identidad del propietario desde el access token.
- [ ] Comprobar que el usuario autenticado exista.
- [ ] Comprobar que el usuario autenticado permanezca activo.
- [ ] Impedir que respuestas incluyan hashes, sesiones, secretos o tokens.
- [ ] Hacer indistinguible el `404` de una cuenta inexistente o inactiva.

## Fase 5 - Servicios

- [ ] Implementar la consulta del perfil propio.
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

- [ ] Implementar `GET /api/usuarios/perfil`.
- [ ] Implementar `PATCH /api/usuarios/perfil`.
- [ ] Implementar `GET /api/usuarios/{id}/publico`.
- [ ] Implementar `PUT /api/usuarios/password`.
- [ ] Implementar `PUT /api/usuarios/desactivar`.
- [ ] Rechazar metodos HTTP no permitidos.
- [ ] Aplicar respuestas uniformes con `data`.
- [ ] Retirar de forma segura el endpoint provisional `GET /api/usuarios`.

## Fase 7 - Manejo de Errores

- [ ] Implementar errores `400`, `401`, `403`, `404`, `405`, `409` y `500`.
- [ ] Garantizar `data: null` en todas las respuestas de error.
- [ ] Evitar informacion sensible en mensajes de error.
- [ ] Corregir posteriormente la feature 004 para incluir `data: null` en las respuestas de error.

## Fase 8 - Pruebas

- [ ] Probar la consulta y privacidad del perfil propio.
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
- [ ] Probar autenticacion y autorizacion de rutas protegidas.
- [ ] Probar el formato uniforme de respuestas.
- [ ] Ejecutar lint.
- [ ] Ejecutar las pruebas.
- [ ] Ejecutar el build.

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
- [ ] Lint y build finalicen correctamente.
- [ ] El endpoint provisional inseguro haya sido retirado.
- [ ] La documentacion coincida con la implementacion.
