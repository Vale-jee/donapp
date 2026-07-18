# Categorias - Tareas

## Fase 1 - Decisiones Documentales

- [x] Definir el objetivo y el alcance exclusivo de Categorias.
- [x] Aprobar la desactivacion logica y excluir la eliminacion fisica.
- [x] Aprobar los cinco endpoints REST.
- [x] Aprobar los contratos publicos y administrativos.
- [x] Aprobar la consulta publica de categorias activas.
- [x] Aprobar el mismo `404` publico para categorias inexistentes o inactivas.
- [x] Aprobar la proteccion administrativa mediante rol `ADMIN`.
- [x] Aprobar el modelo conceptual `Categoria`.
- [x] Aprobar las reglas de normalizacion y validacion.
- [x] Aprobar la actualizacion parcial mediante `PATCH`.
- [x] Aprobar el cambio de estado idempotente.
- [x] Aprobar las diez categorias iniciales.
- [x] Aprobar las reglas del seed idempotente.
- [x] Aprobar el uso del contrato de Manejo de Errores.
- [x] Posponer la relacion Prisma con `Donacion` hasta la feature 006.
- [x] Separar la documentacion en `spec.md`, `plan.md` y `tasks.md`.

## Fase 2 - Bases Tecnicas Existentes

- [x] Disponer de Next.js con Pages Router.
- [x] Disponer de TypeScript.
- [x] Disponer de PostgreSQL y Prisma ORM.
- [x] Disponer del cliente Prisma en `generated/prisma`.
- [ ] Completar Autenticacion Core.
- [ ] Implementar el mecanismo transversal de Manejo de Errores.
- [x] Disponer de Zod en el proyecto.

## Fase 3 - Modelo Prisma

- [x] Agregar el modelo `Categoria` a `prisma/schema.prisma`.
- [x] Configurar `id`, `nombre`, `descripcion`, `activo`, `createdAt` y `updatedAt`.
- [ ] Garantizar la unicidad del nombre sin distinguir mayusculas y minusculas.
- [ ] Confirmar que no se agregue todavia la relacion con `Donacion`.
- [x] Validar el schema Prisma.

## Fase 4 - Migracion y Cliente Prisma

- [x] Crear una migracion nueva para `Categoria`.
- [x] Revisar las restricciones y valores iniciales generados.
- [x] Revisar la estrategia de unicidad normalizada en PostgreSQL.
- [x] Aplicar la migracion en el entorno de desarrollo.
- [x] Regenerar el cliente Prisma en `generated/prisma`.
- [x] Confirmar que la aplicacion utilice el cliente oficial.

## Fase 5 - Seed Inicial

- [x] Crear el seed de las diez categorias aprobadas y conservar el seed existente de roles.
- [x] Reutilizar la normalizacion del nombre en el seed.
- [x] Crear unicamente categorias inexistentes con estado inicial activo.
- [x] Evitar que el seed elimine categorias.
- [x] Evitar que el seed modifique categorias.
- [x] Evitar que el seed reactive categorias.
- [x] Ejecutar el seed dos veces y comprobar su idempotencia y ausencia de duplicados.

## Fase 6 - Validaciones

- [ ] Crear la validacion del identificador entero positivo.
- [x] Crear la validacion de creacion.
- [ ] Crear la validacion de actualizacion parcial.
- [ ] Crear la validacion de cambio de estado.
- [x] Normalizar espacios del nombre.
- [x] Validar el nombre entre 3 y 80 caracteres.
- [x] Comparar nombres sin distinguir mayusculas y minusculas durante la creacion.
- [x] Normalizar la descripcion opcional.
- [x] Validar la descripcion con maximo 250 caracteres.
- [x] Convertir la descripcion vacia a `null`.
- [x] Rechazar cuerpos vacios y campos desconocidos en la creacion.
- [x] Rechazar campos protegidos y relaciones en el body de creacion.
- [ ] Rechazar campos protegidos y relaciones en el `PATCH` general.

## Fase 7 - Servicio de Categorias

- [x] Crear el servicio de listado publico de categorias activas ordenadas por nombre ascendente.
- [x] Seleccionar exclusivamente `id`, `nombre` y `descripcion` para el catalogo publico.
- [ ] Crear la consulta publica individual.
- [ ] Hacer indistinguible el `404` publico de categoria inexistente o inactiva.
- [ ] Crear la consulta administrativa individual.
- [x] Crear el servicio de creacion.
- [ ] Crear el servicio de actualizacion parcial.
- [ ] Crear el servicio de cambio de estado.
- [ ] Garantizar la idempotencia del cambio de estado.
- [x] Traducir conflictos de unicidad `P2002` y serializacion `P2034` a `409` durante la creacion.
- [x] Comprobar duplicados de creacion sin distinguir mayusculas y minusculas dentro de una transaccion `Serializable`.
- [x] Crear categorias con `activo: true` seleccionado por el servidor.
- [x] Seleccionar exclusivamente `id`, `nombre`, `descripcion`, `activo`, `createdAt` y `updatedAt` en la creacion.
- [x] Evitar devolver objetos Prisma completos en el listado publico.
- [ ] Evitar devolver objetos Prisma completos en los demas endpoints.

## Fase 8 - Autenticacion y Autorizacion

- [x] Reutilizar la autenticacion Bearer de Autenticacion Core en la creacion.
- [x] Comprobar que el usuario autenticado exista y permanezca activo mediante `requireAuth` en la creacion.
- [x] Proteger la creacion mediante `requireRole(auth, ["ADMIN"])`.
- [ ] Proteger la actualizacion con rol `ADMIN`.
- [ ] Proteger el cambio de estado con rol `ADMIN`.
- [ ] Proteger los detalles administrativos con rol `ADMIN`.
- [x] Responder `401` cuando no exista autenticacion valida en la creacion.
- [x] Responder `403` cuando el usuario autenticado no sea `ADMIN` en la creacion.

## Fase 9 - Endpoints

- [x] Implementar el endpoint publico `GET /api/categorias` sin autenticacion ni autorizacion.
- [ ] Implementar `GET /api/categorias/{id}`.
- [x] Implementar `POST /api/categorias`.
- [ ] Implementar `PATCH /api/categorias/{id}`.
- [ ] Implementar `PATCH /api/categorias/{id}/estado`.
- [x] Permitir `GET` publico y `POST` administrativo en `/api/categorias`, rechazando otros metodos con HTTP `405` y cabecera `Allow: GET, POST`.
- [ ] Rechazar metodos no permitidos en los demas endpoints con HTTP `405` y cabecera `Allow`.
- [x] Rechazar parametros query en el listado con HTTP `400`.
- [x] Rechazar parametros query en la creacion con HTTP `400`.
- [x] Responder HTTP `200` con las categorias activas o un arreglo vacio.
- [x] Responder HTTP `201` al crear una categoria como `ADMIN`.
- [x] Responder HTTP `500` de forma sanitizada ante errores internos del listado.
- [x] Aplicar el contrato uniforme de respuestas y errores en `GET /api/categorias`.
- [x] Aplicar el contrato uniforme de respuestas y errores en `POST /api/categorias`.
- [ ] Aplicar el contrato uniforme de respuestas y errores en los demas endpoints.
- [ ] Confirmar que no exista un endpoint `DELETE`.

## Dependencias Futuras

- La feature `006-donaciones` incorporara la relacion Prisma entre `Categoria` y `Donacion`.
- La feature `006-donaciones` validara que una categoria este activa antes de utilizarla en una nueva donacion.
- Las donaciones existentes conservaran su categoria cuando esta sea desactivada.
- Estas acciones no forman parte de la implementacion de la feature 005.

## Fase 10 - Pruebas y Verificacion

- [x] Probar el listado publico con HTTP `200`, sus campos exactos y el orden por nombre ascendente.
- [x] Probar que el listado devuelva exclusivamente las diez categorias activas iniciales.
- [ ] Probar la consulta individual publica.
- [ ] Probar el mismo `404` para categoria inexistente o inactiva.
- [ ] Probar la consulta administrativa de categorias inactivas.
- [x] Probar la creacion exitosa con `201` mediante una cuenta `ADMIN` activa.
- [x] Probar la normalizacion de espacios durante la creacion.
- [ ] Probar funcionalmente los limites minimo y maximo de nombre y descripcion.
- [x] Probar un duplicado normalizado sin distinguir mayusculas y minusculas.
- [ ] Probar funcionalmente conflictos concurrentes de creacion.
- [ ] Probar la actualizacion parcial.
- [ ] Probar el rechazo de campos desconocidos, protegidos y relaciones.
- [ ] Probar la desactivacion, reactivacion e idempotencia.
- [ ] Probar identificadores invalidos y recursos inexistentes.
- [x] Probar respuestas `401` sin autenticacion y `403` con rol `USUARIO` durante la creacion.
- [ ] Probar la creacion con una cuenta `ADMIN` inactiva.
- [x] Probar el rechazo de parametros query con HTTP `400`.
- [ ] Probar un metodo distinto de `GET` y `POST` con HTTP `405` y cabecera `Allow: GET, POST`.
- [x] Probar el contrato uniforme observado en el listado publico.
- [x] Probar la idempotencia del seed mediante dos ejecuciones sin duplicados.
- [x] Guardar en Postman la peticion `Categorias - Listar activas`.
- [x] Ejecutar lint.
- [x] Ejecutar el build.

Evidencia del seed inicial:

- Se crearon activas las diez categorias aprobadas: `Ropa y calzado`, `Alimentos`, `Libros`, `Juguetes`, `Tecnología`, `Muebles`, `Artículos para el hogar`, `Salud`, `Útiles escolares` y `Otros`.
- El seed conservo los roles existentes y se ejecuto dos veces sin crear categorias duplicadas.

Evidencia funcional de `GET /api/categorias`:

- Listado publico: HTTP `200`, mensaje `"Categorias consultadas correctamente."` y diez categorias activas ordenadas por nombre.
- Solicitud con `id=1`: HTTP `400`; los parametros query fueron rechazados.
- La ruta admite `GET` publico y `POST` administrativo; los demas metodos responden HTTP `405` con encabezado `Allow: GET, POST`.
- Peticion guardada en Postman como `Categorias - Listar activas`.

Evidencia funcional de `POST /api/categorias`:

- Creacion por `ADMIN`: Adriana Cruz fue configurada localmente con rol `ADMIN`; `POST /api/categorias` respondio HTTP `201` con mensaje `"Categoria creada correctamente."` y creo `Material deportivo`, descripcion `Artículos destinados a actividades deportivas.`, `activo: true`, devolviendo exclusivamente `id`, `nombre`, `descripcion`, `activo`, `createdAt` y `updatedAt`, sin relaciones ni datos privados.
- Proteccion por rol: `prueba.cambio.04@donapp.test`, con rol `USUARIO`, recibio HTTP `403` y mensaje `"No tiene permisos para realizar esta operación."`; la categoria enviada no fue creada.
- Sin autenticacion: `POST /api/categorias` sin token respondio HTTP `401` con mensaje `"Access token inválido."`.
- Duplicado normalizado: el nombre `"  material   deportivo  "` respondio HTTP `409` con mensaje `"La categoría ya existe."`; se comprobo la normalizacion de espacios y la comparacion sin distinguir mayusculas y minusculas.
- Regresion del listado: `GET /api/categorias` sin autenticacion respondio HTTP `200` y mostro `Material deportivo`; el listado publico continuo funcionando.
- Evidencias graficas registradas: `13_POST_categoria_admin_201.png` y `14_POST_categoria_usuario_403.png`.
- Evidencia grafica opcional: `15_GET_categorias_con_nueva_categoria_200.png` se registrara unicamente si fue guardada; su existencia no fue confirmada en esta actualizacion.
- Verificacion tecnica de la implementacion: lint y build finalizaron exitosamente.

## Fase 11 - Cierre Documental

- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Registrar los resultados de migracion, seed, pruebas, lint y build.
- [ ] Actualizar el estado solo cuando se cumplan todos los criterios de finalizacion.

## Criterios de Finalizacion

La feature solo podra marcarse como completada cuando:

- [ ] Exista el modelo `Categoria`.
- [ ] La migracion este aplicada.
- [x] El seed sea idempotente.
- [ ] Los cinco endpoints funcionen.
- [ ] Las operaciones administrativas esten protegidas por `ADMIN`.
- [ ] La feature documente claramente su dependencia futura con `006-donaciones` sin implementar responsabilidades de Donaciones.
- [ ] Todas las respuestas respeten el contrato de la feature 004.
- [ ] Las pruebas pasen.
- [x] Lint y build finalicen correctamente.
- [ ] La documentacion coincida con la implementacion.
