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

- [x] Crear la validacion estricta del identificador para el detalle de donaciones.
- [ ] Crear la validacion de identificadores para las operaciones restantes.
- [x] Crear la validacion estricta de creacion con `titulo`, `descripcion`, `categoriaId` e `imagenes`.
- [ ] Crear la validacion de actualizacion parcial.
- [ ] Crear la validacion de retirada.
- [ ] Crear la validacion de confirmacion de entrega.
- [x] Crear la validacion estricta de filtros y paginacion para publicaciones propias.
- [x] Crear la validacion estricta de filtros y paginacion para el listado general.
- [ ] Crear las validaciones de filtros y paginacion para operaciones restantes cuando correspondan.
- [x] Normalizar y validar el titulo entre 5 y 100 caracteres.
- [x] Normalizar y validar la descripcion entre 20 y 1000 caracteres como texto plano.
- [x] Rechazar HTML y Markdown claramente identificables en la descripcion.
- [x] Validar `categoriaId` como entero positivo sin coercion.
- [x] Validar un arreglo directo de entre una y cinco referencias de imagenes.
- [x] Admitir referencias HTTP, HTTPS o rutas iniciadas en `/`.
- [x] Rechazar referencias vacias, duplicadas o mayores a 500 caracteres.
- [x] Rechazar campos desconocidos, administrativos y protegidos durante la creacion.
- [x] Rechazar parametros desconocidos, vacios, repetidos, no numericos, decimales, negativos o con ceros iniciales en publicaciones propias.
- [x] Rechazar parametros desconocidos o invalidos en el listado general.
- [x] Rechazar identificadores y parametros adicionales invalidos en el detalle de donaciones.
- [ ] Rechazar cuerpos vacios cuando correspondan.

## Fase 5 - Servicios

- [x] Crear el servicio de publicacion.
- [x] Obtener propietario y ciudad desde el usuario autenticado al publicar.
- [x] Validar que la categoria exista y este activa al crear.
- [ ] Validar la categoria activa al cambiar `categoriaId`.
- [x] Crear el servicio de listado general de donaciones disponibles.
- [x] Crear el servicio de publicaciones propias filtrado exclusivamente por `propietarioId` del usuario autenticado.
- [x] Crear el servicio de consulta individual.
- [x] Consultar para el detalle unicamente los campos necesarios del usuario, la donacion, la categoria, las imagenes y la solicitud aceptada.
- [x] Aplicar en el detalle las reglas de visibilidad para propietario, publicacion ajena en la misma ciudad y receptor seleccionado.
- [x] Restringir en el detalle una donacion `RETIRADA` al propietario.
- [ ] Crear el servicio de actualizacion parcial.
- [ ] Restringir la edicion a `PUBLICADA`.
- [ ] Implementar el reemplazo completo de imagenes.
- [ ] Crear el servicio de retirada logica.
- [ ] Garantizar la idempotencia de la retirada.
- [ ] Crear el servicio de confirmacion de entrega.
- [ ] Garantizar la idempotencia de cada confirmacion.
- [ ] Implementar atomicamente la segunda confirmacion y `ENTREGADA`.
- [x] Derivar al receptor en el detalle mediante `solicitudAceptadaId -> Solicitud.solicitanteId` y una solicitud `ACEPTADA` de la misma donacion.
- [ ] Derivar al receptor mediante `solicitudAceptadaId -> Solicitud.solicitanteId` en la confirmacion de entrega.
- [ ] Implementar `RESERVADA -> RETIRADA` exclusivamente desde la resolucion administrativa de 010.
- [x] Seleccionar explicitamente los campos seguros de la respuesta de creacion.
- [x] Seleccionar explicitamente los campos seguros del listado de publicaciones propias.
- [x] Seleccionar explicitamente los campos seguros del listado general.
- [x] Seleccionar explicitamente los campos seguros del detalle y omitir los datos internos de autorizacion.
- [x] Devolver en el detalle la categoria minima y todas las imagenes ordenadas por `orden` ascendente.
- [ ] Seleccionar explicitamente los campos de las respuestas restantes.

## Fase 6 - Autenticacion y Autorizacion

- [x] Reutilizar `requireAuth` y la autenticacion Bearer de 002 para crear donaciones.
- [x] Comprobar mediante `requireAuth` que el usuario exista y permanezca activo.
- [x] Obtener la identidad y `propietarioId` exclusivamente desde el access token.
- [x] Permitir la creacion a `USUARIO` y `ADMIN` autenticados sin `requireRole`.
- [x] Proteger el listado propio con `requireAuth` y permitirlo a `USUARIO` y `ADMIN` sin `requireRole`.
- [x] Impedir que el listado propio consulte publicaciones de otro usuario o donde sea unicamente receptor.
- [x] Proteger el listado general con `requireAuth` y permitirlo a `USUARIO` y `ADMIN` sin `requireRole`.
- [x] Obtener la ciudad del perfil autenticado y excluir publicaciones propias y de otras ciudades en el listado general.
- [x] Proteger el detalle con `requireAuth` y permitirlo a `USUARIO` y `ADMIN` sin `requireRole` ni privilegios administrativos especiales.
- [x] Consultar la ciudad actual desde PostgreSQL para decidir la visibilidad de una publicacion ajena.
- [ ] Proteger actualizacion y retirada por propiedad.
- [ ] Identificar al propietario o receptor durante la confirmacion.
- [x] Responder uniformemente `404` cuando la donacion del detalle no exista o no sea visible.
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

- [x] Implementar `page` con valor inicial `1` en publicaciones propias.
- [x] Implementar `limit` con valor inicial `20` y maximo `100` en publicaciones propias.
- [x] Devolver `page`, `limit`, `total` y `totalPages` en publicaciones propias.
- [x] Ordenar publicaciones propias por `createdAt DESC` e `id DESC`.
- [x] Ejecutar `findMany` y `count` en una transaccion con el mismo filtro de propiedad y estado.
- [x] Permitir una coleccion vacia con HTTP `200` y `totalPages` igual a `0`.
- [x] Implementar `page`, `limit`, metadata y orden estable en el listado general.
- [x] Ejecutar usuario, `findMany` y `count` del listado general dentro de una transaccion con un unico filtro.
- [x] Filtrar el listado general por `PUBLICADA` y ciudad.
- [x] Excluir publicaciones propias del listado general.
- [x] Implementar el filtro opcional por `categoriaId`.
- [x] Implementar el filtro opcional por `PUBLICADA`, `RESERVADA`, `ENTREGADA` o `RETIRADA` en publicaciones propias.

## Fase 9 - Endpoints

- [x] Implementar `GET /api/donaciones` en convivencia con `POST /api/donaciones`.
- [x] Implementar `GET /api/donaciones/mias`.
- [x] Implementar `GET /api/donaciones/{id}` mediante una ruta dinamica de Pages Router.
- [x] Implementar `POST /api/donaciones`.
- [ ] Implementar `PATCH /api/donaciones/{id}`.
- [ ] Implementar `PATCH /api/donaciones/{id}/estado`.
- [ ] Implementar `PATCH /api/donaciones/{id}/confirmacion-entrega`.
- [x] Rechazar metodos distintos de `GET` y `POST` en `/api/donaciones` con `405` y cabecera `Allow: GET, POST`.
- [x] Rechazar metodos no permitidos en `/api/donaciones/mias` con `405` y cabecera `Allow: GET`.
- [x] Rechazar metodos distintos de `GET` en `/api/donaciones/{id}` con `405` y cabecera `Allow: GET`.
- [ ] Rechazar metodos no permitidos en los endpoints restantes con `405` y cabecera `Allow`.
- [ ] Confirmar que no existan endpoints `PUT` ni `DELETE`.
- [x] Aplicar al endpoint de creacion el contrato uniforme de la feature 004 y manejar `400`, `401`, `403`, `404`, `409`, `405` y `500`.
- [x] Aplicar al listado propio el contrato uniforme de la feature 004 y manejar `200`, `400`, `401`, `403`, `405` y `500`.
- [x] Aplicar al listado general el contrato uniforme de la feature 004 y manejar `200`, `400`, `401`, `403`, `409`, `405` y `500`.
- [x] Aplicar al detalle el contrato uniforme de la feature 004 y manejar `200`, `400`, `401`, `403`, `404`, `405` y `500`.
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
- [x] Probar el listado de publicaciones propias con HTTP `200` y propiedad restringida al usuario autenticado.
- [x] Probar el listado general con HTTP `200`, misma ciudad, estado `PUBLICADA` y exclusion de publicaciones propias.
- [x] Probar el filtro `estado=PUBLICADA` en publicaciones propias.
- [x] Probar el rechazo de `limit=101` con HTTP `400`.
- [ ] Probar la paginacion de publicaciones propias con una segunda pagina.
- [ ] Probar los filtros `RESERVADA`, `ENTREGADA` y `RETIRADA` cuando existan datos.
- [ ] Probar funcionalmente la coleccion vacia en publicaciones propias.
- [x] Probar el filtro `categoriaId=6` y una categoria sin coincidencias con coleccion vacia en el listado general.
- [ ] Probar funcionalmente el listado general con donaciones de otra ciudad.
- [ ] Probar la exclusion de `RESERVADA`, `ENTREGADA` y `RETIRADA` cuando existan datos.
- [ ] Probar la segunda pagina del listado general.
- [x] Probar el detalle de una donacion ajena `PUBLICADA` en la misma ciudad con HTTP `200`.
- [ ] Probar al propietario con donaciones `RESERVADA`, `ENTREGADA` y `RETIRADA`.
- [ ] Probar el detalle como receptor seleccionado.
- [ ] Probar el detalle de una donacion ajena de otra ciudad.
- [ ] Probar el mismo `404` para inexistente y no visible.
- [x] Probar una donacion inexistente con HTTP `404` y mensaje publico uniforme.
- [x] Probar un identificador invalido con HTTP `400`.
- [x] Probar un metodo no permitido en el detalle con HTTP `405` y `Allow: GET`.
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
- [x] Probar la privacidad del listado propio y la ausencia de descripcion completa, propietario, solicitudes, sesiones, hashes y tokens.
- [x] Probar la privacidad del listado general y la ausencia de informacion del propietario, solicitudes, sesiones, hashes y tokens.
- [x] Probar la privacidad del detalle y la ausencia de propietario, solicitud aceptada y datos privados.
- [ ] Probar el contrato uniforme y la privacidad de los endpoints restantes.
- [x] Guardar en Postman la peticion `Donaciones - Listar mis donaciones`.
- [x] Guardar en Postman la peticion `Donaciones - Listar disponibles`.
- [ ] Ejecutar en Postman las pruebas funcionales restantes.
- [ ] Ejecutar las pruebas automatizadas aprobadas.
- [x] Ejecutar lint exitosamente para la implementacion de creacion.
- [x] Ejecutar build exitosamente para la implementacion de creacion.
- [x] Ejecutar lint exitosamente para el listado de publicaciones propias.
- [x] Ejecutar build exitosamente para el listado de publicaciones propias.
- [x] Ejecutar lint exitosamente para el listado general.
- [x] Ejecutar build exitosamente para el listado general.
- [x] Ejecutar lint exitosamente para el detalle de una donacion.
- [x] Ejecutar build exitosamente para el detalle de una donacion.

## Evidencia Funcional - POST `/api/donaciones`

- [x] Creacion correcta: HTTP `201`, mensaje `"Donación creada correctamente."`, titulo `"Bicicleta infantil"`, categoria `Juguetes`, ciudad derivada `Quito Norte` y estado derivado `PUBLICADA`.
- [x] Imagenes: se crearon dos `ImagenDonacion` para la misma donacion, con ordenes `1` y `2`, sin campo `esPrincipal`.
- [x] PostgreSQL: se verifico una sola `Donacion`, correspondiente al usuario autenticado, con ciudad `Quito Norte`, estado `PUBLICADA`, categoria `Juguetes` y dos imagenes relacionadas.
- [x] Consistencia transaccional: la primera operacion, rechazada por `ImagenDonacion_orden_check`, se revirtio por completo sin registros parciales; posteriormente se corrigio el orden para comenzar en `1`.
- [x] Campo protegido: `propietarioId` enviado por el cliente fue rechazado con HTTP `400`.
- [x] Solicitud sin autenticacion: HTTP `401` y mensaje `"Access token inválido."`.
- [x] Categoria inexistente: HTTP `404` y mensaje `"Categoría no encontrada."`.
- [x] Regresion posterior: `POST /api/donaciones` continuo funcionando con HTTP `201` al convivir con el listado general.
- [x] Seguridad: la respuesta no expuso `propietarioId`, datos privados del propietario, sesiones, hashes ni tokens; ciudad, propietario y estado no pudieron ser definidos por el cliente.

## Evidencia Funcional - GET `/api/donaciones/mias`

- [x] Listado correcto: HTTP `200`, mensaje `"Donaciones propias consultadas correctamente."` y unicamente donaciones del usuario autenticado.
- [x] La respuesta devolvio categoria, imagen principal derivada del menor orden, cantidad de imagenes y `pagination` con `page`, `limit`, `total` y `totalPages`.
- [x] Filtro `estado=PUBLICADA`: HTTP `200` y todas las donaciones devueltas en estado `PUBLICADA`.
- [x] Limite invalido `limit=101`: HTTP `400` y mensaje `"Datos inválidos."`.
- [x] Metodo `POST` no permitido: HTTP `405` y encabezado `Allow: GET`.
- [x] Seguridad: no se devolvio descripcion completa, `propietarioId`, datos privados del propietario, solicitudes, sesiones, hashes ni tokens; los parametros no permitieron consultar donaciones de otro usuario.
- [x] Peticion guardada en Postman como `Donaciones - Listar mis donaciones`.

## Evidencia Funcional - GET `/api/donaciones`

- [x] Listado general: HTTP `200`, mensaje `"Donaciones disponibles consultadas correctamente."` y usuario autenticado `prueba.cambio.04@donapp.test`.
- [x] Visibilidad: mostro `"Mesa auxiliar de madera"` de Adriana Cruz, con ciudad `Quito Norte` y estado `PUBLICADA`, y excluyo las bicicletas del usuario autenticado.
- [x] Representacion: incluyo categoria, imagen principal, cantidad de imagenes y paginacion.
- [x] Regresion del POST: Adriana Cruz creo `"Mesa auxiliar de madera"` con HTTP `201` y se confirmo que la creacion continuo funcionando.
- [x] Filtro `categoriaId=6`: HTTP `200` y resultado de categoria `Muebles`.
- [x] Categoria sin coincidencias `categoriaId=999999`: HTTP `200`, `donaciones: []`, `total: 0` y `totalPages: 0`.
- [x] Metodo `PATCH` no permitido: HTTP `405` y encabezado `Allow: GET, POST`.
- [x] Seguridad: no se devolvio `propietarioId`, nombre, correo, telefono, foto, solicitudes, sesiones, hashes ni tokens; ciudad, propietario y estado no pudieron ser enviados por el cliente y las publicaciones propias se excluyeron automaticamente.
- [x] Peticion guardada en Postman como `Donaciones - Listar disponibles`.

## Evidencia Funcional - GET `/api/donaciones/{id}`

- [x] Consulta correcta de `GET /api/donaciones/4`: HTTP `200`, mensaje `"Donación consultada correctamente."`, donacion `"Mesa auxiliar de madera"`, ciudad `Quito Norte`, estado `PUBLICADA` y categoria `Muebles`.
- [x] Imagenes: se devolvio la imagen con orden `1` dentro de la coleccion ordenada ascendentemente.
- [x] Seguridad: no se devolvieron `propietarioId`, `solicitudAceptadaId` ni datos privados.
- [x] Donacion inexistente `GET /api/donaciones/999999`: HTTP `404` y mensaje `"Donación no encontrada."`.
- [x] Identificador invalido `GET /api/donaciones/abc`: HTTP `400` y mensaje `"Datos inválidos."`.
- [x] Metodo `POST` no permitido en `/api/donaciones/4`: HTTP `405` y encabezado `Allow: GET`.
- [x] Evidencia grafica `05_GET_detalle_donacion_200.png`.
- [x] Evidencia grafica `06_GET_donacion_inexistente_404.png`.

## Fase 11 - Cierre Documental

- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Registrar los resultados de migracion, pruebas, lint y build.
- [ ] Actualizar el estado solo cuando se cumplan todos los criterios de finalizacion.

## Pendientes Inmediatos

- [ ] Probar la creacion con cinco imagenes.
- [ ] Probar el rechazo de cero y seis imagenes.
- [ ] Probar una categoria inactiva con HTTP `409`.
- [ ] Probar un usuario sin ciudad valida.
- [ ] Probar al propietario con donaciones `RESERVADA`, `ENTREGADA` y `RETIRADA`.
- [ ] Probar el detalle como receptor seleccionado.
- [ ] Probar el detalle con un usuario de otra ciudad.
- [ ] Implementar `PATCH /api/donaciones/{id}`.
- [ ] Implementar la retirada logica.
- [ ] Implementar la confirmacion de entrega.
- [ ] Probar funcionalmente la coleccion vacia en publicaciones propias.
- [ ] Probar la paginacion de publicaciones propias con una segunda pagina.
- [ ] Probar los filtros `RESERVADA`, `ENTREGADA` y `RETIRADA` cuando existan datos.
- [ ] Probar funcionalmente un usuario inactivo.
- [ ] Probar funcionalmente el listado general con donaciones de otra ciudad.
- [ ] Probar la exclusion de estados `RESERVADA`, `ENTREGADA` y `RETIRADA` en el listado general.
- [ ] Probar una segunda pagina en el listado general.
- [ ] Probar un usuario sin ciudad valida en el listado general.
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
