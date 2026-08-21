# Pruebas permanentes de DonApp

La suite utiliza Vitest y se divide entre pruebas unitarias sin servicios externos y pruebas de integración HTTP contra una instancia local real de DonApp. Los benchmarks de `scripts/` permanecen separados y no sustituyen estas aserciones funcionales.

## Ejecución

```powershell
yarn.cmd test:unit
yarn.cmd test:integration
```

Las unitarias cubren normalización y validaciones críticas, errores y respuestas uniformes, sanitización de fallos, propagación de request ID y JSON malformado.

Para integración:

1. Copie `.env.test.example` como `.env.test` y cambie solo valores locales.
2. Use PostgreSQL 16 con el esquema ya migrado y roles `ADMIN`/`USUARIO`. El nombre de la base debe contener `test`.
3. Use Redis local en una base lógica distinta de `0` (el ejemplo usa `/15`). Así las claves de rate limiting quedan separadas de Redis normal y BullMQ. No detenga el Redis habitual.
4. Inicie la API con ese mismo entorno en el puerto de `TEST_BASE_URL`, por ejemplo `yarn.cmd dev --port 3100`.
5. Ejecute `yarn.cmd test:integration` desde otra terminal con `.env.test` disponible.

La suite se niega a ejecutar si falta `DONAPP_INTEGRATION_TESTS=true`, si API/PostgreSQL/Redis no son locales, si la base PostgreSQL no contiene `test`, o si Redis usa la base lógica `0`. No ejecuta truncates. Cada corrida crea correos, nombres y una categoría con un prefijo único; al finalizar elimina únicamente las sesiones, usuarios y recursos relacionados con ese prefijo.

La integración cubre login válido e inválido, sesión inválida, refresh y rechazo del token anterior, logout, cuenta inactiva, límite básico por correo, JSON malformado, flujo publicación–solicitud–aceptación–reserva–chat–mensaje–doble confirmación–entrega–calificación, dos aceptaciones simultáneas y autorización ADMIN/USUARIO.

## Postman

Importe `docs/postman/DonApp.postman_collection.json` y `docs/postman/DonApp.local.postman_environment.json`. Complete las credenciales ficticias y ejecute las carpetas en orden. Los scripts verifican el contrato básico y guardan tokens e identificadores creados. Ningún secreto o ID personal está versionado.

## Pendiente

No se automatizan todavía todos los casos negativos, los 16 endpoints administrativos, privacidad exhaustiva, rendimiento, BullMQ ni detección de reutilización de refresh tokens. La prueba solo verifica que el refresh anterior rotado sea rechazado; no implementa detección adicional.
