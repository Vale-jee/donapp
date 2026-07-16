# Tareas - Calificaciones

## Fase 1 - Definición Documental

- [x] Aprobar el objetivo, alcance y fuera de alcance.
- [x] Aprobar los actores y sus relaciones derivadas.
- [x] Aprobar `Donacion.estado = ENTREGADA` como condición exacta.
- [x] Aprobar el modelo conceptual Calificacion.
- [x] Aprobar la puntuación entera entre 1 y 5.
- [x] Aprobar la ausencia de comentarios y la inmutabilidad.
- [x] Aprobar los cuatro endpoints y sus contratos.
- [x] Aprobar la reputación calculada sin agregados almacenados.
- [x] Aprobar paginación y orden.
- [x] Aprobar la consulta derivada de pendientes y múltiples pendientes.
- [x] Aprobar las reglas de privacidad y concurrencia.
- [x] Sincronizar documentalmente `ExencionCalificacion` con la consulta derivada de pendientes.
- [x] Reorganizar la documentación en `spec.md`, `plan.md` y `tasks.md`.


## Fase 2 - Modelo y Migración

- [ ] Incorporar el modelo `Calificacion` con los cuatro campos aprobados.
- [ ] Incorporar la clave foránea obligatoria hacia Donación.
- [ ] Verificar que no se agreguen campos derivados o prohibidos al modelo.
- [ ] Crear y revisar la migración PostgreSQL.
- [ ] Aplicar la migración en el entorno correspondiente.


## Fase 3 - Restricciones e Índices

- [ ] Agregar `UNIQUE` a `Calificacion.donacionId`.
- [ ] Restringir la puntuación a enteros entre 1 y 5.
- [ ] Restringir eliminaciones físicas y cascadas destructivas.
- [ ] Crear índices para detectar calificaciones pendientes.
- [ ] Incorporar la relación de consulta con `ExencionCalificacion`.
- [ ] Crear índices para excluir eficientemente donaciones eximidas.
- [ ] Crear índices para listar calificaciones por propietario y fecha.
- [ ] Verificar las restricciones directamente en PostgreSQL.


## Fase 4 - Validaciones y Servicios

- [ ] Crear validaciones Zod para identificadores y paginación.
- [ ] Crear la validación estricta de `puntuacion`.
- [ ] Rechazar campos desconocidos e identificadores derivados enviados por el cliente.
- [ ] Implementar los servicios de creación y consulta por donación.
- [ ] Implementar los servicios de listado, reputación y pendientes.
- [ ] Implementar la selección explícita de campos públicos.


## Fase 5 - Creación de Calificaciones

- [ ] Verificar donación `ENTREGADA` y solicitud `ACEPTADA`.
- [ ] Verificar al receptor autenticado.
- [ ] Derivar autor y usuario calificado desde las relaciones aprobadas.
- [ ] Proteger frente a autoscalificación.
- [ ] Proteger la creación frente a concurrencia y duplicados.
- [ ] Conservar la calificación como historial inmutable.


## Fase 6 - Consultas y Reputación

- [ ] Implementar la consulta segura por donación.
- [ ] Implementar el listado de calificaciones recibidas.
- [ ] Calcular promedio y total mediante una consulta agregada.
- [ ] Redondear el promedio a un decimal y devolver `null` en el caso vacío.
- [ ] Evitar consultas N+1.
- [ ] Ocultar listados públicos de propietarios inactivos.


## Fase 7 - Calificaciones Pendientes

- [ ] Implementar la consulta derivada sin estados ni registros incompletos.
- [ ] Detectar todas las pendientes del usuario autenticado.
- [ ] Excluir donaciones con `Calificacion` o `ExencionCalificacion`.
- [ ] Implementar paginación y orden de pendientes.
- [ ] Verificar múltiples pendientes.
- [ ] Verificar que una calificación creada deje de aparecer como pendiente.
- [ ] Verificar que una exención deje de aparecer como pendiente sin crear puntuación.
- [ ] Tratar correctamente cuentas inactivas sin crear calificaciones ficticias.


## Fase 8 - Endpoints

- [ ] Implementar `POST /api/donaciones/{id}/calificacion`.
- [ ] Implementar `GET /api/donaciones/{id}/calificacion`.
- [ ] Implementar `GET /api/usuarios/{id}/calificaciones`.
- [ ] Implementar `GET /api/calificaciones/pendientes`.
- [ ] Integrar todas las respuestas con la feature 004.
- [ ] Implementar respuestas `405` con la cabecera `Allow`.


## Fase 9 - Privacidad y Autorización

- [ ] Integrar autenticación y validación de cuenta activa.
- [ ] Autorizar exclusivamente al receptor para crear.
- [ ] Autorizar únicamente a los actores aprobados en la consulta por donación.
- [ ] Ocultar recursos no visibles mediante el mismo `404` público.
- [ ] Seleccionar únicamente perfiles y campos públicos.
- [ ] Verificar que no se expongan relaciones privadas ni objetos Prisma completos.


## Fase 10 - Integración Futura con Solicitudes

- [ ] Integrar la consulta de pendientes en `POST /api/solicitudes`.
- [ ] Ejecutar la comprobación lo más cerca posible de la creación.
- [ ] Responder `409` con el mensaje público aprobado cuando exista una pendiente.
- [ ] Verificar que el error no incluya la lista de donaciones pendientes.
- [ ] Actualizar la feature 007 únicamente cuando se autorice esa integración.


## Fase 11 - Pruebas

- [ ] Probar creación válida y puntuaciones inválidas.
- [ ] Probar actor, estado, solicitud aceptada y autoscalificación.
- [ ] Probar duplicados secuenciales y concurrentes.
- [ ] Probar consulta por donación y privacidad.
- [ ] Probar listado, paginación, orden y reputación.
- [ ] Probar ausencia de consultas N+1.
- [ ] Probar una o múltiples pendientes y su resolución derivada.
- [ ] Probar la exclusión de `ExencionCalificacion` en pendientes, promedios y totales.
- [ ] Probar cuentas inactivas y conservación del historial.
- [ ] Probar códigos HTTP, contratos y cabecera `Allow`.


## Fase 12 - Verificación Final

- [ ] Ejecutar todas las pruebas de la feature.
- [ ] Ejecutar lint correctamente.
- [ ] Ejecutar build correctamente.
- [ ] Verificar la migración, restricciones e índices.
- [ ] Verificar que la documentación coincida con la implementación.


## Integraciones Futuras

- La feature 003 podrá incorporar posteriormente la reputación calculada al perfil público.
- La feature 010 podrá resolver pendientes imposibles y aplicar moderación administrativa.
- Caché y notificaciones quedan fuera de esta versión.
- Estas integraciones no forman parte de la implementación actual de la feature 009.


## Criterios de Finalización

La feature solo podrá marcarse como completada cuando:

- Exista el modelo `Calificacion`.
- La migración esté aplicada.
- `Calificacion.donacionId` sea obligatorio y único.
- La puntuación solo acepte enteros entre 1 y 5.
- Solo pueda calificar el receptor seleccionado.
- Solo se pueda calificar una donación `ENTREGADA`.
- Exista como máximo una calificación por donación.
- La concurrencia no produzca calificaciones duplicadas.
- Funcionen los cuatro endpoints.
- El promedio y total se calculen sin almacenar agregados en Usuario.
- No se produzcan consultas N+1 en los listados.
- La consulta derivada detecte correctamente todas las pendientes.
- Una calificación creada deje de aparecer como pendiente.
- Se conserven todas las calificaciones como historial.
- No existan endpoints de edición o eliminación.
- Todas las respuestas cumplan la feature 004.
- Se respeten las reglas de privacidad.
- Las pruebas pasen.
- Lint y build finalicen correctamente.
- La documentación coincida con la implementación.
