# Chat

## Objetivo

Permitir la comunicación privada entre el donante y el receptor una vez que una solicitud haya sido aceptada, facilitando la coordinación de la entrega de la donación de forma segura y organizada.


## Descripción

Este módulo administra las conversaciones privadas entre usuarios. El chat se generará automáticamente cuando el donante acepte una solicitud y únicamente podrán participar los usuarios involucrados en la donación.

Su finalidad es coordinar la entrega del artículo sin exponer información personal de los usuarios.


## Tecnologías

- Next.js 16.2.10
- TypeScript 5.9.3
- PostgreSQL 16.x
- Prisma ORM 7.8.0


## Requisitos Funcionales

**RF-001** Crear automáticamente un chat cuando una solicitud sea aceptada.

**RF-002** Permitir el envío de mensajes entre el donante y el receptor.

**RF-003** Consultar el historial de mensajes.

**RF-004** Mostrar la fecha y hora de cada mensaje.

**RF-005** Permitir visualizar la lista de conversaciones activas.


## Reglas de Negocio

**RN-001** El chat solo se creará cuando una solicitud haya sido aceptada.

**RN-002** Solo el donante y el receptor podrán acceder al chat.

**RN-003** No se permitirá iniciar conversaciones manualmente.

**RN-004** Cada solicitud aceptada generará un único chat.

**RN-005** Los mensajes enviados permanecerán registrados como historial de la conversación.

**RN-006** El chat estará asociado a una única donación.

**RN-007** Los mensajes enviados no podrán ser editados ni eliminados.

**RN-008** El chat permanecerá disponible como historial incluso después de que la donación haya sido entregada.

## Modelo de Datos

### Tablas principales

- Chat
- Mensaje
- Usuario
- Solicitud
- Donacion


## API

| Método | Endpoint | Descripción |
|---------|----------|-------------|
| GET | /api/chats | Consultar conversaciones |
| GET | /api/chats/{id} | Consultar una conversación |
| POST | /api/chats/{id}/mensajes | Enviar mensaje |
| GET | /api/chats/{id}/mensajes | Consultar mensajes |


## Estado

⏳ Pendiente


## Observaciones

El chat constituye el único medio de comunicación entre el donante y el receptor dentro de DonApp. Su propósito es facilitar la coordinación de la entrega de la donación sin compartir información personal de los usuarios.