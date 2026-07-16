# Entorno - Tareas

## Fase 1 - Tecnologias Base

- [x] Configurar Next.js.
- [x] Configurar React.
- [x] Configurar TypeScript.
- [x] Verificar Node.js.
- [x] Verificar Yarn.
- [x] Configurar ESLint.
- [x] Configurar Tailwind CSS y PostCSS.
- [x] Configurar Git y GitHub.
- [ ] Ejecutar `yarn install` como comprobacion reproducible final.

## Fase 2 - PostgreSQL y Variables de Entorno

- [x] Configurar PostgreSQL.
- [x] Configurar la conexion mediante `DATABASE_URL`.
- [x] Mantener `.env` excluido del repositorio.
- [x] Verificar una consulta tecnica a PostgreSQL mediante Prisma.
- [ ] Crear `.env.example` sin secretos ni credenciales reales.
- [ ] Permitir que `.env.example` sea versionado.

## Fase 3 - Prisma y Migraciones

- [x] Configurar Prisma ORM.
- [x] Instalar `@prisma/client`.
- [x] Instalar `@prisma/adapter-pg`.
- [x] Configurar la ubicacion de las migraciones.
- [x] Validar el esquema mediante `yarn prisma validate`.
- [x] Aplicar al menos una migracion correctamente.
- [x] Confirmar que las migraciones aplicadas estan actualizadas.
- [x] Generar el cliente Prisma en `generated/prisma`.
- [x] Configurar `generated/prisma` como ubicacion oficial.
- [x] Confirmar que ningun archivo de aplicacion importe `src/generated/prisma`.
- [ ] Revisar y eliminar `src/generated/prisma` despues de confirmar que el cliente oficial funciona.

## Fase 4 - Ejecucion y Calidad

- [x] Verificar que `yarn dev` inicie Next.js sin errores.
- [x] Verificar que `yarn lint` finalice sin errores.

## Fase 5 - Cierre Documental

- [x] Documentar el alcance y las exclusiones de la feature.
- [x] Documentar las tecnologias y versiones verificadas.
- [x] Documentar las reglas tecnicas aprobadas.
- [x] Separar la documentacion en `spec.md`, `plan.md` y `tasks.md`.
- [ ] Verificar nuevamente que la documentacion coincida con el proyecto despues de cerrar las tareas pendientes.
- [ ] Cambiar el estado a completado solo cuando se cumplan todos los criterios.

## Criterios de Finalizacion

- [ ] `yarn install` finaliza correctamente.
- [x] `yarn prisma validate` valida el esquema.
- [x] `yarn prisma generate` genera el cliente en `generated/prisma`.
- [x] `yarn prisma migrate dev` puede aplicar las migraciones.
- [x] `yarn dev` inicia Next.js sin errores.
- [x] Una consulta mediante Prisma responde correctamente desde PostgreSQL.
- [x] `yarn lint` finaliza sin errores.
- [ ] Existe `.env.example` sin secretos.
- [x] Ningun archivo de aplicacion utiliza `src/generated/prisma`.
- [ ] La documentacion coincide con el proyecto real despues de completar las tareas pendientes.
