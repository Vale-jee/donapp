# Reglas Operativas de DonApp

## Propósito

Este documento orienta obligatoriamente a Codex para trabajar en DonApp sin modificar decisiones aprobadas, ampliar una autorización ni intervenir archivos fuera del alcance solicitado.

DonApp utiliza desarrollo dirigido por especificaciones. El código existente puede ser provisional, antiguo o incompleto y no reemplaza el diseño documental aprobado.

## Jerarquía Documental

Ante cualquier tarea se aplicará esta jerarquía:

1. Instrucción expresa del usuario para la tarea actual.
2. `spec.md` de la feature correspondiente.
3. `plan.md` de la feature correspondiente.
4. `tasks.md` de la feature correspondiente.
5. Documentos globales:
   - `spec/constitution/mission.md`;
   - `spec/constitution/roadmap.md`;
   - `spec/constitution/tech-stack.md`.
6. Código existente.

Si el código contradice la documentación aprobada, se reportará la diferencia antes de cambiarla. Una ausencia de implementación no constituye por sí sola una contradicción documental.

## Fuente de Verdad por Feature

Cada feature se documenta en `spec/features/XXX-*/` mediante:

- `spec.md`: define qué debe hacer la feature, su alcance, contratos y reglas aprobadas.
- `plan.md`: define cómo se implementará técnicamente.
- `tasks.md`: registra el trabajo completado y pendiente.

No existen README individuales como fuente principal de las features. Una tarea solo puede marcarse como completada cuando exista evidencia verificable de su ejecución.

## Flujo Obligatorio de Trabajo

1. Leer completamente `spec.md`.
2. Leer completamente `plan.md`.
3. Revisar `tasks.md`.
4. Identificar dependencias e integraciones.
5. Inspeccionar el código relacionado.
6. Comparar el diseño aprobado con la implementación existente.
7. Informar el alcance y los archivos previstos.
8. Esperar autorización cuando la tarea sea de análisis o planificación y todavía no autorice cambios.
9. Implementar únicamente las tareas y fases autorizadas.
10. Ejecutar verificaciones proporcionales al cambio.
11. Actualizar `tasks.md` solo cuando esté autorizado y exista evidencia.
12. Informar archivos modificados, verificaciones, pendientes y riesgos.

## Control de Alcance

- La autorización para una fase no autoriza implementar la feature completa.
- La autorización para documentación no autoriza modificar código.
- La autorización para código no autoriza modificar Prisma o migraciones salvo indicación expresa.
- No se modificarán archivos externos al alcance autorizado.
- No se introducirán endpoints, modelos, campos, estados, reglas o dependencias no aprobados.
- No se cambiarán decisiones funcionales o técnicas aprobadas sin autorización.
- Ante una contradicción real no aprobada, se detendrá el trabajo afectado y se reportará.

## Convenciones Técnicas

- Utilizar exclusivamente Next.js Pages Router.
- Ubicar las rutas REST bajo `src/pages/api/`.
- Separar rutas API, validaciones Zod, servicios, utilidades compartidas y acceso mediante Prisma.
- Implementar en TypeScript.
- Utilizar Zod para validaciones según los contratos aprobados.
- Construir respuestas según `004-manejo-errores`.
- Seleccionar explícitamente los campos permitidos antes de responder.
- Utilizar transacciones y actualizaciones condicionales en operaciones atómicas.
- Aplicar restricciones e índices en PostgreSQL cuando corresponda.

Está prohibido:

- utilizar App Router, `app/api` o `route.ts`;
- devolver objetos Prisma completos;
- colocar reglas de negocio complejas directamente en las rutas;
- inventar coerciones o normalizaciones no aprobadas.

## Prisma y Base de Datos

- No modificar `prisma/schema.prisma` sin autorización expresa.
- No crear ni aplicar migraciones sin autorización expresa.
- Revisar el SQL generado antes de aplicar una migración.
- No modificar manualmente migraciones ya aplicadas.
- No ejecutar `reset`, `drop` ni comandos destructivos.
- Conservar el historial funcional y evitar cascadas destructivas.
- Documentar y revisar las restricciones PostgreSQL que Prisma no pueda expresar.
- No afirmar que una migración fue aplicada si no se ejecutó y verificó.

## Seguridad y Privacidad

- No exponer `passwordHash`, `refreshTokenHash`, tokens, secretos ni variables sensibles.
- No registrar credenciales, hashes, tokens, cuerpos completos de autenticación ni contenido de mensajes privados.
- Respetar en cada operación el estado activo, la propiedad del recurso y el rol actual.
- Consultar el rol actual de la base de datos cuando la autorización lo requiera.
- No confiar en identificadores de usuario, propietario, receptor, remitente o administrador enviados para suplantar una identidad.
- `ADMIN` no puede consultar el contenido de mensajes privados; solo los metadatos aprobados.
- Los errores no deben revelar recursos privados, detalles internos, consultas SQL ni stack traces.

## Contrato de Respuestas

Respuesta exitosa:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Respuesta de error:

```json
{
  "success": false,
  "status": 400,
  "message": "...",
  "data": null
}
```

- `status` aparece únicamente en errores y coincide con el estado HTTP real.
- `errors` es opcional y se usa exclusivamente para validaciones por campo.
- DonApp no utiliza `422`; las entradas inválidas responden `400`.
- Toda respuesta `405` incluye la cabecera `Allow`.
- Los errores técnicos se traducen y sanitizan antes de responder.

## Evidencia y Verificación

- No marcar tareas como completadas sin evidencia.
- Registrar los comandos de verificación ejecutados.
- Informar pruebas superadas, fallidas o no ejecutadas.
- Ejecutar lint y build cuando correspondan al alcance y riesgo del cambio.
- Postman será la herramienta oficial para pruebas manuales, colecciones y evidencia académica de la API.
- Las pruebas automatizadas se organizarán bajo `tests/`; el runner se aprobará antes de implementar las features 002 y 004.
- No instalar herramientas de pruebas ni otras dependencias sin autorización.

## Reporte Final

Codex deberá informar:

- archivos modificados;
- resumen de cambios;
- pruebas y verificaciones realizadas;
- resultados obtenidos;
- tareas actualizadas, si fueron autorizadas;
- trabajo pendiente;
- riesgos o contradicciones detectadas.
