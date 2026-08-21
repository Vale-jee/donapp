# Robustez de BullMQ

La creación de una donación considera PostgreSQL como fuente de verdad. Después del commit, la API intenta crear el job `donation-created`:

- `ENQUEUED`: la donación fue persistida y BullMQ confirmó el job.
- `PENDING_RECONCILIATION`: la donación fue persistida, Redis falló y la API respondió igualmente `201` para no inducir un reintento que duplique la donación.

El fallo de enqueue queda en el log estructurado con `donationId`, nombre del job, tipo de fallo, timestamp y `requestId`. No se registra el payload ni credenciales.

## Política del job

- Job ID: `donation-created-<donationId>` (BullMQ no admite `:` en IDs personalizados).
- Intentos: 5.
- Backoff: exponencial con base de 2 segundos.
- Completados: máximo 1.000 y 24 horas.
- Fallidos: máximo 5.000 y 7 días; después del último intento permanecen como `failed` hasta que aplique la retención.

## Recuperación controlada

Cuando el log indique `PENDING_RECONCILIATION`, un operador puede ejecutar:

```powershell
yarn.cmd queue:reconcile:donations --donation-id=123
```

Se aceptan varios argumentos. El script comprueba que cada donación exista y vuelve a asegurar el job determinista. No escanea ni encola todas las donaciones porque el schema actual no registra cuáles perdieron el evento.

Esta estrategia reduce duplicados y permite recuperación observable, pero no ofrece entrega atómica DB/Redis. Una garantía fuerte requiere una tabla Outbox persistida en la misma transacción que la donación, migración, publicador y estados de despacho; queda fuera de este bloque.
