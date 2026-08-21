# Tareas - Administración

## Fase 1 - Definición Documental

- [x] Aprobar el objetivo, alcance y exclusiones.
- [x] Aprobar los roles `ADMIN` y `USUARIO` sin cambios administrativos.
- [x] Aprobar el guard administrativo conceptual y la claim `sid`.
- [x] Aprobar los 16 endpoints administrativos.
- [x] Aprobar los modelos conceptuales Auditoría y Exención.
- [x] Aprobar privacidad, prohibición de suplantación y acceso solo a metadatos de Chat.
- [x] Aprobar acciones auditables y motivo administrativo.
- [x] Aprobar idempotencia y concurrencia.
- [x] Aprobar la transición administrativa `RESERVADA -> RETIRADA`.
- [x] Reorganizar la documentación en `spec.md`, `plan.md` y `tasks.md`.


## Fase 2 - Modelos y Migración

- [x] Incorporar `AuditoriaAdministrativa` en Prisma.
- [x] Incorporar `ExencionCalificacion` en Prisma.
- [x] Incorporar las claves foráneas obligatorias.
- [x] Verificar que no se agreguen campos prohibidos.
- [x] Crear y revisar la migración PostgreSQL.
- [x] Aplicar la migración.


## Fase 3 - Guard Administrativo y Sesiones

- [ ] Implementar el guard administrativo compartido.
- [ ] Validar firma, expiración, `sub` y `sid`.
- [ ] Consultar eficientemente Sesión, Usuario y Rol.
- [ ] Validar sesión vigente, usuario activo y rol actual `ADMIN`.
- [ ] Rechazar identificadores administrativos enviados por el cliente.
- [ ] Integrar el guard en los 16 endpoints.


## Fase 4 - Restricciones e Índices

- [x] Agregar `UNIQUE` a `ExencionCalificacion.donacionId`.
- [x] Configurar todas las claves foráneas con `ON DELETE RESTRICT` y `ON UPDATE CASCADE`.
- [x] Crear índices de Auditoría por administrador, acción, entidad y fecha.
- [x] Crear índices de Exención por donación y administrador.
- [x] Crear índices estructurales aprobados para listados administrativos.
- [ ] Evaluar índices adicionales para filtros administrativos cuando existan consultas implementadas.
- [x] Verificar las restricciones directamente en PostgreSQL.


## Fase 5 - Validaciones y Servicios Compartidos

- [ ] Crear validaciones Zod de identificadores, filtros y paginación.
- [ ] Crear la validación estricta del motivo administrativo.
- [ ] Rechazar campos desconocidos.
- [ ] Implementar paginación y selección segura de campos.
- [ ] Implementar servicios compartidos de auditoría e idempotencia.
- [ ] Integrar el manejo de errores de la feature 004.


## Fase 6 - Administración de Usuarios

- [ ] Implementar listado y detalle administrativo.
- [ ] Implementar desactivación coordinada y atómica.
- [ ] Implementar reactivación sin restaurar estados históricos.
- [ ] Implementar revocación administrativa de sesiones.
- [ ] Proteger la propia cuenta administrativa.
- [ ] Proteger al último `ADMIN` activo.


## Fase 7 - Administración de Donaciones

- [ ] Implementar listado, detalle y filtros.
- [ ] Detectar donaciones `RESERVADA` bloqueadas.
- [ ] Implementar exclusivamente la resolución `RETIRAR`.
- [ ] Conservar `solicitudAceptadaId` y Solicitud `ACEPTADA`.
- [ ] Conservar Chat, mensajes, confirmaciones y calificación.
- [ ] Proteger la resolución frente a concurrencia.


## Fase 8 - Administración de Solicitudes

- [ ] Implementar listado, detalle y filtros.
- [ ] Mostrar estados, causas y participantes activos de forma segura.
- [ ] Mostrar relación con solicitud aceptada y Chat.
- [ ] Verificar que no existan mutaciones administrativas de estados.


## Fase 9 - Administración de Chats

- [ ] Implementar listado de metadatos.
- [ ] Implementar detalle de metadatos.
- [ ] Calcular la cantidad total de mensajes sin cargar contenidos.
- [ ] Excluir técnicamente el contenido y listado de mensajes.
- [ ] Verificar que ADMIN no pueda enviar o modificar chats.


## Fase 10 - Administración de Calificaciones

- [ ] Implementar listado, detalle y filtros.
- [ ] Derivar propietario y receptor mediante las relaciones aprobadas.
- [ ] Verificar que no existan operaciones de creación, edición o eliminación.
- [ ] Seleccionar únicamente los campos administrativos aprobados.


## Fase 11 - Exenciones de Calificación

- [ ] Implementar la validación de una pendiente real.
- [ ] Crear `ExencionCalificacion` sin puntuación ficticia.
- [ ] Crear la Exención y Auditoría en la misma transacción.
- [ ] Implementar idempotencia y conflicto concurrente.
- [ ] Verificar la unicidad por donación.


## Fase 12 - Auditoría Administrativa

- [ ] Implementar el registro de las cinco acciones auditables.
- [ ] Generar acción, entidad y metadata en el servidor.
- [ ] Evitar contenido prohibido en motivos y metadata.
- [ ] Implementar listado, detalle y filtros de auditorías.
- [ ] Garantizar inmutabilidad y conservación física.


## Fase 13 - Endpoints

- [ ] Implementar los cuatro endpoints administrativos de Usuarios.
- [ ] Implementar los tres endpoints administrativos de Donaciones.
- [ ] Implementar los dos endpoints administrativos de Solicitudes.
- [ ] Implementar los dos endpoints administrativos de Chats.
- [ ] Implementar los tres endpoints administrativos de Calificaciones.
- [ ] Implementar los dos endpoints administrativos de Auditorías.
- [ ] Implementar respuestas `405` con cabecera `Allow`.


## Fase 14 - Paginación, Filtros y Privacidad

- [ ] Aplicar la paginación común a todos los listados.
- [ ] Aplicar el orden `createdAt DESC, id DESC`.
- [ ] Implementar únicamente los filtros aprobados.
- [ ] Seleccionar explícitamente campos seguros.
- [ ] Limitar datos personales al detalle administrativo de usuario.
- [ ] Verificar que no se expongan tokens, hashes, secretos ni mensajes.


## Fase 15 - Sincronización entre Features

### Sincronización Documental

- [x] Sincronizar 002-autenticacion-core con `sid` y validación de Sesión.
- [x] Sincronizar 003-gestion-usuarios con desactivación coordinada.
- [x] Sincronizar 006-donaciones con `solicitudAceptadaId` y `RESERVADA -> RETIRADA`.
- [x] Sincronizar 007-solicitudes con el bloqueo por pendientes y exenciones.
- [x] Sincronizar 008-chat con conservación, solo lectura y metadatos administrativos.
- [x] Sincronizar 009-calificaciones con `ExencionCalificacion`.

### Implementación Transversal

- [ ] Implementar `sid` en la emisión del access token.
- [ ] Implementar validación de Sesión en los guards.
- [ ] Implementar los efectos coordinados de desactivación.
- [ ] Implementar `solicitudAceptadaId` y sus relaciones.
- [ ] Implementar `RESERVADA -> RETIRADA` como transición exclusivamente administrativa.
- [ ] Implementar el bloqueo de solicitudes por pendientes.
- [ ] Implementar `ExencionCalificacion` y su integración con pendientes.
- [ ] Implementar la conservación y privacidad administrativa de Chat.
- [ ] Ejecutar pruebas transversales entre las features relacionadas.


## Fase 16 - Pruebas

- [ ] Probar guard, `sid`, sesiones, usuario activo y rol actual.
- [ ] Probar acceso no administrativo y recursos inexistentes.
- [ ] Probar los 16 endpoints.
- [ ] Probar desactivación, reactivación, sesiones y último administrador.
- [ ] Probar resolución válida, idempotente, incompatible y concurrente.
- [ ] Probar conservación de Solicitud, Chat, mensajes y confirmaciones.
- [ ] Probar ausencia de contenido privado de mensajes.
- [ ] Probar exenciones válidas, duplicadas y concurrentes.
- [ ] Probar auditoría atómica y contenido seguro.
- [ ] Probar paginación, filtros, privacidad y contratos de error.


## Fase 17 - Verificación Final

- [ ] Ejecutar todas las pruebas de la feature.
- [ ] Ejecutar lint correctamente.
- [ ] Ejecutar build correctamente.
- [ ] Verificar migración, restricciones e índices.
- [ ] Verificar todas las sincronizaciones entre features.
- [ ] Verificar que la documentación coincida con la implementación.


## Sincronización final

La administración está implementada y la suite permanente verifica autorización representativa (`ADMIN` 200 y `USUARIO` 403). La cobertura exhaustiva de cada endpoint administrativo continúa identificada como pendiente.

## Criterios de Finalización

La feature solo podrá marcarse como completada cuando:

- Exista `AuditoriaAdministrativa`.
- Exista `ExencionCalificacion`.
- La migración esté aplicada.
- `ExencionCalificacion.donacionId` sea único.
- Funcione el guard administrativo.
- El guard valide `sub`, `sid`, sesión, usuario activo y rol actual.
- Funcionen los 16 endpoints.
- Ningún usuario no `ADMIN` pueda acceder.
- No exista suplantación.
- No puedan cambiarse roles.
- Se proteja al último `ADMIN` activo.
- La desactivación revoque sesiones y coordine sus efectos.
- La reactivación no restaure sesiones ni estados históricos.
- `RESERVADA -> RETIRADA` funcione solo como resolución administrativa.
- La resolución conserve solicitud aceptada, Chat, mensajes y confirmaciones.
- `ADMIN` no pueda consultar contenido de mensajes.
- Las exenciones no creen calificaciones ficticias.
- La consulta de pendientes considere las exenciones.
- Todas las mutaciones sensibles creen su auditoría en la misma transacción.
- Los intentos idempotentes no dupliquen efectos ni auditorías.
- No se elimine físicamente ninguna entidad histórica.
- Todas las respuestas cumplan la feature 004.
- Se respeten las reglas de privacidad.
- Las pruebas pasen.
- Lint y build finalicen correctamente.
- La documentación coincida con la implementación.
