# Donaciones

## Objetivo

Gestionar la publicación, consulta, actualización y eliminación de donaciones dentro de DonApp, permitiendo conectar a donantes y receptores de forma organizada, segura y sencilla.


## Descripción

Este módulo permite a los usuarios publicar artículos que desean donar, administrar sus publicaciones y consultar las donaciones disponibles dentro de su misma ciudad.

Cada donación pertenecerá a una única categoría y podrá recibir solicitudes de otros usuarios registrados.


## Tecnologías

- Next.js 16.2.10
- TypeScript 5.9.3
- PostgreSQL 16.x
- Prisma ORM 7.8.0


## Requisitos Funcionales

**RF-001** Crear una nueva donación.

**RF-002** Consultar las donaciones disponibles.

**RF-003** Consultar el detalle de una donación.

**RF-004** Actualizar una donación propia.

**RF-005** Eliminar una donación propia.

**RF-006** Filtrar donaciones por categoría.

**RF-007** Mostrar únicamente donaciones pertenecientes a la misma ciudad del usuario.

**RF-008** Asociar una o varias imágenes a una donación.


## Reglas de Negocio

**RN-001** Solo usuarios autenticados podrán publicar donaciones.

**RN-002** Solo el propietario podrá editar una donación.

**RN-003** Solo el propietario podrá eliminar una donación.

**RN-004** Cada donación pertenecerá a una única categoría.

**RN-005** Una donación podrá tener una o varias imágenes.

**RN-006** Solo se mostrarán donaciones disponibles.

**RN-007** Las donaciones aceptadas dejarán de aparecer en las búsquedas.

**RN-008** Las donaciones permanecerán publicadas hasta que el donante las elimine o sean entregadas.

**RN-009** La ciudad de la donación corresponderá a la ciudad registrada por el donante al momento de crear la publicación.

**RN-010** Solo los usuarios autenticados podrán visualizar las donaciones disponibles.


## Modelo de Datos

### Tablas principales

- Donacion
- Categoria
- ImagenDonacion
- Usuario


## API

| Método | Endpoint | Descripción |
|---------|----------|-------------|
| GET | /api/donaciones | Consultar donaciones |
| GET | /api/donaciones/{id} | Consultar una donación |
| POST | /api/donaciones | Publicar una donación |
| PUT | /api/donaciones/{id} | Actualizar una donación |
| DELETE | /api/donaciones/{id} | Eliminar una donación |


## Estado

⏳ Pendiente


## Observaciones

Las donaciones constituyen la funcionalidad principal de DonApp. Todas las publicaciones estarán asociadas a un usuario y únicamente podrán ser administradas por su propietario.