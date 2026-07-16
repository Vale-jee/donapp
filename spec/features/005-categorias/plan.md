# Categorias - Plan de Implementacion

## Dependencias Previas

La implementacion depende de `002-autenticacion-core` para validar access tokens, comprobar que el usuario exista y permanezca activo, y verificar el rol `ADMIN` en las operaciones protegidas.

Tambien depende de `004-manejo-errores` para utilizar el contrato uniforme de respuestas, normalizar validaciones, traducir errores tecnicos y evitar la exposicion de informacion interna.

La consulta publica de categorias activas no requerira autenticacion. Las operaciones de creacion, actualizacion y cambio de estado se implementaran despues de disponer del mecanismo reutilizable de autenticacion y autorizacion.

## Arquitectura

La feature se organizara mediante el siguiente flujo:

```text
Rutas API de Next.js
  -> validaciones y normalizacion con Zod
  -> autenticacion y autorizacion cuando correspondan
  -> servicio de categorias
  -> Prisma ORM
  -> PostgreSQL
```

Las rutas gestionaran HTTP, los metodos permitidos y el contrato uniforme. Las validaciones aceptaran exclusivamente los campos aprobados. El servicio aplicara normalizacion, reglas de negocio, unicidad y seleccion explicita de campos. Prisma administrara la persistencia.

## Organizacion Probable de Archivos

La ubicacion exacta respetara las convenciones existentes. Se preve crear o modificar archivos con estas responsabilidades:

```text
prisma/
  schema.prisma
  seed.ts
  migrations/

generated/
  prisma/

lib/
  auth/
    authenticate.ts
  validations/
    categorias.ts
  services/
    categoria-service.ts
  api/
    respuestas y errores compartidos

src/pages/api/categorias/
  index.ts
  [id]/
    index.ts
    estado.ts

tests/
  categorias/
```

Los nombres finales podran ajustarse sin cambiar responsabilidades, endpoints ni contratos.

## Estrategia de Normalizacion del Nombre

Antes de validar la longitud, comparar o persistir el nombre se aplicara:

- Eliminacion de espacios al inicio y al final.
- Reduccion de espacios internos repetidos a un solo espacio.
- Validacion de una longitud entre 3 y 80 caracteres.
- Obtencion de una representacion comparable sin distinguir mayusculas y minusculas.

El valor presentado al cliente conservara una forma legible. La misma normalizacion se utilizara en creacion, actualizacion y seed para evitar resultados inconsistentes.

## Unicidad sin Distinguir Mayusculas y Minusculas

La unicidad no dependera unicamente de una consulta previa del servicio. La implementacion debera garantizarla tambien en PostgreSQL para cubrir solicitudes concurrentes.

La estrategia tecnica concreta se definira al preparar el cambio de Prisma y la migracion. Debera permitir comparar la representacion normalizada sin distinguir mayusculas y minusculas, conservar el nombre publico aprobado y traducir los conflictos a `409`.

No se modificaran manualmente migraciones ya aplicadas ni se agregaran dependencias nuevas para resolver esta regla.

## Cambios Previstos en Prisma

Se agregara el modelo `Categoria` con:

- `id` como clave primaria autoincremental.
- `nombre` obligatorio y unico bajo comparacion normalizada.
- `descripcion` opcional.
- `activo` obligatorio con valor inicial `true`.
- `createdAt` con fecha inicial.
- `updatedAt` con actualizacion automatica.

No se agregara todavia ninguna relacion Prisma con `Donacion`. Esa relacion se incorporara coordinadamente durante la feature `006-donaciones`.

## Migracion y Cliente Prisma

Despues de aprobar el cambio de `schema.prisma` se creara una migracion nueva. Antes de aplicarla se revisaran:

- La tabla y las restricciones generadas.
- La nulabilidad de `descripcion`.
- El valor inicial de `activo`.
- Las fechas de creacion y actualizacion.
- La garantia de unicidad normalizada.

La migracion no incluira el modelo ni la relacion de Donaciones. Despues de aplicarla se regenerara el cliente en `generated/prisma` y se verificara que la aplicacion utilice la ubicacion oficial.

## Seed Idempotente

El seed utilizara la misma normalizacion y comparacion aprobadas para crear las diez categorias iniciales.

En cada ejecucion:

- Creara unicamente las categorias inexistentes.
- No eliminara categorias existentes.
- No modificara categorias existentes.
- No reactivara categorias existentes.

La existencia se comprobara mediante el criterio de unicidad normalizada, sin depender de identificadores numericos fijos.

## Consulta Publica de Categorias Activas

`GET /api/categorias` consultara exclusivamente categorias activas y seleccionara solamente `id`, `nombre` y `descripcion`. No devolvera `activo`, `createdAt` ni `updatedAt`.

`GET /api/categorias/{id}` validara que el identificador sea un entero positivo. Para una consulta publica, una categoria inexistente o inactiva producira el mismo `404` y el mismo mensaje, sin permitir distinguir ambas condiciones.

El catalogo inicial se devolvera sin paginacion. La paginacion solo se evaluara en versiones futuras.

## Operaciones Administrativas

Las rutas administrativas reutilizaran Autenticacion Core para exigir un usuario autenticado, activo y con rol `ADMIN`:

- `POST /api/categorias`.
- `PATCH /api/categorias/{id}`.
- `PATCH /api/categorias/{id}/estado`.

La ausencia de autenticacion valida producira `401`. Una identidad autenticada sin rol `ADMIN` producira `403`.

Los detalles administrativos de categorias activas e inactivas se obtendran mediante la consulta individual autenticada con rol `ADMIN`.

## Creacion

La creacion aceptara exclusivamente `nombre` y `descripcion`. Aplicara normalizacion, validacion y comprobacion de unicidad, creara la categoria activa y respondera `201` con la representacion administrativa seleccionada explicitamente.

Los conflictos detectados antes de escribir o por la restriccion de PostgreSQL se traduciran de forma uniforme a `409`.

## Actualizacion Parcial

`PATCH /api/categorias/{id}` exigira al menos uno de los campos `nombre` o `descripcion`.

Rechazara:

- Cuerpos vacios.
- Campos desconocidos.
- Modificaciones de `id`, `activo`, `createdAt` o `updatedAt`.
- Modificaciones de relaciones actuales o futuras.

La descripcion se normalizara con `trim`, tendra un maximo de 250 caracteres y una cadena vacia se convertira en `null`.

## Cambio de Estado Idempotente

`PATCH /api/categorias/{id}/estado` aceptara exclusivamente `activo` y requerira rol `ADMIN`.

Permitira activar, desactivar y reactivar. Solicitar el estado que la categoria ya posee sera una operacion exitosa, no un conflicto. La respuesta devolvera la categoria actualizada.

La desactivacion no eliminara la categoria ni alterara asociaciones historicas.

## Integracion Futura con Donaciones

La feature `006-donaciones` incorporara coordinadamente la relacion Prisma entre `Donacion` y `Categoria`.

Donaciones debera comprobar en el backend que una categoria se encuentre activa antes de utilizarla en una nueva publicacion. Las donaciones existentes conservaran su categoria cuando esta sea desactivada.

Esta feature no anticipara el modelo, la clave foranea ni las reglas relacionales de `Donacion`.

## Manejo de Errores

Todas las rutas utilizaran el contrato de `004-manejo-errores`:

- `success`, `message` y `data` en respuestas exitosas.
- `success`, `status`, `message` y `data: null` en errores.
- `errors` unicamente para validaciones por campo.
- `405` con la cabecera `Allow` para metodos no permitidos.
- `409` para nombres duplicados bajo comparacion normalizada.
- `500` generico para errores tecnicos sin traduccion segura.

Los resultados Prisma se seleccionaran explicitamente y nunca se devolveran objetos completos de forma directa.

## Pruebas con Postman o Herramienta Equivalente

Se verificara como minimo:

- Listado publico con solo categorias activas y campos publicos.
- Consulta individual de una categoria activa.
- Mismo `404` y mensaje para categoria inexistente o inactiva en consulta publica.
- Consulta administrativa de categorias activas e inactivas.
- Creacion valida por `ADMIN` con respuesta `201`.
- Normalizacion del nombre y la descripcion.
- Longitudes minima y maxima.
- Descripcion vacia convertida a `null`.
- Duplicados con diferencias de mayusculas, minusculas o espacios.
- Conflictos de unicidad concurrentes.
- Actualizacion parcial valida.
- Rechazo de cuerpos vacios, campos desconocidos, campos protegidos y relaciones.
- Desactivacion y reactivacion.
- Idempotencia del cambio de estado.
- Rechazo sin autenticacion con `401`.
- Rechazo sin rol `ADMIN` con `403`.
- Identificadores invalidos con `400`.
- Categorias inexistentes con `404`.
- Metodos no permitidos con `405` y cabecera `Allow`.
- Contrato uniforme de respuestas y ausencia de datos internos.
- Ejecuciones repetidas del seed sin eliminaciones, modificaciones, reactivaciones ni duplicados.

## Riesgos y Verificaciones

- Una unicidad aplicada solo en el servicio permitiria duplicados concurrentes.
- Una normalizacion diferente entre seed, creacion y actualizacion produciria categorias equivalentes.
- Devolver objetos Prisma completos podria exponer campos administrativos en el catalogo publico.
- Consultar por separado existencia y estado podria revelar si una categoria inactiva existe.
- Omitir la autorizacion en una ruta permitiria modificar el catalogo a usuarios normales.
- Permitir `activo` en el `PATCH` general eludiria el contrato del endpoint de estado.
- Un seed que actualice o reactive registros revertiria decisiones administrativas.
- Agregar anticipadamente la relacion con Donaciones inventaria decisiones de la feature 006.
- Una categoria inactiva no debe aparecer en el catalogo ni ser aceptada en nuevas donaciones.

Antes de cerrar la feature se ejecutaran migracion, seed, pruebas, lint y build. Tambien se verificara que los cinco endpoints, el contrato de errores y la documentacion coincidan con la implementacion real.
