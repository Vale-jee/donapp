# Manejo de Errores - Plan de Implementacion

## Arquitectura General

El manejo de respuestas y errores se implementara como una capacidad transversal de la API REST sobre la infraestructura de Next.js y TypeScript definida en `001-entorno`.

El flujo general sera:

```text
Ruta API de Next.js
  -> validacion y autenticacion cuando correspondan
  -> servicio de la feature propietaria
  -> traduccion de errores conocidos
  -> mecanismo centralizado de respuestas
  -> respuesta HTTP uniforme
```

Las features propietarias conservaran la deteccion de sus validaciones, permisos y reglas de negocio. Esta feature centralizara unicamente su representacion publica, la captura segura de excepciones y el contrato HTTP.

## Organizacion de Utilidades Compartidas

Se agruparan responsabilidades reutilizables para:

- Construir respuestas exitosas.
- Construir respuestas de error.
- Representar errores controlados de la aplicacion.
- Normalizar errores de validacion por campo.
- Traducir errores tecnicos conocidos.
- Capturar excepciones no controladas.
- Registrar errores de acuerdo con la politica aprobada.

La organizacion evitara mezclar reglas de negocio particulares con las utilidades transversales.

## Centralizacion de Respuestas

Las utilidades compartidas garantizaran que todas las respuestas exitosas incluyan `success`, `message` y `data`, y que todas las respuestas de error incluyan `success`, `status`, `message` y `data: null`.

El campo `status` solo se construira para errores y debera coincidir con el codigo HTTP real. El campo opcional `errors` se incorporara exclusivamente cuando existan errores de validacion por campo; en los demas errores sera `null` o se omitira.

Las rutas dejaran de construir variantes incompatibles del contrato y delegaran la serializacion final en el mecanismo comun.

## Manejo de Excepciones

Se establecera una frontera comun para capturar las excepciones producidas durante una solicitud. Los errores controlados conservaran su codigo y mensaje publico aprobados. Las excepciones no controladas produciran siempre `500`, `data: null` y un mensaje publico generico.

Ninguna respuesta incluira causas tecnicas, consultas SQL, nombres de tablas, stack traces ni informacion de implementacion.

## Traduccion de Errores Tecnicos

- **Prisma:** se reconoceran los errores que puedan traducirse con seguridad, incluidos los conflictos funcionales conocidos que correspondan a `409`. Los errores no reconocidos se trataran como `500`.
- **Zod:** sus detalles internos se normalizaran antes de construir el objeto opcional `errors`; la estructura original no se devolvera al cliente.
- **jose:** los errores internos de tokens se convertiran en respuestas publicas de autenticacion definidas por la feature propietaria.
- **PostgreSQL:** sus mensajes, consultas y detalles de infraestructura no se expondran; los fallos sin traduccion segura produciran `500`.
- **Next.js:** las excepciones de las rutas se adaptaran al contrato uniforme y no se devolveran directamente.

La traduccion tecnica no cambiara las reglas funcionales ni los codigos aprobados por las features propietarias.

## Integracion con Autenticacion

El mecanismo definido en `002-autenticacion-core` determinara los errores de credenciales, tokens y permisos. Esta feature recibira esas condiciones y las representara mediante el contrato uniforme, sin implementar autenticacion ni autorizacion.

Los errores internos de autenticacion no se expondran y los logs no incluiran contraseñas, tokens, refresh tokens, hashes, secretos, claves criptograficas, variables de entorno sensibles ni cuerpos completos de autenticacion.

## Integracion con Validaciones

Cada feature mantendra sus propios esquemas Zod. El mecanismo transversal convertira los errores por campo a la forma publica aprobada y utilizara `400` para los datos invalidos definidos por los contratos vigentes.

El campo `errors` sera opcional y no se utilizara fuera de errores de validacion por campo.

## Estrategia para Logging

El registro se limitara a los datos aprobados:

- Fecha.
- Endpoint.
- Metodo HTTP.
- Identificador del usuario, cuando exista y sea seguro registrarlo.
- Codigo HTTP.
- Mensaje interno.

Antes de registrar un error se evitara incluir datos sensibles. El mensaje interno servira solo para diagnostico del servidor y permanecera separado del mensaje publico.

## Archivos Probables

La ubicacion final respetara las convenciones existentes. Se preve crear o modificar archivos con estas responsabilidades:

```text
lib/
  api/
    responses.ts
  errors/
    application-error.ts
    error-handler.ts
    error-logger.ts
    translators/
      prisma.ts
      zod.ts
      auth.ts

src/pages/api/
  ... rutas existentes y futuras

tests/
  errors/
```

Los nombres finales podran ajustarse sin cambiar las responsabilidades ni los contratos aprobados. Esta feature no requiere modificar `prisma/schema.prisma` ni instalar dependencias adicionales.

## Pruebas

Se verificara como minimo:

- Formato exacto de respuestas exitosas.
- Formato exacto de respuestas de error.
- Ausencia de `status` en respuestas exitosas.
- Coincidencia entre `status` y el codigo HTTP real.
- Uso de `data: null` en errores.
- Uso opcional y exclusivo de `errors` para validaciones por campo.
- Respuestas para los codigos oficiales.
- Cabecera `Allow` en respuestas `405`.
- Traduccion segura de errores de Prisma, Zod, jose, PostgreSQL y Next.js.
- Respuesta generica y segura para excepciones no controladas.
- Ausencia de datos sensibles y stack traces.
- Seleccion explicita de campos antes de responder con datos obtenidos mediante Prisma.
- Cumplimiento del contrato en todas las rutas.

## Riesgos y Verificaciones

- Construir respuestas manualmente en cada ruta podria producir formatos inconsistentes.
- Devolver errores tecnicos directamente podria exponer detalles internos o datos sensibles.
- Registrar cuerpos completos podria filtrar credenciales, tokens o secretos.
- Traducir todos los errores Prisma de la misma forma podria ocultar fallos internos o producir codigos incorrectos.
- Devolver objetos Prisma completos podria exponer campos privados o secretos.
- Un `status` distinto del codigo HTTP real romperia el contrato con el cliente.
- Permitir `errors` fuera de validaciones por campo volveria ambiguo el contrato.
- Una excepcion no capturada podria generar una respuesta propia de Next.js incompatible con DonApp.

Antes de cerrar la feature se comprobara que todas las rutas utilicen los mecanismos centralizados, que las pruebas pasen y que lint y build finalicen correctamente.
