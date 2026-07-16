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
- [ ] Disponer de Zod en el proyecto.

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

- [ ] Crear el seed de las diez categorias aprobadas.
- [ ] Reutilizar la normalizacion del nombre en el seed.
- [ ] Crear unicamente categorias inexistentes.
- [ ] Evitar que el seed elimine categorias.
- [ ] Evitar que el seed modifique categorias.
- [ ] Evitar que el seed reactive categorias.
- [ ] Ejecutar el seed varias veces y comprobar su idempotencia.

## Fase 6 - Validaciones

- [ ] Crear la validacion del identificador entero positivo.
- [ ] Crear la validacion de creacion.
- [ ] Crear la validacion de actualizacion parcial.
- [ ] Crear la validacion de cambio de estado.
- [ ] Normalizar espacios del nombre.
- [ ] Validar el nombre entre 3 y 80 caracteres.
- [ ] Comparar nombres sin distinguir mayusculas y minusculas.
- [ ] Normalizar la descripcion opcional.
- [ ] Validar la descripcion con maximo 250 caracteres.
- [ ] Convertir la descripcion vacia a `null`.
- [ ] Rechazar cuerpos vacios y campos desconocidos.
- [ ] Rechazar campos protegidos y relaciones en el `PATCH` general.

## Fase 7 - Servicio de Categorias

- [ ] Crear el servicio de listado publico.
- [ ] Seleccionar exclusivamente `id`, `nombre` y `descripcion` para el catalogo publico.
- [ ] Crear la consulta publica individual.
- [ ] Hacer indistinguible el `404` publico de categoria inexistente o inactiva.
- [ ] Crear la consulta administrativa individual.
- [ ] Crear el servicio de creacion.
- [ ] Crear el servicio de actualizacion parcial.
- [ ] Crear el servicio de cambio de estado.
- [ ] Garantizar la idempotencia del cambio de estado.
- [ ] Traducir conflictos de unicidad a `409`.
- [ ] Evitar devolver objetos Prisma completos.

## Fase 8 - Autenticacion y Autorizacion

- [ ] Reutilizar la autenticacion Bearer de Autenticacion Core.
- [ ] Comprobar que el usuario autenticado exista y permanezca activo.
- [ ] Proteger la creacion con rol `ADMIN`.
- [ ] Proteger la actualizacion con rol `ADMIN`.
- [ ] Proteger el cambio de estado con rol `ADMIN`.
- [ ] Proteger los detalles administrativos con rol `ADMIN`.
- [ ] Responder `401` cuando no exista autenticacion valida.
- [ ] Responder `403` cuando el usuario autenticado no sea `ADMIN`.

## Fase 9 - Endpoints

- [ ] Implementar `GET /api/categorias`.
- [ ] Implementar `GET /api/categorias/{id}`.
- [ ] Implementar `POST /api/categorias`.
- [ ] Implementar `PATCH /api/categorias/{id}`.
- [ ] Implementar `PATCH /api/categorias/{id}/estado`.
- [ ] Rechazar metodos no permitidos con `405`.
- [ ] Enviar la cabecera `Allow` en respuestas `405`.
- [ ] Aplicar el contrato uniforme de respuestas y errores.
- [ ] Confirmar que no exista un endpoint `DELETE`.

## Dependencias Futuras

- La feature `006-donaciones` incorporara la relacion Prisma entre `Categoria` y `Donacion`.
- La feature `006-donaciones` validara que una categoria este activa antes de utilizarla en una nueva donacion.
- Las donaciones existentes conservaran su categoria cuando esta sea desactivada.
- Estas acciones no forman parte de la implementacion de la feature 005.

## Fase 10 - Pruebas y Verificacion

- [ ] Probar el listado publico y sus campos exactos.
- [ ] Probar que el listado excluya categorias inactivas.
- [ ] Probar la consulta individual publica.
- [ ] Probar el mismo `404` para categoria inexistente o inactiva.
- [ ] Probar la consulta administrativa de categorias inactivas.
- [ ] Probar la creacion exitosa con `201`.
- [ ] Probar normalizaciones y longitudes.
- [ ] Probar duplicados normalizados y concurrencia.
- [ ] Probar la actualizacion parcial.
- [ ] Probar el rechazo de campos desconocidos, protegidos y relaciones.
- [ ] Probar la desactivacion, reactivacion e idempotencia.
- [ ] Probar identificadores invalidos y recursos inexistentes.
- [ ] Probar respuestas `401` y `403`.
- [ ] Probar metodos no permitidos y la cabecera `Allow`.
- [ ] Probar el contrato uniforme de la feature 004.
- [ ] Probar la idempotencia del seed.
- [ ] Ejecutar las pruebas con Postman o herramienta equivalente.
- [ ] Ejecutar lint.
- [ ] Ejecutar el build.

## Fase 11 - Cierre Documental

- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Registrar los resultados de migracion, seed, pruebas, lint y build.
- [ ] Actualizar el estado solo cuando se cumplan todos los criterios de finalizacion.

## Criterios de Finalizacion

La feature solo podra marcarse como completada cuando:

- [ ] Exista el modelo `Categoria`.
- [ ] La migracion este aplicada.
- [ ] El seed sea idempotente.
- [ ] Los cinco endpoints funcionen.
- [ ] Las operaciones administrativas esten protegidas por `ADMIN`.
- [ ] La feature documente claramente su dependencia futura con `006-donaciones` sin implementar responsabilidades de Donaciones.
- [ ] Todas las respuestas respeten el contrato de la feature 004.
- [ ] Las pruebas pasen.
- [ ] Lint y build finalicen correctamente.
- [ ] La documentacion coincida con la implementacion.
