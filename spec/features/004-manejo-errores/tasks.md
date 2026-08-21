# Manejo de Errores - Tareas

## Fase 1 - Decisiones Documentales

- [x] Definir el objetivo transversal de la feature.
- [x] Delimitar el alcance y las responsabilidades de otras features.
- [x] Aprobar el formato uniforme de respuestas exitosas.
- [x] Aprobar el formato uniforme de respuestas de error con `data: null`.
- [x] Aprobar el uso de `status` unicamente en respuestas de error.
- [x] Aprobar el campo opcional `errors` para validaciones por campo.
- [x] Documentar la clasificacion de errores.
- [x] Documentar la traduccion segura de errores tecnicos.
- [x] Documentar la politica de privacidad.
- [x] Documentar la politica de logging.
- [x] Aprobar los codigos HTTP oficiales.
- [x] Aprobar la cabecera `Allow` para respuestas `405`.
- [x] Confirmar que no se requieren dependencias adicionales.
- [x] Separar la documentacion en `spec.md`, `plan.md` y `tasks.md`.

## Fase 2 - Base Tecnica Existente

- [x] Disponer de Next.js con Pages Router.
- [x] Disponer de TypeScript.
- [x] Disponer del cliente Prisma en la ubicacion oficial.
- [ ] Completar las dependencias funcionales de Autenticacion Core.
- [x] Disponer de Zod en la implementacion del proyecto.

## Fase 3 - Respuestas Compartidas

- [x] Definir los tipos compartidos de respuestas exitosas.
- [x] Definir los tipos compartidos de respuestas de error.
- [x] Crear la utilidad centralizada para respuestas exitosas.
- [x] Crear la utilidad centralizada para respuestas de error.
- [x] Garantizar `data: null` en todos los errores construidos por la utilidad compartida.
- [x] Garantizar que `status` coincida con el codigo HTTP real en la utilidad compartida.
- [x] Permitir detalles opcionales `errors` normalizados para validaciones por campo.
- [ ] Verificar en los endpoints que `errors` solo se utilice para validaciones por campo.
- [x] Tipar los estados HTTP aprobados `200`, `201`, `400`, `401`, `403`, `404`, `405`, `409` y `500`.

## Fase 4 - Errores y Excepciones

- [x] Definir la representacion de errores controlados de la aplicacion mediante `ApiError`.
- [x] Crear el mecanismo centralizado de manejo de errores.
- [ ] Capturar excepciones no controladas en las rutas.
- [x] Traducir excepciones no controladas a `500`.
- [x] Utilizar un mensaje publico generico para errores internos.
- [x] Evitar stack traces y detalles de implementacion en las respuestas construidas por el manejador central.

## Fase 5 - Traduccion de Errores Tecnicos

- [x] Traducir errores de validacion de Zod.
- [x] Normalizar errores de validacion a `field` y `message`.
- [ ] Traducir errores conocidos de Prisma.
- [ ] Traducir conflictos funcionales conocidos a `409`.
- [ ] Traducir errores de jose mediante el contrato de autenticacion.
- [ ] Traducir fallos de PostgreSQL sin exponer detalles internos.
- [ ] Adaptar errores de Next.js al contrato uniforme.
- [x] Tratar como `500` los errores sin traduccion segura en el manejador central.

## Fase 6 - Logging y Privacidad

- [x] Registrar mediante el manejador central los errores desconocidos unicamente en el servidor.
- [ ] Registrar unicamente los campos aprobados.
- [ ] Excluir contraseñas, tokens y refresh tokens de los logs.
- [ ] Excluir hashes, secretos y claves criptograficas de los logs.
- [ ] Excluir variables de entorno sensibles de los logs.
- [ ] Excluir cuerpos completos de autenticacion de los logs.
- [x] Separar el error interno registrado del mensaje publico generico.
- [x] Verificar que el manejador central no incluya el error interno en la respuesta.
- [ ] Verificar funcionalmente que ninguna respuesta de los endpoints exponga datos sensibles.

## Fase 7 - Integraciones

- [ ] Integrar el mecanismo con las validaciones de cada feature.
- [ ] Integrar el mecanismo con Autenticacion Core.
- [ ] Integrar la traduccion de errores Prisma.
- [ ] Aplicar la seleccion explicita de campos publicos antes de responder con datos de Prisma.
- [ ] Aplicar el contrato uniforme a todas las rutas existentes.
- [ ] Aplicar el contrato uniforme a las rutas futuras.
- [x] Crear la utilidad para validar metodos HTTP y responder `405` con la cabecera `Allow`.
- [ ] Enviar la cabecera `Allow` en todas las respuestas `405`.

## Fase 8 - Pruebas y Verificacion

- [ ] Configurar la estrategia de pruebas aprobada para el proyecto.
- [ ] Probar respuestas exitosas uniformes.
- [ ] Probar respuestas de error uniformes.
- [ ] Probar la coincidencia entre `status` y el codigo HTTP real.
- [ ] Probar `data: null` en todos los errores.
- [ ] Probar el uso opcional de `errors`.
- [ ] Probar todos los codigos HTTP oficiales.
- [ ] Probar la cabecera `Allow` para `405`.
- [ ] Probar la traduccion de Prisma, Zod, jose, PostgreSQL y Next.js.
- [ ] Probar excepciones no controladas.
- [ ] Probar la ausencia de datos sensibles y stack traces.
- [ ] Probar que no se devuelvan objetos Prisma completos.
- [x] Ejecutar lint.
- [ ] Ejecutar las pruebas.
- [x] Ejecutar el build.

## Fase 9 - Cierre Documental

- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Registrar los resultados de pruebas, lint y build.
- [ ] Actualizar el estado solo cuando se cumplan todos los criterios de finalizacion.

## Sincronizacion final

El contrato uniforme, el request ID, el manejo de JSON malformado y la sanitizacion de errores cuentan con evidencia permanente. Las traducciones tecnicas y escenarios exhaustivos que siguen sin marcar no se declaran verificados por este cierre.

## Criterios de Finalizacion

La feature solo podra marcarse como completada cuando:

- [x] Exista un mecanismo centralizado de respuestas.
- [x] Exista un mecanismo centralizado de errores.
- [ ] Todas las rutas utilicen el mismo contrato.
- [ ] Los errores tecnicos se traduzcan correctamente.
- [ ] No se filtren datos sensibles.
- [ ] Las pruebas pasen.
- [x] Lint y build finalicen correctamente.
