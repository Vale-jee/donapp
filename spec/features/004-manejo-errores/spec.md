# Manejo de Errores - Especificacion

## Objetivo

Definir el contrato transversal de respuestas y errores de toda la API REST de DonApp, garantizando respuestas consistentes, seguras y faciles de interpretar tanto para la aplicacion movil como para los desarrolladores.

Esta feature normaliza la representacion de las respuestas y los errores. No implementa reglas de negocio ni validaciones especificas pertenecientes a otras features.

## Descripcion

Este modulo establece las convenciones generales para las respuestas generadas por el backend y para el manejo de errores de la API. Todas las respuestas utilizaran una estructura uniforme y los errores emplearan los codigos de estado HTTP correspondientes.

## Alcance

Esta feature define:

- El formato uniforme de respuestas.
- El formato uniforme de errores.
- Los codigos HTTP oficiales.
- La clasificacion de errores.
- La traduccion de errores tecnicos a respuestas publicas.
- La politica de privacidad de errores.
- El manejo de excepciones.
- La politica de logging.
- Las reglas para las respuestas generadas por la API.

## Fuera de Alcance

Esta feature no define:

- Reglas de negocio.
- Validaciones especificas de cada entidad.
- Autenticacion.
- Autorizacion.
- Modelos Prisma.
- El frontend Flutter.
- Monitoreo externo.
- Internacionalizacion de mensajes.
- Recuperacion automatica de fallos.

## Tecnologias

- Next.js 16.2.10.
- TypeScript 5.9.3.
- Zod para validaciones definidas por las features correspondientes.
- Prisma ORM 7.8.0 como fuente de errores de persistencia.

## Requisitos Funcionales

**RF-001** Normalizar la representacion de los errores de validacion de datos.

**RF-002** Normalizar la representacion de los errores de autenticacion.

**RF-003** Normalizar la representacion de los errores de autorizacion.

**RF-004** Normalizar la representacion de los errores producidos por reglas de negocio.

**RF-005** Normalizar la representacion de los errores de persistencia producidos por Prisma.

**RF-006** Gestionar las excepciones y los errores internos del servidor.

**RF-007** Mantener un formato uniforme para todas las respuestas generadas por la API.

## Reglas Tecnicas

**RT-001** Todas las respuestas de error deberan utilizar codigos HTTP estandar aprobados para DonApp.

**RT-002** No se expondra informacion sensible, mensajes internos, detalles de infraestructura ni stack traces en las respuestas.

**RT-003** Los errores se registraran de acuerdo con la politica de logging definida en esta feature.

**RT-004** Todas las respuestas generadas por la API deberan seguir el contrato uniforme.

**RT-005** El campo `status` se incluira unicamente en las respuestas de error y debera coincidir con el codigo de estado HTTP real.

**RT-006** Todas las respuestas de error incluiran `data: null`.

**RT-007** Ningun endpoint podra devolver directamente objetos generados por Prisma. Siempre deberan seleccionarse explicitamente los campos publicos antes de construir la respuesta.

**RT-008** Toda excepcion no controlada se traducira a una respuesta uniforme con codigo `500`, sin exponer su causa tecnica al cliente.

## Contrato Uniforme de Respuestas

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación realizada correctamente.",
  "data": {}
}
```

Todas las respuestas exitosas incluiran `success`, `message` y `data`. Cuando la operacion no devuelva un recurso especifico, `data` sera un objeto vacio.

### Respuesta de Error

```json
{
  "success": false,
  "status": 400,
  "message": "Descripción del error.",
  "data": null
}
```

Todas las respuestas de error incluiran `success`, `status`, `message` y `data`. El campo `status` se utilizara unicamente en errores y `data` sera siempre `null`.

## Clasificacion de Errores

Los errores se clasificaran por su origen:

- **Validacion:** errores detectados por los esquemas Zod definidos en cada feature.
- **Autenticacion:** credenciales o tokens ausentes, invalidos, expirados o revocados.
- **Autorizacion:** operaciones denegadas a una identidad autenticada sin permisos suficientes.
- **Reglas de negocio:** conflictos o estados no permitidos definidos por la feature propietaria.
- **Prisma:** errores de persistencia, restricciones, consultas o conexion producidos por Prisma ORM.
- **Errores internos:** excepciones no controladas o fallos inesperados del servidor.

Esta feature unicamente normaliza la representacion y traduccion publica de estas categorias. La deteccion de cada condicion y sus reglas especificas pertenecen a las features correspondientes.

## Errores de Validacion

Las validaciones especificas seran definidas por la feature propietaria de cada contrato. `errors` es un campo opcional y solo podra utilizarse cuando existan errores de validacion asociados a campos concretos:

```json
{
  "success": false,
  "status": 400,
  "message": "Los datos enviados no son validos.",
  "data": null,
  "errors": {
    "email": [
      "Debe ser un correo valido."
    ]
  }
}
```

En cualquier otro tipo de error, `errors` debera ser `null` u omitirse. Nunca podra exponer directamente la estructura interna generada por Zod; los detalles se normalizaran antes de enviarse.

## Traduccion de Errores Tecnicos

Los errores tecnicos deberan traducirse a codigos y mensajes publicos aprobados antes de construir la respuesta. Los errores internos de Prisma, Zod, jose, PostgreSQL y Next.js nunca deberan devolverse directamente al cliente.

Los errores de Prisma que representen conflictos funcionales conocidos podran traducirse al codigo correspondiente, como `409`. Los fallos no reconocidos o sin una traduccion segura se trataran como errores internos con codigo `500`.

Las excepciones no controladas deberan responder siempre con un mensaje publico generico, sin revelar detalles internos, causas tecnicas, consultas SQL, nombres de tablas, stack traces ni informacion de implementacion.

## Politica de Privacidad

Las respuestas de error no deberan exponer:

- Stack traces.
- Consultas SQL.
- Nombres internos de tablas o restricciones.
- Rutas internas del servidor.
- Contraseñas, tokens, hashes o secretos.
- Variables de entorno.
- Detalles que permitan enumerar usuarios, cuentas o sesiones cuando la feature correspondiente exija ocultarlos.

Los mensajes publicos deberan ser suficientes para que el cliente interprete el resultado sin revelar la causa tecnica interna.

## Politica de Logging

Nunca deberan registrarse:

- Contraseñas.
- Tokens.
- Refresh tokens.
- Hashes.
- Secretos.
- Claves criptograficas.
- Variables de entorno sensibles.
- Cuerpos completos de solicitudes de autenticacion.

Podran registrarse unicamente:

- Fecha.
- Endpoint.
- Metodo HTTP.
- Identificador del usuario, cuando exista y sea seguro registrarlo.
- Codigo HTTP.
- Mensaje interno.

El mensaje interno se utilizara exclusivamente para diagnostico del servidor y no se devolvera automaticamente al cliente.

## Codigos HTTP Oficiales

| Codigo | Descripcion |
|---|---|
| 200 | Solicitud procesada correctamente. |
| 201 | Recurso creado correctamente. |
| 400 | Solicitud o datos invalidos. |
| 401 | Autenticacion, credenciales o tokens invalidos. |
| 403 | Acceso denegado a una operacion. |
| 404 | Recurso no encontrado. |
| 405 | Metodo HTTP no permitido. |
| 409 | Conflicto con el estado o los datos existentes. |
| 500 | Error interno del servidor. |

Cuando se utilice `405 Method Not Allowed`, la respuesta debera indicar mediante la cabecera HTTP `Allow` los metodos aceptados por el endpoint.

## Dependencias

Esta feature depende de la infraestructura definida en `001-entorno` y establece un contrato transversal que sera utilizado por todas las features con endpoints REST.

Reutilizara las librerias ya aprobadas por las features correspondientes, especialmente Zod, Prisma ORM y las herramientas de autenticacion definidas en `002-autenticacion-core`. No requiere dependencias adicionales.

## Estado

Implementada, con evidencia permanente representativa del contrato uniforme, request ID, JSON malformado y sanitizacion.

## Observaciones

Las convenciones definidas en este modulo deberan aplicarse en todos los endpoints del proyecto para mantener un comportamiento uniforme de la API.

Las features propietarias conservaran la responsabilidad de definir sus validaciones, reglas de negocio, permisos y mensajes funcionales sin modificar el contrato transversal establecido aqui.
