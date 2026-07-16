# Manejo de Errores

## Objetivo

Definir una estrategia uniforme para el manejo de errores en la API de DonApp, garantizando respuestas consistentes, seguras y fáciles de interpretar tanto para la aplicación móvil como para los desarrolladores.


## Descripción

Este módulo establece las convenciones para el manejo de errores generados por el backend. Todas las respuestas de error seguirán la misma estructura y utilizarán los códigos de estado HTTP correspondientes.


## Tecnologías

- Next.js 16.2.10
- TypeScript 5.9.3


## Requisitos Funcionales

**RF-001** Gestionar errores de validación de datos.

**RF-002** Gestionar errores de autenticación.

**RF-003** Gestionar errores de autorización.

**RF-004** Gestionar errores cuando un recurso no exista.

**RF-005** Gestionar errores internos del servidor.

**RF-006** Mantener un formato uniforme para todas las respuestas de error.


## Reglas Técnicas

**RT-001** Todas las respuestas de error deberán utilizar códigos HTTP estándar.

**RT-002** No se expondrá información sensible en los mensajes de error.

**RT-003** Los errores deberán registrarse para facilitar el diagnóstico del sistema.

**RT-004** Todas las respuestas de error deberán seguir la misma estructura.


## Formato de Respuesta

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación realizada correctamente.",
  "data": {}
}
```

### Respuesta con Error

```json
{
  "success": false,
  "status": 404,
  "message": "Usuario no encontrado."
}
```


## Códigos HTTP

| Código | Descripción |
|---------|-------------|
| 200 | Solicitud procesada correctamente. |
| 201 | Recurso creado correctamente. |
| 400 | Solicitud inválida. |
| 401 | Usuario no autenticado. |
| 403 | Acceso denegado. |
| 404 | Recurso no encontrado. |
| 409 | Conflicto de datos. |
| 500 | Error interno del servidor. |


## Estado

⏳ Pendiente


## Observaciones

Las convenciones definidas en este módulo deberán aplicarse en todos los endpoints del proyecto para mantener un comportamiento uniforme de la API.