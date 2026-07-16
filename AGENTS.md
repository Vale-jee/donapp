# AGENTS.md

## Proyecto

Nombre: DonApp

DonApp es una aplicación móvil destinada a facilitar la publicación y solicitud de donaciones entre usuarios.

La documentación funcional del proyecto se encuentra en el directorio `spec/`.

Toda implementación deberá respetar dicha documentación.


## Tecnologías

- Next.js 16.2.10
- TypeScript 5.9.3
- PostgreSQL 16
- Prisma ORM 7.8.0
- Yarn
- API REST

El frontend móvil será desarrollado posteriormente con Flutter y Dart.


## Arquitectura

Cliente Flutter

↓

API REST (Next.js)

↓

Prisma ORM

↓

PostgreSQL


## Reglas generales

Antes de escribir código:

1. Analizar la documentación correspondiente.
2. Explicar qué archivos serán modificados.
3. Esperar aprobación.

Nunca:

- modificar archivos sin autorización;
- cambiar reglas de negocio;
- eliminar código existente sin justificarlo;
- modificar el schema.prisma sin explicar el motivo.


## Documentación

Cada módulo posee un README dentro de:

spec/features/

La implementación deberá respetar dichos documentos.


## Estilo de desarrollo

Implementar una feature a la vez.

Orden:

1. Schema Prisma
2. Migraciones
3. Cliente Prisma
4. Validaciones
5. Endpoints
6. Pruebas
7. Documentación


## Prioridad

Siempre priorizar:

1. Seguridad.
2. Simplicidad.
3. Código limpio.
4. Escalabilidad.


## Restricciones

No utilizar librerías adicionales sin aprobación.

No generar código que contradiga el SPEC.

Si existe alguna contradicción entre el código y la documentación, informar primero y esperar instrucciones.