# Administración

## Objetivo

Permitir al administrador gestionar y supervisar el funcionamiento general de DonApp, garantizando el cumplimiento de las reglas de negocio y el correcto uso de la plataforma.


## Descripción

Este módulo reúne las funcionalidades exclusivas del administrador para administrar las categorías, supervisar los usuarios registrados, consultar las publicaciones y acceder a información general del sistema.

Su propósito es mantener la integridad y el correcto funcionamiento de la aplicación sin intervenir en el proceso normal de donación entre los usuarios.


## Tecnologías

- Next.js 16.2.10
- TypeScript 5.9.3
- PostgreSQL 16.x
- Prisma ORM 7.8.0


## Requisitos Funcionales

**RF-001** Consultar el listado de usuarios registrados.

**RF-002** Consultar el listado de donaciones publicadas.

**RF-003** Administrar las categorías del sistema.

**RF-004** Activar o desactivar cuentas de usuario.

**RF-005** Consultar las calificaciones de los donantes.

**RF-006** Consultar estadísticas generales de la aplicación.


## Reglas de Negocio

**RN-001** Solo los usuarios con el rol **ADMIN** podrán acceder a este módulo.

**RN-002** El administrador podrá activar o desactivar cualquier cuenta de usuario cuando sea necesario.

**RN-003** El usuario únicamente podrá desactivar su propia cuenta desde el módulo Gestión de Usuarios.

**RN-004** El administrador podrá crear, actualizar, activar o desactivar categorías.

**RN-005** El administrador podrá consultar todas las donaciones registradas en el sistema.

**RN-006** El administrador podrá consultar las calificaciones y estadísticas generales de la aplicación.

**RN-007** El administrador no podrá modificar la información personal de los usuarios, excepto el estado de la cuenta.


## Modelo de Datos

### Tablas principales

- Usuario
- Rol
- Categoria
- Donacion
- Calificacion


## API

| Método | Endpoint | Descripción |
|---------|----------|-------------|
| GET | /api/admin/usuarios | Consultar usuarios |
| PUT | /api/admin/usuarios/{id}/estado | Activar o desactivar una cuenta |
| GET | /api/admin/donaciones | Consultar donaciones |
| GET | /api/admin/categorias | Consultar categorías |
| POST | /api/admin/categorias | Crear categoría |
| PUT | /api/admin/categorias/{id} | Actualizar categoría |
| PATCH | /api/admin/categorias/{id}/estado | Activar o desactivar categoría |
| GET | /api/admin/calificaciones | Consultar calificaciones |
| GET | /api/admin/estadisticas | Consultar estadísticas generales |


## Estado

⏳ Pendiente


## Observaciones

Las funciones de administración estarán disponibles únicamente para usuarios con el rol **ADMIN**. El objetivo de este módulo es supervisar el funcionamiento de DonApp y mantener la integridad de la información sin intervenir en las interacciones normales entre donantes y receptores.