# Pruebas permanentes de DonApp

La suite utiliza Vitest y se divide entre pruebas unitarias sin servicios externos y pruebas de integración HTTP contra una instancia local real de DonApp. Los benchmarks de `scripts/` permanecen separados y no sustituyen estas aserciones funcionales.

## Ejecución

```powershell
yarn.cmd test:unit
yarn.cmd test:integration
```

Las unitarias cubren normalización y validaciones críticas, errores y respuestas uniformes, sanitización de fallos, propagación de request ID, JSON malformado y la configuración e idempotencia de la cola de donaciones.

Para integración:

1. Copie `.env.test.example` como `.env.test` y cambie solo valores locales.
2. Use PostgreSQL 16 con el esquema ya migrado y roles `ADMIN`/`USUARIO`. El nombre de la base debe contener `test`.
3. Use Redis local en una base lógica distinta de `0` (el ejemplo usa `/15`). Así las claves de rate limiting quedan separadas de Redis normal y BullMQ. No detenga el Redis habitual.
4. Inicie la API cargando explícitamente `.env.test` en el puerto TEST_BASE_URL (ejemplo 3100).
5. En otra terminal cargue el mismo entorno para Vitest. Los scripts package.json no cargan `.env.test` automáticamente; tener el archivo no basta:

```powershell
# Terminal API: desde donapp
node --env-file=.env.test node_modules/next/dist/bin/next dev --port 3100
# Terminal tests: desde donapp
node --env-file=.env.test node_modules/vitest/vitest.mjs run tests/integration
```

Sin variables externas, `yarn.cmd test:integration` no prepara el entorno aislado. No apunte estas pruebas a .env habitual: crean y eliminan fixtures.

La suite se niega a ejecutar si falta `DONAPP_INTEGRATION_TESTS=true`, si API/PostgreSQL/Redis no son locales, si la base PostgreSQL no contiene `test`, o si Redis usa la base lógica `0`. No ejecuta truncates. Cada corrida crea correos, nombres y una categoría con un prefijo único; al finalizar elimina únicamente las sesiones, usuarios y recursos relacionados con ese prefijo.

La integración tiene casos preparados de DELETE elegible y rechazo por solicitudes/historial, además de login válido e inválido, sesión inválida, refresh y rechazo del token anterior, logout, cuenta inactiva, límite básico por correo, JSON malformado, flujo publicación–solicitud–aceptación–reserva–chat–mensaje–doble confirmación–entrega–calificación, dos aceptaciones simultáneas, autorización ADMIN/USUARIO y robustez BullMQ con Redis disponible, indisponible y recuperado.

Comprobación adicional de tipos: `yarn.cmd tsc --noEmit --incremental false`. Existe un fallo conocido con TS2322 en tests/integration/bullmq-robustness.test.ts:58 (Worker con retorno never). Un build correcto no sustituye este chequeo completo.

## Postman

Importe `docs/postman/DonApp.postman_collection.json` y `docs/postman/DonApp.local.postman_environment.json`. Complete las credenciales ficticias y ejecute las carpetas en orden. Los scripts verifican el contrato básico y guardan tokens e identificadores creados. Ningún secreto o ID personal está versionado.

## Pendiente

No se automatizan todavía todos los casos negativos, la cobertura exhaustiva de cada endpoint administrativo, privacidad exhaustiva ni rendimiento. La suite verifica que el refresh anterior rotado sea rechazado, pero no implementa detección de reutilización de refresh tokens. BullMQ sí cuenta con cobertura permanente de sus garantías documentadas.

## Comprobación opcional de registro de rutas

`donation-route-resolution.test.ts` se omite si no se configura DONAPP_ROUTE_SMOKE_URL. Con API local disponible, puede ejecutar:

```powershell
$env:DONAPP_ROUTE_SMOKE_URL = 'http://127.0.0.1:3000'
yarn.cmd vitest run tests/integration/donation-route-resolution.test.ts
```

Comprueba respuestas de autenticación sin escribir datos; no equivale a probar eliminación real. Consulte [incidente histórico 404](donation-detail-404.md).
