# Calificaciones

## Objetivo

Permitir que el receptor califique al donante una vez finalizada la entrega de una donación, fortaleciendo la confianza entre los usuarios y promoviendo el cumplimiento de las publicaciones realizadas en DonApp.


## Descripción

Este módulo permite que el receptor registre una calificación para el donante al finalizar exitosamente una donación.

Las calificaciones formarán parte del perfil público del donante y servirán como referencia para que otros usuarios conozcan su nivel de compromiso, responsabilidad y cumplimiento al momento de entregar las donaciones.


## Tecnologías

- Next.js 16.2.10
- TypeScript 5.9.3
- PostgreSQL 16.x
- Prisma ORM 7.8.0


## Requisitos Funcionales

**RF-001** Permitir al receptor calificar al donante una vez finalizada la donación.

**RF-002** Consultar las calificaciones recibidas por un donante.

**RF-003** Mostrar el promedio de calificaciones del donante.

**RF-004** Mostrar la cantidad total de calificaciones recibidas.

**RF-005** Mostrar la cantidad total de donaciones entregadas por el donante.

**RF-006** Notificar al receptor cuando tenga una calificación pendiente antes de permitirle realizar una nueva solicitud.


## Reglas de Negocio

**RN-001** Solo el receptor podrá calificar al donante.

**RN-002** El receptor solo podrá emitir una calificación por cada donación finalizada.

**RN-003** La calificación será obligatoriamente de una a cinco estrellas.

**RN-004** No se permitirán comentarios en las calificaciones.

**RN-005** Las calificaciones no podrán modificarse ni eliminarse una vez registradas.

**RN-006** Las calificaciones formarán parte del historial permanente del donante.

**RN-007** El promedio de calificaciones, la cantidad de calificaciones y el total de donaciones entregadas serán visibles para todos los usuarios.

**RN-008** Una vez finalizada la donación, el sistema solicitará al receptor registrar la calificación del donante.

**RN-009** Si el receptor tiene una calificación pendiente de una donación entregada, no podrá enviar nuevas solicitudes hasta completar dicha calificación.

## Modelo de Datos

### Tablas principales

- Calificacion
- Usuario
- Donacion


## API

| Método | Endpoint | Descripción |
|---------|----------|-------------|
| POST | /api/calificaciones | Registrar una calificación |
| GET | /api/calificaciones/{usuarioId} | Consultar las calificaciones de un donante |
| GET | /api/calificaciones/resumen/{usuarioId} | Consultar el promedio, la cantidad de calificaciones y las donaciones entregadas |


## Estado

⏳ Pendiente


## Observaciones

Las calificaciones tienen como finalidad generar confianza entre los usuarios de DonApp, permitiendo que los receptores identifiquen a los donantes con mayor compromiso y cumplimiento en la entrega de sus donaciones.