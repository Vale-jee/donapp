# Diagnóstico del 404 de detalle en Samsung

## Evidencia reproducida el 29 de septiembre de 2026

Se conservaron los cambios pendientes de Eliminar. No se modificaron rutas,
repositorios, modelos, Prisma, autenticación ni reglas de edición/eliminación.

El proceso de desarrollo que atendía el puerto 3000 devolvía:

| Petición sin credenciales | Antes | Después del reinicio |
|---|---|---|
| GET /api/donaciones/mias | 401 JSON de la API | 401 JSON de la API |
| GET /api/donaciones/731 | 404 HTML de Next.js | 401 JSON de la API |

También daban 404 HTML `/api/donaciones/1`,
`/api/donaciones/731/solicitudes`, `/api/solicitudes/1` y `/api/categorias/1`.
No era el mensaje JSON «Donación no encontrada.» del servicio.

`/_next/static/development/_devPagesManifest.json` exponía solo estas rutas:

```json
{"pages":["/","/_app","/_document"]}
```

El servidor de desarrollo no tenía registradas las rutas API dinámicas. Por
eso rechazaba cualquier ID antes del handler y antes de Prisma. El manifiesto
de producción sí contenía `/api/donaciones/[id]`. Un servidor de control con
esa compilación, en el puerto 3001, devolvió el 401 JSON esperado para el mismo
GET sin credenciales. Se cerró ese servidor de control al terminar.

La nueva prueba HTTP `tests/integration/donation-route-resolution.test.ts`
reprodujo el fallo: 1 prueba aprobada (/mias) y 1 fallida (/731: esperado 401,
recibido 404). Tras reiniciar exclusivamente el lanzador y proceso de Next.js
de DonApp, sin borrar caché ni editar código o configuración, el manifiesto
registró 51 rutas, incluida `/api/donaciones/[id]`, y la prueba pasó 2/2.
Volvió a pasar después de ejecutar el build solicitado.

**Causa comprobada del 404:** registro incompleto de rutas en el proceso de
desarrollo. **Límite de la evidencia:** no se capturó el evento que dejó ese
registro incompleto. No está demostrado que una línea de DELETE lo causara,
ni que un build, OneDrive o un ID incorrecto fueran el desencadenante. No se
cambió código de negocio para intentar corregir una causa no demostrada.

## Identificadores y consulta

La prueba real con el perfil E2E local existente produjo:

```text
GET /api/donaciones/mias   -> 200, ids: [77]
GET /api/donaciones/77     -> 200 JSON, data.donacion.id: 77
```

Se usaron las credenciales solo en memoria para login y se cerró esa sesión
de diagnóstico. No se imprimieron tokens, credenciales ni datos personales;
no se creó, editó o eliminó ninguna donación. El 77 corresponde a la cuenta de
pruebas: no se afirma que sea el ID pulsado por el usuario en Samsung, que no
se capturó durante el incidente.

La trazabilidad del frontend sigue siendo:

```text
/mias data.donaciones[].id
  -> DonationListItem.id = strictInt(json['id'])
  -> MyDonationsScreen._openDonation(donation.id)
  -> AppRoutes.donationDetailLocation(id) = /donaciones/{id}
  -> int.tryParse(state.pathParameters['id'])
  -> DonationDetailScreen.donationId
  -> DonationRepository.getDonationById(id)
  -> DonationRemoteDataSource.getDonationById(id)
  -> DonationService.getDonationById(id)
  -> ApiClient GET /api/donaciones/{id}
```

No se sustituye ese ID por localId/clientId. El filtro de eliminaciones solo
excluye IDs confirmados; no transforma el identificador ni intercepta detalle.
Detalle y Mis donaciones siguen utilizando el servicio configurado en el
router. La prueba existente del router verifica 731, distinto de la PK Drift,
incluyendo GET, PATCH, DELETE y cero peticiones al servicio offline alternativo.

En el backend, GET usa `donationDetailQuerySchema` y llama a
`getDonationDetail(auth.userId, {id})`. `findDonationDetailContext` ejecuta una
transacción de lecturas con:

- `usuario.findUnique({where: {id: userId}, select: {id: true, ciudad: true}})`;
- `donacion.findUnique({where: {id: donationId}, select: ...})`;
- búsqueda de calificación pendiente para el permiso de solicitar.

El select de donación incluye propietario, estado, categoría, imágenes,
solicitud aceptada y solicitudes activas del actor. El servicio devuelve 404
JSON únicamente si no existe la donación o no es visible. Ser propietario
permite ver el detalle independientemente de ciudad/estado. Esas consultas,
validaciones, reglas y la rama GET no cambiaron al incorporar DELETE.

La nueva prueba unitaria `tests/unit/donation-list-detail.test.ts` conserva los
handlers, validación, servicio y constructor real de consultas Prisma; sustituye
solo autenticación y transporte de BD. Comprueba /mias con ID 731, GET con 731,
`where: {id: 731}`, respuesta 200 y 404 JSON para un registro inexistente.
Esta prueba de código pasa también sin reiniciar; la prueba HTTP es la que
detecta y reproduce el fallo real del proceso de desarrollo.

## Repetir la comprobación sin credenciales

Con DonApp en el puerto 3000, desde la carpeta del backend:

```powershell
$env:DONAPP_ROUTE_SMOKE_URL = 'http://127.0.0.1:3000'
npx.cmd vitest run tests/integration/donation-route-resolution.test.ts
```

Esta prueba no borra ni inserta datos y no necesita PostgreSQL para comprobar
el rechazo por autenticación. Para recuperar el servidor si vuelve a aparecer
un 404 HTML: detener solo `npm run dev` con Ctrl+C y ejecutarlo de nuevo. No
borrar .next, cambiar IDs o desactivar autorización como primera medida.

No se encontró mojibake en los archivos de código revisados con lectura UTF-8;
no se cambiaron textos. No se añadió logging temporal a la aplicación.

## Confirmación física y conservación de artefactos

Posteriormente el usuario confirmó en Samsung la apertura del detalle después
del reinicio, la eliminación de una PUBLICADA propia sin solicitudes, su
desaparición de la app, la ausencia del botón en RESERVADA y el rechazo de
PUBLICADAS con solicitudes. Esta confirmación física se distingue de las
pruebas de widget y HTTP ejecutadas por el agente.

Este documento se conserva como referencia de un incidente reproducido. La
prueba HTTP se conserva como comprobación de integración opcional: se omite
sin `DONAPP_ROUTE_SMOKE_URL`, no exige un servidor externo en la suite unitaria
ni en CI por defecto y no escribe datos. La prueba list/detail se conserva
como regresión unitaria estable, sin servicios externos. Los logs de consola
de las corridas son temporales y no deben versionarse.
