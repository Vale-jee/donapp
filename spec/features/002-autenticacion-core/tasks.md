# Autenticacion Core - Tareas

## Fase 1 - Documentacion y Decisiones

- [x] Definir autenticacion mediante correo electronico y contrasena.
- [x] Aprobar access tokens de 15 minutos y refresh tokens de 7 dias.
- [x] Aprobar rotacion de refresh tokens y hash SHA-256.
- [x] Aprobar varias sesiones por usuario y logout de la sesion actual.
- [x] Aprobar los modelos definitivos `Rol`, `Usuario` y `Sesion` para esta feature.
- [x] Aprobar los contratos de los cuatro endpoints.
- [x] Aprobar las reglas de privacidad y el formato uniforme de respuestas.
- [x] Separar la documentacion en `spec.md`, `plan.md` y `tasks.md`.
- [x] Sincronizar documentalmente la claim `sid` y la validacion de Sesion para access tokens.

## Fase 2 - Dependencias y Entorno

- [ ] Solicitar aprobacion inmediatamente antes de instalar las dependencias.
- [ ] Instalar `bcryptjs`, `jose` y `zod`.
- [ ] Crear `.env.example` con las variables aprobadas.
- [ ] Permitir el seguimiento de `.env.example` sin exponer `.env`.
- [ ] Validar las variables de entorno con zod.
- [ ] Verificar que los secretos de access y refresh sean diferentes.

## Fase 3 - Esquema Prisma

- [x] Disponer de modelos iniciales `Rol` y `Usuario`.
- [ ] Actualizar `Rol` con `codigo` y `updatedAt`.
- [ ] Actualizar `Usuario` con los campos definitivos de esta feature.
- [ ] Agregar las restricciones unicas de `email` y `nombreVisible`.
- [ ] Crear el modelo `Sesion` con UUID.
- [ ] Agregar relaciones e indices de sesiones.
- [ ] Confirmar que no se agreguen `calificacionPromedio` ni `totalDonaciones`.
- [ ] Validar el esquema Prisma.

## Fase 4 - Migracion y Cliente Prisma

- [ ] Definir el tratamiento de registros existentes para los nuevos campos obligatorios.
- [ ] Crear una migracion nueva.
- [ ] Revisar el SQL generado y la integridad referencial.
- [ ] Aplicar la migracion en el entorno de desarrollo.
- [x] Configurar `generated/prisma` como ubicacion oficial del cliente.
- [ ] Regenerar el cliente Prisma en `generated/prisma`.
- [ ] Verificar que ningun archivo utilice `src/generated/prisma`.
- [ ] Eliminar `src/generated/prisma` despues de verificar sus referencias.

## Fase 5 - Seed de Roles

- [ ] Crear el seed idempotente.
- [ ] Crear o actualizar el rol `ADMIN` por codigo.
- [ ] Crear o actualizar el rol `USUARIO` por codigo.
- [ ] Configurar el comando de ejecucion del seed.
- [ ] Ejecutar el seed varias veces y comprobar que no duplique registros.

## Fase 6 - Validaciones

- [ ] Crear la validacion de registro.
- [ ] Crear la validacion de login.
- [ ] Crear la validacion de refresh.
- [ ] Crear la validacion de logout.
- [ ] Normalizar el correo antes de almacenarlo o buscarlo.
- [ ] Validar la politica de contrasena.
- [ ] Validar los campos opcionales `telefono` y `fotoPerfil`.

## Fase 7 - Contrasenas y Tokens

- [ ] Crear el hash de contrasenas con bcryptjs.
- [ ] Crear la verificacion de contrasenas con bcryptjs.
- [ ] Crear access tokens con jose.
- [ ] Incluir `sid` en la emision de access tokens.
- [ ] Validar access tokens y sus claims.
- [ ] Validar `sub`, `sid`, Sesion vigente y cuenta activa.
- [ ] Crear refresh tokens con jose.
- [ ] Validar refresh tokens y sus claims.
- [ ] Crear el hash SHA-256 de refresh tokens con `node:crypto`.
- [ ] Evitar que tokens, contrasenas y hashes se escriban en logs.

## Fase 8 - Servicios y Sesiones

- [ ] Crear el servicio de registro.
- [ ] Crear el servicio de inicio de sesion.
- [ ] Crear sesiones independientes por dispositivo.
- [ ] Crear el servicio de renovacion.
- [ ] Implementar rotacion atomica del refresh token.
- [ ] Impedir la reutilizacion concurrente del token anterior.
- [ ] Crear el servicio de cierre de sesion actual.
- [ ] Rechazar sesiones expiradas o revocadas.
- [ ] Rechazar login y refresh para cuentas inactivas.

## Fase 9 - Endpoints

- [ ] Implementar `POST /api/auth/register`.
- [ ] Implementar `POST /api/auth/login`.
- [ ] Implementar `POST /api/auth/refresh`.
- [ ] Implementar `POST /api/auth/logout`.
- [ ] Rechazar metodos HTTP no permitidos.
- [ ] Aplicar el formato uniforme con `data` en todas las respuestas.
- [ ] Seleccionar explicitamente los datos publicos del login.
- [ ] Confirmar que ningun endpoint exponga hashes o datos privados.

## Fase 10 - Proteccion de Rutas

- [ ] Crear un mecanismo reutilizable para extraer el Bearer token.
- [ ] Validar access tokens en endpoints protegidos.
- [ ] Consultar eficientemente Sesion, Usuario y Rol desde `sid`.
- [ ] Exponer al endpoint protegido la identidad y el rol actual autenticados.
- [ ] Invalidar inmediatamente access tokens cuando su Sesion sea revocada.
- [ ] Diferenciar access tokens y refresh tokens por su claim `type`.

## Fase 11 - Pruebas y Verificacion

- [ ] Configurar la estrategia de pruebas aprobada para el proyecto.
- [ ] Probar registro, normalizacion y conflictos de unicidad.
- [ ] Probar politica y hash de contrasenas.
- [ ] Probar login valido, credenciales invalidas y cuenta inactiva.
- [ ] Probar privacidad de las respuestas.
- [ ] Probar varias sesiones simultaneas.
- [ ] Probar expiracion y tipo de tokens.
- [ ] Probar rotacion y rechazo del refresh token anterior.
- [ ] Probar concurrencia durante la rotacion.
- [ ] Probar logout sin afectar otras sesiones.
- [ ] Probar access tokens con `sid` ausente, invalido, revocado o expirado.
- [ ] Probar que el rol actual de base de datos prevalezca sobre el token.
- [ ] Probar que reactivar una cuenta no restaure sesiones ni access tokens.
- [ ] Probar el formato de respuestas exitosas y de error.
- [ ] Ejecutar lint.
- [ ] Ejecutar las pruebas.
- [ ] Ejecutar el build.

## Fase 12 - Cierre Documental

- [ ] Registrar los resultados de las pruebas.
- [ ] Verificar que la implementacion coincida con `spec.md`.
- [ ] Actualizar el estado de la feature solo cuando todos los requisitos esten implementados.

## Criterios de Finalizacion

La feature unicamente podra marcarse como completada cuando:

- [ ] Todos los requisitos funcionales del spec esten implementados.
- [ ] Todas las reglas de negocio esten cumplidas.
- [ ] Todas las pruebas hayan sido ejecutadas correctamente.
- [ ] El proyecto compile sin errores.
- [ ] La documentacion de la feature este actualizada.
