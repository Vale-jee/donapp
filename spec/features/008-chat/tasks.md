# Tareas - Chat

## Fase 1 - Definición Documental

- [x] Aprobar el objetivo, alcance y fuera de alcance.
- [x] Aprobar la creación diferida e idempotente.
- [x] Aprobar los modelos conceptuales Chat y Mensaje.
- [x] Aprobar los participantes derivados sin tabla intermedia.
- [x] Aprobar las reglas de negocio, privacidad y cuentas inactivas.
- [x] Aprobar las validaciones del contenido.
- [x] Aprobar los cinco endpoints y sus contratos.
- [x] Aprobar paginación y orden.
- [x] Aprobar las decisiones de concurrencia e historial.
- [x] Sincronizar documentalmente la resolución administrativa y la supervisión por metadatos.
- [x] Reorganizar la documentación en `spec.md`, `plan.md` y `tasks.md`.


## Fase 2 - Modelo y Migración

- [x] Incorporar el modelo `Chat` con los campos aprobados.
- [x] Incorporar el modelo `Mensaje` con los campos aprobados.
- [x] Verificar que no se agregue un enum de estado para Chat en `schema.prisma`.
- [x] Incorporar las claves foráneas obligatorias.
- [x] Crear y revisar la migración.
- [x] Aplicar la migración en el entorno correspondiente.


## Fase 3 - Restricciones e Índices

- [x] Agregar `UNIQUE` a `Chat.solicitudId`.
- [x] Configurar todas las claves foráneas con `ON DELETE RESTRICT` y `ON UPDATE CASCADE`.
- [x] Crear índices para listar chats de los participantes.
- [x] Crear el índice de mensajes por chat, fecha e identificador.
- [x] Verificar las restricciones directamente en PostgreSQL.


## Fase 4 - Validaciones y Servicios

- [ ] Crear validaciones Zod para identificadores y paginación.
- [ ] Crear la validación Zod del contenido de mensajes.
- [ ] Rechazar campos desconocidos e identificadores de identidad enviados por el cliente.
- [ ] Implementar el servicio de creación u obtención del chat.
- [ ] Implementar servicios de listado, detalle y mensajes.
- [ ] Implementar la selección explícita de campos públicos.


## Fase 5 - Creación del Chat

- [ ] Implementar la creación diferida e idempotente.
- [ ] Validar solicitud `ACEPTADA` y coincidencia con `solicitudAceptadaId`.
- [ ] Validar donación `RESERVADA` y cuentas activas.
- [ ] Proteger la creación frente a concurrencia.
- [ ] Devolver `201` al crear y `200` al obtener el chat existente.


## Fase 6 - Mensajería

- [ ] Implementar la creación de mensajes de texto plano.
- [ ] Obtener el remitente exclusivamente desde el access token.
- [ ] Permitir mensajes únicamente durante `RESERVADA`.
- [ ] Impedir mensajes cuando una cuenta participante esté inactiva.
- [ ] Actualizar consistentemente `ultimoMensajeAt`.
- [ ] Mantener `ENTREGADA` y `RETIRADA` en modo solo lectura.
- [ ] Conservar Chat, participantes y mensajes durante `RESERVADA -> RETIRADA` administrativo.


## Fase 7 - Endpoints

- [ ] Implementar `POST /api/solicitudes/{id}/chat`.
- [ ] Implementar `GET /api/chats`.
- [ ] Implementar `GET /api/chats/{id}`.
- [ ] Implementar `GET /api/chats/{id}/mensajes`.
- [ ] Implementar `POST /api/chats/{id}/mensajes`.
- [ ] Integrar todas las respuestas con la feature 004.
- [ ] Implementar respuestas `405` con la cabecera `Allow`.


## Fase 8 - Privacidad y Autorización

- [ ] Integrar autenticación y validación de cuenta activa.
- [ ] Derivar propietario y solicitante aceptado desde las relaciones aprobadas.
- [ ] Restringir acceso exclusivamente a los dos participantes.
- [ ] Ocultar chats ajenos mediante el mismo `404` público.
- [ ] Verificar que otros solicitantes no descubran el chat.
- [ ] Evitar datos privados y contenido completo de mensajes en logs ordinarios.
- [ ] Limitar las consultas administrativas a metadatos y cantidad total de mensajes.
- [ ] Impedir técnicamente que ADMIN consulte o liste contenido de mensajes.


## Fase 9 - Paginación

- [ ] Implementar paginación del listado de chats.
- [ ] Aplicar el orden aprobado de chats y valores `null` al final.
- [ ] Implementar paginación del listado de mensajes.
- [ ] Aplicar el orden `createdAt DESC, id DESC`.
- [ ] Verificar totales y `totalPages = 0` para listados vacíos.


## Fase 10 - Pruebas

- [ ] Probar creación, obtención idempotente y concurrencia.
- [ ] Probar todas las condiciones de habilitación del chat.
- [ ] Probar autorización y privacidad para cada actor.
- [ ] Probar listado, detalle, paginación y orden.
- [ ] Probar validaciones del mensaje.
- [ ] Probar mensajería en `RESERVADA` y solo lectura en estados posteriores.
- [ ] Probar la resolución administrativa con conservación completa del historial.
- [ ] Probar que las consultas administrativas no devuelvan contenido de mensajes.
- [ ] Probar cuentas inactivas y conservación del historial.
- [ ] Probar códigos HTTP, contratos y cabecera `Allow`.


## Fase 11 - Verificación Final

- [ ] Ejecutar todas las pruebas de la feature.
- [ ] Ejecutar lint correctamente.
- [ ] Ejecutar build correctamente.
- [ ] Verificar la migración, restricciones e índices.
- [ ] Verificar que la documentación coincida con la implementación.


## Integraciones Futuras

- Las notificaciones no formarán parte de la creación ni del envío de mensajes en esta versión.
- La feature 009 dependerá de la donación `ENTREGADA`, no de la actividad del chat.
- La feature 010 definirá supervisión mediante endpoints administrativos separados.
- Estas integraciones no forman parte de la implementación de la feature 008.


## Sincronización final

Chat y mensajería están implementados y forman parte del flujo permanente hasta la entrega. Las casillas abiertas conservan escenarios exhaustivos sin evidencia específica en este cierre.

## Criterios de Finalización

La feature solo podrá marcarse como completada cuando:

- Exista el modelo `Chat`.
- Exista el modelo `Mensaje`.
- La migración esté aplicada.
- `Chat.solicitudId` sea único.
- Solo pueda existir un chat por solicitud aceptada.
- Funcionen los cinco endpoints.
- Solo los dos participantes puedan acceder.
- Solo se envíen mensajes mientras la donación esté `RESERVADA`.
- `ENTREGADA` y `RETIRADA` dejen el chat en modo solo lectura.
- Los mensajes se almacenen como texto plano.
- La creación concurrente no produzca chats duplicados.
- Chats y mensajes conserven el historial.
- Todas las respuestas cumplan la feature 004.
- Las pruebas pasen.
- Lint y build finalicen correctamente.
- La documentación coincida con la implementación.
