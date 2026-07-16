# Categorías

## Objetivo

Administrar las categorías utilizadas para clasificar las donaciones publicadas en DonApp.


## Descripción

Este módulo permite crear, consultar, actualizar y administrar las categorías disponibles en la aplicación.

Las categorías facilitan la organización de las publicaciones y mejoran la búsqueda de artículos por parte de los usuarios.


## Tecnologías

- Next.js 16.2.10
- TypeScript 5.9.3
- PostgreSQL 16.x
- Prisma ORM 7.8.0


## Requisitos Funcionales

RF-001 Consultar categorías.

RF-002 Crear una categoría.

RF-003 Actualizar una categoría.

RF-004 Activar o desactivar una categoría.

RF-005 Listar únicamente categorías activas para crear nuevas donaciones.


## Reglas de Negocio

RN-001 No podrán existir dos categorías con el mismo nombre.

RN-002 Solo los administradores podrán crear categorías.

RN-003 Solo los administradores podrán modificar categorías.

RN-004 Una categoría desactivada no podrá utilizarse para nuevas publicaciones.

RN-005 Las donaciones existentes conservarán su categoría aunque esta sea desactivada.


## Modelo de Datos

Tabla principal:

Categoria

Relaciones:

Categoria (1) -------- (N) Donacion


## API

GET    /api/categorias

POST   /api/categorias

PUT    /api/categorias/{id}

PATCH  /api/categorias/{id}/estado


## Estado

⏳ Pendiente


## Observaciones

Las categorías iniciales del sistema serán:

- Ropa y calzado
- Alimentos
- Libros
- Juguetes
- Tecnología
- Muebles
- Artículos para el hogar
- Salud
- Útiles escolares
- Otros