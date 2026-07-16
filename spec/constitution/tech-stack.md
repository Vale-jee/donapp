# Tech Stack

## Tecnologías del Proyecto

Las siguientes tecnologías han sido seleccionadas para el desarrollo de DonApp. El documento será actualizado conforme avance el proyecto y se incorporen nuevas herramientas.

## Tecnologías Implementadas

| Capa | Tecnología | Versión | Estado |
|------|------------|----------|--------|
| Backend | Next.js | 16.2.10 | ✅ Configurado |
| Backend | React | 19.2.4 | ✅ Configurado |
| Backend | TypeScript | 5.9.3 | ✅ Configurado |
| Runtime | Node.js | 24.18.0 | ✅ Configurado |
| Base de Datos | PostgreSQL | 16.x | ✅ Configurado |
| ORM | Prisma | 7.8.0 | ✅ Configurado |
| Cliente ORM | @prisma/client | 7.8.0 | ✅ Configurado |
| Gestor de paquetes | Yarn | 1.22.22 | ✅ Configurado |
| Control de versiones | Git | En uso | ✅ Configurado |
| Repositorio | GitHub | En uso | ✅ Configurado |
| IDE | Visual Studio Code | En uso | ✅ Configurado |
| Cliente BD | Prisma Studio | 0.27.3 | ✅ Configurado |
| Cliente BD | DBeaver | En uso | ✅ Configurado |


## Tecnologías Planificadas

Estas tecnologías forman parte del alcance del proyecto, pero aún no han sido implementadas.

| Capa | Tecnología | Estado |
|------|------------|--------|
| Frontend | Flutter | ⏳ Pendiente |
| Lenguaje móvil | Dart | ⏳ Pendiente |


# Arquitectura

DonApp utilizará una arquitectura cliente-servidor.

Aplicación móvil (Flutter)

↓

API REST (Next.js)

↓

Prisma ORM

↓

PostgreSQL


# Convenciones del Proyecto

## Base de Datos

- Utilizar PostgreSQL como gestor de base de datos relacional.
- Gestionar el esquema mediante Prisma ORM.
- Utilizar migraciones para todos los cambios estructurales.
- Mantener la integridad referencial mediante claves primarias y foráneas.

## Backend

- Desarrollar toda la lógica utilizando TypeScript.
- Implementar una arquitectura basada en API REST.
- Validar la información antes de almacenarla en la base de datos.
- Mantener separación entre rutas, servicios y acceso a datos.


## Frontend

- Utilizar Flutter para el desarrollo de la aplicación móvil.
- Implementar Material Design 3.
- Consumir los servicios mediante API REST.
- Mostrar únicamente la información pública de los usuarios.


## Convenciones de Código

- Utilizar nombres descriptivos.
- Mantener una responsabilidad por archivo.
- Evitar duplicación de código.
- Utilizar comentarios cortos y descriptivos.


## Convenciones de Modelado

Los modelos de Prisma utilizarán nombres en español.

Ejemplos:

- Rol
- Usuario
- Categoria
- Donacion
- ImagenDonacion
- Solicitud
- Chat
- Mensaje
- Calificacion

Los campos técnicos utilizarán nombres en inglés.

Ejemplos:

- createdAt
- updatedAt
- passwordHash

Los campos funcionales utilizarán nombres en español.

Ejemplos:

- nombre
- descripcion
- ciudad
- estado
- titulo


## Seguridad

- Las contraseñas serán almacenadas mediante hash.
- El correo electrónico será único.
- El teléfono será un dato privado.
- La información personal no será visible para otros usuarios.
- El chat únicamente estará disponible cuando una solicitud haya sido aceptada.


## Principios Técnicos

- Priorizar la simplicidad del desarrollo.
- Mantener una arquitectura escalable.
- Favorecer la reutilización del código.
- Documentar cada funcionalidad antes de implementarla.
- Mantener sincronizada la documentación con el desarrollo del proyecto.