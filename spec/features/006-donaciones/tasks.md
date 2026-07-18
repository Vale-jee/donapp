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

- [x] Agregar el enum de estados de Donacion.
- [x] Agregar el modelo `Donacion`.
- [x] Agregar el modelo `ImagenDonacion`.
- [x] Configurar los campos conceptuales aprobados.
- [x] Configurar la relacion con el propietario.
- [x] Configurar la relacion con Categoria.
- [x] Agregar `solicitudAceptadaId` opcional y su relacion con Solicitud.
- [ ] Garantizar que la solicitud referenciada pertenezca a la donacion y este `ACEPTADA`.
- [x] Configurar la relacion y orden de ImagenDonacion.
- [x] Crear los indices necesarios para listados y filtros.
- [ ] Confirmar que no se agreguen modelos completos de Solicitud, Chat o Calificacion.
- [x] Validar el schema Prisma.

## Fase 3 - Migracion y Cliente Prisma

- [x] Crear una migracion nueva.
- [x] Revisar enum, nulabilidad, valores iniciales e integridad referencial.
- [x] Revisar indices y restricciones de imagenes.
- [x] Aplicar la migracion en desarrollo.
- [x] Regenerar el cliente en `generated/prisma`.
- [x] Confirmar el uso del cliente oficial.

## Fase 4 - Validaciones Zod

- [ ] Crear la validacion de identificadores.
- [x] Crear la validacion estricta de creacion con `titulo`, `descripcion`, `categoriaId` e `imagenes`.
- [ ] Crear la validacion de actualizacion parcial.
- [ ] Crear la validacion de retirada.
- [ ] Crear la validacion de confirmacion de entrega.
- [ ] Crear las validaciones de filtros y paginacion.
- [x] Normalizar y validar el titulo entre 5 y 100 caracteres.
- [x] Normalizar y validar la descripcion entre 20 y 1000 caracteres como texto plano.
- [x] Rechazar HTML y Markdown claramente identificables en la descripcion.
- [x] Validar `categoriaId` como entero positivo sin coercion.
- [x] Validar un arreglo directo de entre una y cinco referencias de imagenes.
- [x] Admitir referencias HTTP, HTTPS o rutas iniciadas en `/`.
- [x] Rechazar referencias vacias, duplicadas o mayores a 500 caracteres.
- [x] Rechazar campos desconocidos, administrativos y protegidos durante la creacion.
- [ ] Rechazar cuerpos vacios cuando correspondan.

## Fase 5 - Servicios

- [x] Crear el servicio de publicacion.
- [x] Obtener propietario y ciudad desde el usuario autenticado al publicar.
- [x] Validar que la categoria exista y este activa al crear.
- [ ] Validar la categoria activa al cambiar `categoriaId`.
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
- [x] Seleccionar explicitamente los campos seguros de la respuesta de creacion.
- [ ] Seleccionar explicitamente los campos de las respuestas restantes.

## Fase 6 - Autenticacion y Autorizacion

- [x] Reutilizar `requireAuth` y la autenticacion Bearer de 002 para crear donaciones.
- [x] Comprobar mediante `requireAuth` que el usuario exista y permanezca activo.
- [x] Obtener la identidad y `propietarioId` exclusivamente desde el access token.
- [x] Permitir la creacion a `USUARIO` y `ADMIN` autenticados sin `requireRole`.
- [ ] Proteger actualizacion y retirada por propiedad.
- [ ] Identificar al propietario o receptor durante la confirmacion.
- [ ] Responder `404` cuando la donacion no sea visible.
- [ ] Impedir que `ADMIN` modifique publicaciones ajenas mediante rutas normales.

## Fase 7 - Imagenes

- [x] Persistir referencias sin almacenar archivos binarios durante la creacion.
- [x] Asignar automaticamente ordenes consecutivos desde `1` conservando el orden del arreglo.
- [x] Utilizar la imagen de menor orden como principal.
- [x] Evitar el campo `esPrincipal`.
- [x] Garantizar mediante validacion entre una y cinco imagenes.
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
- [x] Implementar `POST /api/donaciones`.
- [ ] Implementar `PATCH /api/donaciones/{id}`.
- [ ] Implementar `PATCH /api/donaciones/{id}/estado`.
- [ ] Implementar `PATCH /api/donaciones/{id}/confirmacion-entrega`.
- [x] Rechazar metodos no permitidos en `/api/donaciones` con `405` y cabecera `Allow: POST` en esta etapa.
- [ ] Rechazar metodos no permitidos en los endpoints restantes con `405` y cabecera `Allow`.
- [ ] Confirmar que no existan endpoints `PUT` ni `DELETE`.
- [x] Aplicar al endpoint de creacion el contrato uniforme de la feature 004 y manejar `400`, `401`, `403`, `404`, `409`, `405` y `500`.
- [ ] Aplicar el contrato uniforme de la feature 004 a los endpoints restantes.

## Dependencias Futuras

- La feature 007 incorporara la relacion definitiva con Solicitud, la seleccion del receptor y `PUBLICADA -> RESERVADA`.
- La retirada con solicitudes pendientes y su cancelacion historica se coordinara con 007.
- La feature 008 creara el chat despues de aceptar una solicitud.
- La feature 009 utilizara `ENTREGADA` para habilitar la calificacion.
- La feature 010 implementara supervision y resoluciones administrativas.
- Estas responsabilidades futuras no forman parte de la implementacion actual de los modelos completos de Solicitudes, Chat o Calificaciones.

## Fase 10 - Pruebas y Verificacion

- [x] Probar la creacion correcta y sus campos derivados con HTTP `201`.
- [x] Probar la creacion de dos imagenes ordenadas y relacionadas con la misma donacion.
- [ ] Probar la creacion con cinco imagenes.
- [ ] Probar el rechazo de cero y seis imagenes.
- [x] Probar una categoria activa durante la creacion.
- [x] Probar una categoria inexistente con HTTP `404`.
- [ ] Probar una categoria inactiva con HTTP `409`.
- [ ] Probar una categoria desactivada posteriormente.
- [ ] Probar un usuario sin ciudad valida.
- [ ] Probar el listado general y publicaciones propias.
- [ ] Probar filtros, paginacion y orden.
- [ ] Probar visibilidad por estado y participacion.
- [ ] Probar el mismo `404` para inexistente y no visible.
- [x] Probar el rechazo de `propietarioId` enviado por el cliente con HTTP `400`.
- [ ] Probar actualizacion parcial y los campos protegidos restantes.
- [ ] Probar retirada, idempotencia y estados incompatibles.
- [ ] Probar ambas confirmaciones y su idempotencia.
- [ ] Probar la segunda confirmacion atomica.
- [ ] Probar la consistencia de `solicitudAceptadaId`.
- [ ] Probar la resolucion administrativa y la conservacion de Solicitud, Chat, mensajes y confirmaciones.
- [x] Probar HTTP `201`, `400`, `401`, `404` y `405` en la creacion.
- [ ] Probar los codigos HTTP aprobados restantes.
- [x] Probar la privacidad de la respuesta de creacion y la ausencia de propietario, sesiones, hashes y tokens.
- [ ] Probar el contrato uniforme y la privacidad de los endpoints restantes.
- [ ] Ejecutar pruebas con Postman o herramienta equivalente.
- [ ] Ejecutar las pruebas automatizadas aprobadas.
- [x] Ejecutar lint exitosamente para la implementacion de creacion.
- [x] Ejecutar build exitosamente para la implementacion de creacion.

## Evidencia Funcional - POST `/api/donaciones`

- [x] Creacion correcta: HTTP `201`, mensaje `"Donación creada correctamente."`, titulo `"Bicicleta infantil"`, categoria `Juguetes`, ciudad derivada `Quito Norte` y estado derivado `PUBLICADA`.
- [x] Imagenes: se crearon dos `ImagenDonacion` para la misma donacion, con ordenes `1` y `2`, sin campo `esPrincipal`.
- [x] PostgreSQL: se verifico una sola `Donacion`, correspondiente al usuario autenticado, con ciudad `Quito Norte`, estado `PUBLICADA`, categoria `Juguetes` y dos imagenes relacionadas.
- [x] Consistencia transaccional: la primera operacion, rechazada por `ImagenDonacion_orden_check`, se revirtio por completo sin registros parciales; posteriormente se corrigio el orden para comenzar en `1`.
- [x] Campo protegido: `propietarioId` enviado por el cliente fue rechazado con HTTP `400`.
- [x] Solicitud sin autenticacion: HTTP `401` y mensaje `"Access token inválido."`.
- [x] Categoria inexistente: HTTP `404` y mensaje `"Categoría no encontrada."`.
- [x] Metodo `GET` no permitido en esta etapa: HTTP `405` y encabezado `Allow: POST`.
- [x] Seguridad: la respuesta no expuso `propietarioId`, datos privados del propietario, sesiones, hashes ni tokens; ciudad, propietario y estado no pudieron ser definidos por el cliente.

## Fase 11 - Cierre Documental

- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Registrar los resultados de migracion, pruebas, lint y build.
- [ ] Actualizar el estado solo cuando se cumplan todos los criterios de finalizacion.

## Pendientes Inmediatos

- [ ] Probar la creacion con cinco imagenes.
- [ ] Probar el rechazo de cero y seis imagenes.
- [ ] Probar una categoria inactiva con HTTP `409`.
- [ ] Probar un usuario sin ciudad valida.
- [ ] Implementar `GET /api/donaciones`.
- [ ] Implementar `GET /api/donaciones/mias`.
- [ ] Implementar `GET /api/donaciones/{id}`.
- [ ] Implementar `PATCH /api/donaciones/{id}`.
- [ ] Implementar la retirada logica.
- [ ] Implementar la confirmacion de entrega.
- [ ] Ejecutar las pruebas automatizadas aprobadas.
- [ ] Completar y cerrar la feature.

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

## Estado

Pendiente.
