# Entorno - Plan de Implementacion

## Estrategia Tecnica

La infraestructura se verificara desde la instalacion de dependencias hasta la ejecucion del backend y su conexion con PostgreSQL. Cada comprobacion utilizara las herramientas definidas en la especificacion y debera corresponder con el estado real del proyecto.

La verificacion de base de datos se realizara mediante Prisma y `DATABASE_URL`, sin depender de endpoints de otras features.

## Arquitectura

La infraestructura del backend sigue este flujo:

```text
Next.js y React
  -> TypeScript
  -> Prisma ORM y @prisma/adapter-pg
  -> PostgreSQL
```

Yarn administra las dependencias y comandos del proyecto. ESLint verifica la calidad estatica, Git y GitHub mantienen el control de versiones, y Tailwind CSS con PostCSS forman parte de la configuracion existente.

## Organizacion de Archivos

Los elementos de infraestructura se organizan de la siguiente forma:

```text
package.json
tsconfig.json
next.config.ts
eslint.config.mjs
postcss.config.mjs
.env
.env.example
.gitignore
prisma.config.ts
prisma/
  schema.prisma
  migrations/
database/
  client.ts
generated/
  prisma/
```

`generated/prisma` es la ubicacion oficial del cliente. `src/generated/prisma` se mantiene temporalmente como ubicacion antigua hasta finalizar su revision.

## Orden de Implementacion

1. Verificar las tecnologias y configuraciones incluidas en el alcance.
2. Instalar las dependencias con Yarn.
3. Configurar las variables de entorno.
4. Validar el esquema Prisma.
5. Generar el cliente Prisma en la ubicacion oficial.
6. Aplicar las migraciones mediante Prisma.
7. Verificar la conexion con PostgreSQL mediante Prisma.
8. Iniciar Next.js.
9. Ejecutar ESLint.
10. Revisar las referencias a la ubicacion antigua del cliente Prisma.
11. Eliminar la ubicacion antigua solo cuando no tenga consumidores.
12. Confirmar que la documentacion coincida con el proyecto real.

## Configuracion del Entorno

- Utilizar Node.js, Yarn, PostgreSQL y las versiones mayores documentadas.
- Instalar las dependencias declaradas mediante `yarn install`.
- Mantener la configuracion existente de Next.js, React, TypeScript, ESLint, Tailwind CSS y PostCSS.
- Mantener Git y GitHub como herramientas de control de versiones.

## Variables de Entorno

- Mantener `.env` fuera del control de versiones.
- Utilizar `DATABASE_URL` como contrato oficial de conexion con PostgreSQL.
- Crear `.env.example` sin secretos ni credenciales reales.
- Versionar `.env.example` sin permitir que la regla de exclusion de `.env` lo bloquee.

## Migraciones

- Administrar los cambios estructurales mediante Prisma.
- Aplicar las migraciones con `yarn prisma migrate dev`.
- No modificar manualmente migraciones que ya hayan sido aplicadas.
- Verificar que Prisma pueda reconocer y aplicar las migraciones disponibles.

## Cliente Prisma

- Validar el esquema con `yarn prisma validate`.
- Generar el cliente mediante `yarn prisma generate`.
- Confirmar que la salida se encuentre en `generated/prisma`.
- Buscar consumidores de `src/generated/prisma`.
- Eliminar la ubicacion antigua solo despues de confirmar que ningun archivo la utiliza y que el cliente oficial funciona.

## Verificaciones

- Comprobar que `yarn install` finalice correctamente.
- Validar el esquema Prisma.
- Generar el cliente oficial.
- Comprobar la aplicacion de migraciones.
- Ejecutar una consulta tecnica mediante Prisma y `DATABASE_URL`.
- Comprobar que `yarn dev` inicie Next.js sin errores.
- Comprobar que `yarn lint` finalice sin errores.
- Confirmar que `.env.example` exista y no contenga secretos.
- Confirmar que la documentacion represente el proyecto real.

## Riesgos

- Versionar `.env` o credenciales reales expondria informacion sensible.
- Una regla de exclusion demasiado amplia podria impedir versionar `.env.example`.
- Modificar una migracion aplicada podria desincronizar el historial de la base de datos.
- Mantener dos ubicaciones del cliente Prisma podria provocar imports inconsistentes.
- Verificar PostgreSQL mediante endpoints funcionales mezclaria responsabilidades entre features.
- Marcar la feature como completada sin ejecutar todos los criterios reduciria la reproducibilidad del entorno.
