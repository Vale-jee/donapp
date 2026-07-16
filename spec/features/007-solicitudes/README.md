# Solicitudes

## Objetivo

Permitir que los usuarios soliciten donaciones disponibles y gestionar el proceso de aceptación o rechazo por parte del donante, garantizando una asignación organizada, transparente y segura de los artículos.


## Descripción

Este módulo permite que un usuario registrado solicite una donación publicada por otro usuario. El donante podrá revisar las solicitudes recibidas y seleccionar a la persona que recibirá el artículo.

Cuando una solicitud sea aceptada, la donación dejará de estar disponible para nuevos solicitantes, se cancelarán automáticamente las demás solicitudes y se habilitará un chat privado entre ambas partes para coordinar la entrega.


## Tecnologías

- Next.js 16.2.10
- TypeScript 5.9.3
- PostgreSQL 16.x
- Prisma ORM 7.8.0


## Requisitos Funcionales

**RF-001** Permitir solicitar una donación disponible.

**RF-002** Consultar las solicitudes enviadas por el usuario.

**RF-003** Consultar las solicitudes recibidas para una donación.

**RF-004** Permitir al donante aceptar una solicitud.

**RF-005** Cancelar automáticamente las demás solicitudes cuando una sea aceptada.

**RF-006** Notificar a los demás solicitantes que la donación ya no se encuentra disponible.

**RF-007** Generar automáticamente un chat entre el donante y el receptor cuando una solicitud sea aceptada.

**RF-008** Permitir al usuario cancelar una solicitud enviada mientras permanezca en estado PENDIENTE.


## Reglas de Negocio

**RN-001** Un usuario no podrá solicitar una donación publicada por sí mismo.

**RN-002** Un usuario podrá solicitar todas las donaciones que desee, siempre que no haya solicitado previamente la misma donación.

**RN-003** Una donación podrá recibir múltiples solicitudes mientras permanezca disponible.

**RN-004** El donante decidirá cuándo aceptar una solicitud; mientras no lo haga, la donación continuará disponible para nuevos solicitantes.

**RN-005** El donante podrá aceptar únicamente una solicitud por cada donación.

**RN-006** Al aceptar una solicitud, todas las demás cambiarán automáticamente al estado CANCELADA.
**RN-007** La identidad del usuario seleccionado no será revelada a los demás solicitantes.

**RN-008** Una vez aceptada una solicitud, la donación dejará de aparecer en las búsquedas.

**RN-009** Solo el donante podrá aceptar o rechazar las solicitudes recibidas.

**RN-010** El solicitante podrá cancelar su propia solicitud mientras permanezca en estado **PENDIENTE**.

**RN-011** Una donación permanecerá disponible para recibir nuevas solicitudes mientras el donante no acepte una de ellas o decida eliminar la publicación.


## Modelo de Datos

### Tablas principales

- Solicitud
- Donacion
- Usuario


## API

| Método | Endpoint | Descripción |
|---------|----------|-------------|
| GET | /api/solicitudes | Consultar solicitudes del usuario |
| POST | /api/solicitudes | Crear una solicitud |
| PUT | /api/solicitudes/{id}/aceptar | Aceptar una solicitud |
| PUT | /api/solicitudes/{id}/cancelar | Cancelar una solicitud |


## Estado

⏳ Pendiente


## Observaciones

Las solicitudes constituyen el mecanismo mediante el cual un usuario manifiesta su interés por una donación. Cuando una solicitud es aceptada, la donación deja de estar disponible, se habilita un chat privado entre las partes y las demás solicitudes son canceladas automáticamente.