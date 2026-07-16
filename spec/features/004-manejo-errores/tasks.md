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
- [ ] Disponer de Zod en la implementacion del proyecto.

## Fase 3 - Respuestas Compartidas

- [ ] Definir los tipos compartidos de respuestas exitosas.
- [ ] Definir los tipos compartidos de respuestas de error.
- [ ] Crear la utilidad centralizada para respuestas exitosas.
- [ ] Crear la utilidad centralizada para respuestas de error.
- [ ] Garantizar `data: null` en todos los errores.
- [ ] Garantizar que `status` coincida con el codigo HTTP real.
- [ ] Garantizar que `errors` solo se utilice para validaciones por campo.

## Fase 4 - Errores y Excepciones

- [ ] Definir la representacion de errores controlados de la aplicacion.
- [ ] Crear el mecanismo centralizado de manejo de errores.
- [ ] Capturar excepciones no controladas en las rutas.
- [ ] Traducir excepciones no controladas a `500`.
- [ ] Utilizar un mensaje publico generico para errores internos.
- [ ] Evitar stack traces y detalles de implementacion en las respuestas.

## Fase 5 - Traduccion de Errores Tecnicos

- [ ] Traducir errores de validacion de Zod.
- [ ] Normalizar errores de validacion por campo.
- [ ] Traducir errores conocidos de Prisma.
- [ ] Traducir conflictos funcionales conocidos a `409`.
- [ ] Traducir errores de jose mediante el contrato de autenticacion.
- [ ] Traducir fallos de PostgreSQL sin exponer detalles internos.
- [ ] Adaptar errores de Next.js al contrato uniforme.
- [ ] Tratar como `500` los errores sin traduccion segura.

## Fase 6 - Logging y Privacidad

- [ ] Crear el mecanismo de logging de errores.
- [ ] Registrar unicamente los campos aprobados.
- [ ] Excluir contraseñas, tokens y refresh tokens de los logs.
- [ ] Excluir hashes, secretos y claves criptograficas de los logs.
- [ ] Excluir variables de entorno sensibles de los logs.
- [ ] Excluir cuerpos completos de autenticacion de los logs.
- [ ] Separar el mensaje interno del mensaje publico.
- [ ] Verificar que ninguna respuesta exponga datos sensibles.

## Fase 7 - Integraciones

- [ ] Integrar el mecanismo con las validaciones de cada feature.
- [ ] Integrar el mecanismo con Autenticacion Core.
- [ ] Integrar la traduccion de errores Prisma.
- [ ] Aplicar la seleccion explicita de campos publicos antes de responder con datos de Prisma.
- [ ] Aplicar el contrato uniforme a todas las rutas existentes.
- [ ] Aplicar el contrato uniforme a las rutas futuras.
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
- [ ] Ejecutar lint.
- [ ] Ejecutar las pruebas.
- [ ] Ejecutar el build.

## Fase 9 - Cierre Documental

- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Registrar los resultados de pruebas, lint y build.
- [ ] Actualizar el estado solo cuando se cumplan todos los criterios de finalizacion.

## Criterios de Finalizacion

La feature solo podra marcarse como completada cuando:

- [ ] Exista un mecanismo centralizado de respuestas.
- [ ] Exista un mecanismo centralizado de errores.
- [ ] Todas las rutas utilicen el mismo contrato.
- [ ] Los errores tecnicos se traduzcan correctamente.
- [ ] No se filtren datos sensibles.
- [ ] Las pruebas pasen.
- [ ] Lint y build finalicen correctamente.
