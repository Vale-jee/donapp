# Donaciones - Tareas

## Fase 1 - Decisiones Documentales

- [x] Definir el objetivo y alcance exclusivo de Donaciones.
- [x] Aprobar los estados `PUBLICADA`, `RESERVADA`, `ENTREGADA` y `RETIRADA`.
- [x] Aprobar el flujo principal y la retirada logica.
- [x] Excluir la eliminacion fisica y los endpoints `PUT` y `DELETE`.
- [x] Aprobar los siete endpoints REST.
- [x] Aprobar la propiedad derivada del access token.
- [x] Aprobar las reglas de ciudad historica y categoria.
- [x] Aprobar la edicion exclusiva en `PUBLICADA`.
- [x] Aprobar las reglas de titulo y descripcion.
- [x] Aprobar entre una y cinco imagenes y su reemplazo completo.
- [x] Aprobar la paginacion y el orden de listados.
- [x] Aprobar las reglas de visibilidad por estado.
- [x] Aprobar la retirada idempotente.
- [x] Aprobar la doble confirmacion idempotente.
- [x] Aprobar la distribucion de responsabilidades con 007, 008, 009 y 010.
- [x] Sincronizar documentalmente `solicitudAceptadaId` y la transicion administrativa `RESERVADA -> RETIRADA`.
- [x] Aprobar los contratos y codigos HTTP.
- [x] Separar la documentacion en `spec.md`, `plan.md` y `tasks.md`.

## Fase 2 - Modelo Prisma

- [ ] Agregar el enum de estados de Donacion.
- [ ] Agregar el modelo `Donacion`.
- [ ] Agregar el modelo `ImagenDonacion`.
- [ ] Configurar los campos conceptuales aprobados.
- [ ] Configurar la relacion con el propietario.
- [ ] Configurar la relacion con Categoria.
- [ ] Agregar `solicitudAceptadaId` opcional y su relacion con Solicitud.
- [ ] Garantizar que la solicitud referenciada pertenezca a la donacion y este `ACEPTADA`.
- [ ] Configurar la relacion y orden de ImagenDonacion.
- [ ] Crear los indices necesarios para listados y filtros.
- [ ] Confirmar que no se agreguen modelos completos de Solicitud, Chat o Calificacion.
- [ ] Validar el schema Prisma.

## Fase 3 - Migracion y Cliente Prisma

- [ ] Crear una migracion nueva.
- [ ] Revisar enum, nulabilidad, valores iniciales e integridad referencial.
- [ ] Revisar indices y restricciones de imagenes.
- [ ] Aplicar la migracion en desarrollo.
- [ ] Regenerar el cliente en `generated/prisma`.
- [ ] Confirmar el uso del cliente oficial.

## Fase 4 - Validaciones Zod

- [ ] Crear la validacion de identificadores.
- [ ] Crear la validacion de creacion.
- [ ] Crear la validacion de actualizacion parcial.
- [ ] Crear la validacion de retirada.
- [ ] Crear la validacion de confirmacion de entrega.
- [ ] Crear las validaciones de filtros y paginacion.
- [ ] Normalizar y validar el titulo.
- [ ] Normalizar y validar la descripcion.
- [ ] Validar entre una y cinco referencias de imagenes.
- [ ] Rechazar campos desconocidos y protegidos.
- [ ] Rechazar cuerpos vacios cuando correspondan.

## Fase 5 - Servicios

- [ ] Crear el servicio de publicacion.
- [ ] Obtener propietario y ciudad desde el usuario autenticado.
- [ ] Validar la categoria activa al crear o cambiar `categoriaId`.
- [ ] Crear el servicio de listado general.
- [ ] Crear el servicio de publicaciones propias.
- [ ] Crear el servicio de consulta individual.
- [ ] Aplicar las reglas de visibilidad por estado.
- [ ] Crear el servicio de actualizacion parcial.
- [ ] Restringir la edicion a `PUBLICADA`.
- [ ] Implementar el reemplazo completo de imagenes.
- [ ] Crear el servicio de retirada logica.
- [ ] Garantizar la idempotencia de la retirada.
- [ ] Crear el servicio de confirmacion de entrega.
- [ ] Garantizar la idempotencia de cada confirmacion.
- [ ] Implementar atomicamente la segunda confirmacion y `ENTREGADA`.
- [ ] Derivar al receptor mediante `solicitudAceptadaId -> Solicitud.solicitanteId`.
- [ ] Implementar `RESERVADA -> RETIRADA` exclusivamente desde la resolucion administrativa de 010.
- [ ] Seleccionar explicitamente los campos de todas las respuestas.

## Fase 6 - Autenticacion y Autorizacion

- [ ] Reutilizar la autenticacion Bearer de 002.
- [ ] Comprobar que el usuario exista y permanezca activo.
- [ ] Obtener la identidad exclusivamente desde el access token.
- [ ] Proteger actualizacion y retirada por propiedad.
- [ ] Identificar al propietario o receptor durante la confirmacion.
- [ ] Responder `404` cuando la donacion no sea visible.
- [ ] Impedir que `ADMIN` modifique publicaciones ajenas mediante rutas normales.

## Fase 7 - Imagenes

- [ ] Persistir referencias sin almacenar archivos binarios.
- [ ] Asignar automaticamente el orden del arreglo.
- [ ] Utilizar la primera imagen como principal.
- [ ] Evitar el campo `esPrincipal`.
- [ ] Garantizar entre una y cinco imagenes.
- [ ] Reemplazar la coleccion completa dentro de una operacion consistente.
- [ ] Impedir modificaciones de imagenes fuera de `PUBLICADA`.

## Fase 8 - Paginacion y Consultas

- [ ] Implementar `page` con valor inicial `1`.
- [ ] Implementar `limit` con valor inicial `20` y maximo `100`.
- [ ] Devolver `page`, `limit`, `total` y `totalPages`.
- [ ] Ordenar por `createdAt DESC` e `id DESC`.
- [ ] Filtrar el listado general por `PUBLICADA` y ciudad.
- [ ] Excluir publicaciones propias del listado general.
- [ ] Implementar el filtro por categoria.
- [ ] Implementar el filtro por estado en publicaciones propias.

## Fase 9 - Endpoints

- [ ] Implementar `GET /api/donaciones`.
- [ ] Implementar `GET /api/donaciones/mias`.
- [ ] Implementar `GET /api/donaciones/{id}`.
- [ ] Implementar `POST /api/donaciones`.
- [ ] Implementar `PATCH /api/donaciones/{id}`.
- [ ] Implementar `PATCH /api/donaciones/{id}/estado`.
- [ ] Implementar `PATCH /api/donaciones/{id}/confirmacion-entrega`.
- [ ] Rechazar metodos no permitidos con `405` y cabecera `Allow`.
- [ ] Confirmar que no existan endpoints `PUT` ni `DELETE`.
- [ ] Aplicar el contrato uniforme de la feature 004.

## Dependencias Futuras

- La feature 007 incorporara la relacion definitiva con Solicitud, la seleccion del receptor y `PUBLICADA -> RESERVADA`.
- La retirada con solicitudes pendientes y su cancelacion historica se coordinara con 007.
- La feature 008 creara el chat despues de aceptar una solicitud.
- La feature 009 utilizara `ENTREGADA` para habilitar la calificacion.
- La feature 010 implementara supervision y resoluciones administrativas.
- Estas responsabilidades futuras no forman parte de la implementacion actual de los modelos completos de Solicitudes, Chat o Calificaciones.

## Fase 10 - Pruebas y Verificacion

- [ ] Probar la creacion y sus campos derivados.
- [ ] Probar titulo, descripcion e imagenes.
- [ ] Probar categorias activas, inactivas y desactivadas posteriormente.
- [ ] Probar el listado general y publicaciones propias.
- [ ] Probar filtros, paginacion y orden.
- [ ] Probar visibilidad por estado y participacion.
- [ ] Probar el mismo `404` para inexistente y no visible.
- [ ] Probar actualizacion parcial y campos protegidos.
- [ ] Probar retirada, idempotencia y estados incompatibles.
- [ ] Probar ambas confirmaciones y su idempotencia.
- [ ] Probar la segunda confirmacion atomica.
- [ ] Probar la consistencia de `solicitudAceptadaId`.
- [ ] Probar la resolucion administrativa y la conservacion de Solicitud, Chat, mensajes y confirmaciones.
- [ ] Probar todos los codigos HTTP aprobados.
- [ ] Probar el contrato uniforme y la privacidad.
- [ ] Ejecutar pruebas con Postman o herramienta equivalente.
- [ ] Ejecutar las pruebas automatizadas aprobadas.
- [ ] Ejecutar lint.
- [ ] Ejecutar build.

## Fase 11 - Cierre Documental

- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Registrar los resultados de migracion, pruebas, lint y build.
- [ ] Actualizar el estado solo cuando se cumplan todos los criterios de finalizacion.

## Criterios de Finalizacion

La feature solo podra marcarse como completada cuando:

- [ ] Exista el modelo `Donacion`.
- [ ] Exista `ImagenDonacion`.
- [ ] La migracion este aplicada.
- [ ] Los siete endpoints funcionen.
- [ ] Las reglas de estados se cumplan.
- [ ] La retirada logica funcione.
- [ ] La confirmacion doble funcione.
- [ ] Todas las respuestas respeten la feature 004.
- [ ] Las pruebas pasen.
- [ ] Lint y build finalicen correctamente.
- [ ] La documentacion coincida con la implementacion.
- [ ] `solicitudAceptadaId` identifique una Solicitud `ACEPTADA` de la misma donacion.
- [ ] La transicion `RESERVADA -> RETIRADA` solo se origine administrativamente y conserve todo el historial.
