# Tareas - Solicitudes

## Fase 1 - Definicion Documental

- [x] Aprobar el objetivo, alcance y limites de la feature.
- [x] Aprobar los cuatro estados y sus transiciones finales.
- [x] Aprobar las cuatro causas de cancelacion.
- [x] Aprobar las reglas de negocio, privacidad e idempotencia.
- [x] Aprobar el modelo conceptual y la referencia `solicitudAceptadaId`.
- [x] Aprobar los ocho endpoints y sus contratos.
- [x] Aprobar paginacion, orden y manejo de errores.
- [x] Sincronizar documentalmente el bloqueo por calificaciones pendientes y exenciones.
- [x] Reorganizar la documentacion en `spec.md`, `plan.md` y `tasks.md`.


## Fase 2 - Modelo y Migracion

- [ ] Incorporar los enums de estado y causa de cancelacion en Prisma.
- [ ] Incorporar el modelo `Solicitud` con los campos aprobados.
- [ ] Incorporar las relaciones obligatorias con Donacion y Usuario.
- [ ] Incorporar `Donacion.solicitudAceptadaId` nullable sin agregar `receptorId`.
- [ ] Crear y revisar la migracion.
- [ ] Aplicar la migracion en el entorno correspondiente.


## Fase 3 - Restricciones PostgreSQL

- [ ] Garantizar una sola solicitud `PENDIENTE` o `ACEPTADA` por donacion y solicitante.
- [ ] Garantizar una sola solicitud `ACEPTADA` por donacion.
- [ ] Garantizar coherencia entre estado, causa de cancelacion y fechas.
- [ ] Restringir la eliminacion fisica de solicitudes.
- [ ] Verificar las restricciones parciales agregadas en la migracion.


## Fase 4 - Validaciones y Servicios

- [ ] Crear las validaciones Zod de identificadores, cuerpos, filtros y paginacion.
- [ ] Rechazar campos desconocidos y campos protegidos.
- [ ] Implementar el servicio de creacion.
- [ ] Consultar `Calificacion` y `ExencionCalificacion` antes de crear.
- [ ] Bloquear la creacion cuando exista al menos una pendiente.
- [ ] Implementar los servicios de consulta con representacion segun el actor.
- [ ] Implementar los servicios de aceptacion, rechazo y cancelacion.
- [ ] Aplicar las reglas de idempotencia y transiciones terminales.


## Fase 5 - Transacciones y Coordinacion

- [ ] Implementar la aceptacion atomica con reserva de la donacion.
- [ ] Asignar atomicamente `solicitudAceptadaId`.
- [ ] Cancelar atomicamente las solicitudes pendientes competidoras.
- [ ] Coordinar la retirada de Donaciones con causa `DONACION_RETIRADA`.
- [ ] Coordinar la desactivacion de cuentas con las causas aprobadas.
- [ ] Proteger las operaciones frente a concurrencia.


## Fase 6 - Endpoints

- [ ] Implementar `POST /api/solicitudes`.
- [ ] Implementar `GET /api/solicitudes/enviadas`.
- [ ] Implementar `GET /api/solicitudes/recibidas`.
- [ ] Implementar `GET /api/solicitudes/{id}`.
- [ ] Implementar `GET /api/donaciones/{id}/solicitudes`.
- [ ] Implementar `PATCH /api/solicitudes/{id}/aceptar`.
- [ ] Implementar `PATCH /api/solicitudes/{id}/rechazar`.
- [ ] Implementar `PATCH /api/solicitudes/{id}/cancelar`.
- [ ] Integrar autenticacion, autorizacion y cuentas activas.
- [ ] Integrar todas las respuestas con la feature 004.


## Fase 7 - Paginacion y Privacidad

- [ ] Implementar paginacion y filtro por estado en los tres listados aprobados.
- [ ] Aplicar el orden `createdAt DESC, id DESC`.
- [ ] Seleccionar explicitamente los campos publicos de donantes y solicitantes.
- [ ] Ocultar recursos no visibles mediante la respuesta publica `404` aprobada.
- [ ] Verificar que no se expongan otros solicitantes ni datos privados.


## Fase 8 - Pruebas

- [ ] Probar la creacion exitosa y todas sus reglas de rechazo.
- [ ] Probar una y multiples calificaciones pendientes.
- [ ] Probar que calificaciones y exenciones eliminen correctamente la obligacion.
- [ ] Probar el `409` aprobado sin lista de donaciones en el error.
- [ ] Probar duplicados y nuevas solicitudes despues de estados permitidos.
- [ ] Probar consultas, filtros, paginacion, orden y privacidad.
- [ ] Probar aceptacion, rechazo y cancelacion.
- [ ] Probar idempotencia y conflictos de estado.
- [ ] Probar cancelaciones automaticas por aceptacion, retirada y cuentas inactivas.
- [ ] Probar concurrencia y atomicidad.
- [ ] Probar codigos HTTP, cabecera `Allow` y contrato de errores.


## Fase 9 - Verificacion Final

- [ ] Ejecutar todas las pruebas de la feature.
- [ ] Ejecutar lint correctamente.
- [ ] Ejecutar build correctamente.
- [ ] Verificar la migracion y las restricciones PostgreSQL.
- [ ] Verificar que la documentacion coincida con la implementacion.


## Dependencias Futuras

- `008-chat` utilizara la solicitud aceptada para crear la conversacion.
- `009-calificaciones` define la consulta derivada y `010-administracion` crea las exenciones consideradas por el bloqueo.
- `010-administracion` implementara supervision y resolucion de casos administrativos.
- Estas integraciones no forman parte de la implementacion de la feature 007.


## Criterios de Finalizacion

La feature solo podra marcarse como completada cuando:

- Exista el modelo `Solicitud`.
- La migracion este aplicada.
- Funcionen los ocho endpoints.
- Las transacciones sean atomicas.
- Exista una sola solicitud `ACEPTADA` por donacion.
- Solo pueda existir una solicitud `PENDIENTE` o `ACEPTADA` por combinacion de donacion y solicitante.
- `Donacion.solicitudAceptadaId` se asigne atomicamente al aceptar una solicitud.
- Ninguna solicitud pueda eliminarse fisicamente y todo el historial se conserve.
- Se respeten todas las reglas de privacidad.
- Todas las respuestas cumplan la feature 004.
- Las pruebas pasen.
- Lint y build finalicen correctamente.
- La documentacion coincida con la implementacion.
