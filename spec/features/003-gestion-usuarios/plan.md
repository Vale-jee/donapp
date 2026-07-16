# Gestion de Usuarios - Plan de Implementacion

## Dependencia Previa

La implementacion comenzara despues de completar 002-autenticacion-core. Esta feature reutilizara su modelo `Usuario`, el modelo `Sesion`, la autenticacion Bearer, la verificacion de contrasenas, la politica de contrasenas y la revocacion de sesiones.

No se modificara nuevamente el modelo `Usuario` salvo que durante la implementacion se demuestre una contradiccion real con la especificacion aprobada.

## Arquitectura

Las responsabilidades se separaran en:

```text
Rutas API de Next.js
  -> validaciones y normalizacion con zod
  -> servicios de usuarios
  -> servicios reutilizados de autenticacion
  -> Prisma ORM
  -> PostgreSQL
```

Las rutas gestionaran HTTP y el formato uniforme. Las validaciones aceptaran solo los contratos aprobados. Los servicios aplicaran privacidad, autorizacion, normalizacion, conflictos y transacciones.

## Organizacion Probable de Archivos

```text
lib/
  auth/
    authenticate.ts
    password.ts
  validations/
    usuarios.ts
  services/
    usuario-service.ts

src/pages/api/usuarios/
  perfil.ts
  password.ts
  desactivar.ts
  [id]/
    publico.ts

tests/
  usuarios/
```

Los nombres finales podran ajustarse a las convenciones existentes sin cambiar responsabilidades ni contratos.

## Autenticacion Bearer y Estado Activo

Las rutas protegidas reutilizaran el mecanismo de Autenticacion Core para extraer y validar `Authorization: Bearer`. La validacion resolvera el usuario desde el `sub` del token y comprobara en PostgreSQL que exista y permanezca activo.

No se aceptara un identificador enviado por el cliente para seleccionar al propietario del perfil.

## Consulta y Seleccion de Campos

Se definiran selecciones explicitas distintas para:

- Perfil propio: los once campos aprobados y el rol.
- Perfil publico: `id`, `nombreVisible`, `fotoPerfil` y `ciudad`.

No se reutilizaran objetos Prisma completos en respuestas. Una consulta publica filtrara simultaneamente por identificador y `activo = true`, de modo que una cuenta inexistente o inactiva produzca el mismo `404`.

## Actualizacion Parcial del Perfil

`PATCH /api/usuarios/perfil` aceptara exclusivamente los seis campos modificables y la credencial auxiliar `passwordActual`. La validacion exigira al menos un campo de perfil, rechazara propiedades desconocidas y omitira `passwordActual` de la persistencia.

El servicio aplicara todas las transformaciones antes de actualizar y devolvera una nueva consulta con la seleccion de perfil propio.

## Normalizacion de Datos

- `nombreCompleto`: trim y reduccion de espacios repetidos.
- `nombreVisible`: trim, formato aprobado y comprobacion de unicidad sin distinguir mayusculas.
- `email`: trim, minusculas, formato valido y unicidad.
- `ciudad`: trim, primera letra mayuscula y las demas minusculas.
- `telefono`: validacion de 7 a 15 digitos, prefijo `+` opcional y conversion de vacio a `null`.
- `fotoPerfil`: URL o ruta, maximo 500 caracteres y sin almacenar la imagen.

## Unicidad de Nombre Visible

La validacion y la persistencia utilizaran una representacion normalizada para comparar `nombreVisible` sin distinguir mayusculas y minusculas, conservando el valor visible aprobado para el perfil.

La implementacion debera garantizar la unicidad tambien en PostgreSQL para cubrir solicitudes concurrentes. La estrategia concreta de base de datos se coordinara con el modelo definitivo y la migracion de Autenticacion Core antes de implementar, sin modificar migraciones ya aplicadas.

Los conflictos de unicidad se traduciran a `409` aunque ocurran despues de una comprobacion previa.

## Validacion de Password Actual

El servicio reutilizara la verificacion de bcryptjs de Autenticacion Core:

- Al cambiar el correo, `passwordActual` sera condicionalmente obligatorio.
- Al cambiar la contrasena, `passwordActual` siempre sera obligatorio.
- Al desactivar la cuenta, `passwordActual` siempre sera obligatorio.

Una contrasena incorrecta producira `401` sin exponer hashes ni detalles internos.

## Cambio de Contrasena y Sesiones

El cambio de contrasena validara la politica aprobada, generara el nuevo hash y revocara todas las sesiones del usuario dentro de una operacion consistente. La respuesta se enviara sin tokens y el usuario debera iniciar sesion nuevamente.

No se creara un endpoint general para revocar todas las sesiones.

## Desactivacion de Cuenta

La desactivacion propia validara la contrasena actual. La desactivacion propia o administrativa actualizara `activo = false`, revocara todas las sesiones e invalidara inmediatamente sus access tokens mediante `sid`.

La operacion coordinara atomicamente las donaciones `PUBLICADA` a `RETIRADA` y las cancelaciones de solicitudes `PENDIENTE` con las causas aprobadas. No modificara donaciones `RESERVADA`, solicitudes `ACEPTADA`, chats, mensajes ni calificaciones.

Los casos `RESERVADA` bloqueados y la reactivacion administrativa se resolveran en 010. Reactivar cambiara solo `activo = true`, no restaurara sesiones ni estados historicos y requerira un nuevo login.

Los endpoints administrativos no se implementaran en esta feature.

El tratamiento de donaciones y solicitudes activas no se implementara en esta feature.

## Retirada del Endpoint Provisional

Antes de retirar `GET /api/usuarios` se confirmara que ningun flujo aprobado dependa de el. El archivo provisional se eliminara al implementar los endpoints de perfil. Los listados administrativos se implementaran posteriormente en 010-administracion.

## Endpoints

La estructura de Pages Router implementara exclusivamente:

- `GET /api/usuarios/perfil`.
- `PATCH /api/usuarios/perfil`.
- `GET /api/usuarios/{id}/publico`.
- `PUT /api/usuarios/password`.
- `PUT /api/usuarios/desactivar`.

Cada ruta rechazara metodos no permitidos y utilizara el formato uniforme con `data`.

## Pruebas

Se cubriran como minimo:

- Consulta del perfil propio y seleccion de campos.
- Perfil publico activo.
- Mismo `404` para usuario inexistente e inactivo.
- Ausencia de datos privados en perfil publico.
- Ausencia de hashes, sesiones y tokens en toda respuesta.
- Actualizacion parcial y rechazo de campos protegidos.
- Todas las normalizaciones aprobadas.
- Unicidad concurrente de correo y nombre visible.
- Nombre visible equivalente con diferentes mayusculas.
- Exigencia de `passwordActual` al cambiar correo.
- Cambio de contrasena, politica y revocacion total.
- Desactivacion, revocacion total y perdida inmediata de acceso.
- Rechazo de rutas protegidas para usuario inexistente o inactivo.
- Formato de exito y error con `data`.
- Metodos HTTP no permitidos.

## Riesgos y Verificaciones

- Una seleccion Prisma amplia podria exponer datos privados o secretos.
- Una validacion basada en identificadores del cuerpo permitiria modificar otra cuenta.
- Una comprobacion de unicidad solo en el servicio permitiria condiciones de carrera.
- Revocar sesiones sin comprobar `activo` en cada ruta no impediria inmediatamente el uso de access tokens existentes.
- Actualizar contrasena o estado sin una operacion consistente podria dejar sesiones validas.
- Eliminar fisicamente la cuenta romperia el requisito de conservar historial.
- Retirar el endpoint provisional antes de verificar consumidores podria romper usos existentes.
- La feature 004 mantiene temporalmente un formato de error incompatible y debera corregirse.

Antes de cerrar la feature se ejecutaran pruebas, lint y build, se verificara la retirada del endpoint provisional y se comparara la implementacion con `spec.md`.
