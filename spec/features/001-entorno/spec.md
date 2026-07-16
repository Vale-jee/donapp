# Entorno - Especificacion

## Objetivo

Preparar y verificar exclusivamente la infraestructura del backend de DonApp, proporcionando una base tecnica reproducible para implementar las funcionalidades del sistema.

Esta feature no incluye funcionalidades de negocio ni el frontend movil.

## Descripcion

Este modulo define las tecnologias, herramientas y configuraciones necesarias para ejecutar el backend, conectarlo con PostgreSQL mediante Prisma ORM y verificar que el proyecto pueda instalarse, validarse e iniciarse correctamente.

## Alcance

Esta feature comprende:

- Next.js.
- React.
- TypeScript.
- Node.js.
- Yarn.
- PostgreSQL.
- Prisma ORM.
- `@prisma/client`.
- `@prisma/adapter-pg`.
- Variables de entorno.
- Migraciones.
- Cliente Prisma.
- ESLint.
- Git.
- GitHub.
- Tailwind CSS.
- PostCSS.

## Fuera de Alcance

Esta feature no incluye:

- Flutter.
- Dart.
- Modelos funcionales como `Rol`, `Usuario` o `Sesion`.
- DBeaver.
- Prisma Studio.
- Funcionalidades de la interfaz web inicial de Next.js.

## Tecnologias

| Tecnologia | Version verificada |
|---|---|
| Next.js | 16.x |
| React | 19.x |
| TypeScript | 5.x |
| Node.js | 24.x |
| Yarn | 1.x |
| PostgreSQL | 16.x |
| Prisma ORM | 7.x |
| `@prisma/client` | 7.x |
| `@prisma/adapter-pg` | 7.x |
| ESLint | 9.x |
| Tailwind CSS | 4.x |
| PostCSS | 8.x |
| Git | 2.x |
| GitHub | Servicio remoto |

## Requisitos Funcionales

**RF-001** Disponer de un proyecto Next.js con React y TypeScript que pueda iniciarse mediante Yarn sin errores de configuracion.

**RF-002** Configurar PostgreSQL como gestor de base de datos y establecer la conexion mediante la variable de entorno `DATABASE_URL`.

**RF-003** Configurar Prisma ORM para validar el esquema, administrar migraciones y generar el cliente Prisma en la ubicacion oficial.

**RF-004** Configurar las variables de entorno necesarias mediante un archivo `.env` local excluido del repositorio y proporcionar un archivo `.env.example` versionado sin secretos reales.

**RF-005** Verificar la conectividad con PostgreSQL mediante Prisma y una consulta tecnica que no dependa de endpoints pertenecientes a otras features.

## Reglas Tecnicas

- `generated/prisma` es la unica ubicacion oficial del cliente Prisma.
- `src/generated/prisma` es una ubicacion antigua pendiente de revision y posterior eliminacion.
- Las migraciones aplicadas no deben modificarse manualmente.
- `.env` nunca debe versionarse.
- `.env.example` debe versionarse sin secretos ni credenciales reales.
- La conexion con PostgreSQL debe realizarse mediante `DATABASE_URL`.

## Verificacion de PostgreSQL

La conectividad con PostgreSQL debe comprobarse mediante Prisma, utilizando la configuracion definida por `DATABASE_URL` y una operacion tecnica de verificacion.

No se utilizaran endpoints de otras features, como consultas de usuarios, como mecanismo permanente de comprobacion del entorno.

## Estado

En verificacion.

## Criterios de Finalizacion

La feature unicamente podra marcarse como completada cuando:

- [ ] `yarn install` finalice correctamente.
- [ ] `yarn prisma validate` valide el esquema.
- [ ] `yarn prisma generate` genere el cliente en `generated/prisma`.
- [ ] `yarn prisma migrate dev` pueda aplicar las migraciones.
- [ ] `yarn dev` inicie Next.js sin errores.
- [ ] Una consulta mediante Prisma responda correctamente desde PostgreSQL.
- [ ] `yarn lint` finalice sin errores.
- [ ] Exista `.env.example` sin secretos.
- [ ] Ningun archivo utilice `src/generated/prisma`.
- [ ] La documentacion coincida con el proyecto real.

## Observaciones

Esta feature constituye la base tecnica del backend y debe verificarse antes de continuar con las funcionalidades que dependan de Next.js, Prisma y PostgreSQL.

La existencia de configuraciones o artefactos previos no reemplaza la ejecucion de los criterios de finalizacion. La carpeta antigua `src/generated/prisma` solo podra eliminarse despues de confirmar que ningun archivo la utiliza y que el cliente oficial funciona desde `generated/prisma`.
