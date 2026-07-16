-- CreateEnum
CREATE TYPE "RolCodigo" AS ENUM ('ADMIN', 'USUARIO');

-- CreateEnum
CREATE TYPE "EstadoDonacion" AS ENUM ('PUBLICADA', 'RESERVADA', 'ENTREGADA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "CausaCancelacionSolicitud" AS ENUM ('VOLUNTARIA', 'OTRA_SOLICITUD_ACEPTADA', 'DONACION_RETIRADA', 'USUARIO_INACTIVO');

-- CreateEnum
CREATE TYPE "AccionAuditoriaAdministrativa" AS ENUM ('USUARIO_DESACTIVADO', 'USUARIO_REACTIVADO', 'SESIONES_REVOCADAS', 'DONACION_RESERVADA_RETIRADA', 'CALIFICACION_PENDIENTE_EXIMIDA');

-- AlterTable
ALTER TABLE "Rol" ADD COLUMN     "codigo" "RolCodigo" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "nombre",
ADD COLUMN     "ciudad" TEXT NOT NULL,
ADD COLUMN     "fotoPerfil" VARCHAR(500),
ADD COLUMN     "nombreCompleto" TEXT NOT NULL,
ADD COLUMN     "nombreVisible" VARCHAR(30) NOT NULL;

-- CreateTable
CREATE TABLE "Sesion" (
    "id" UUID NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(250),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donacion" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(1000) NOT NULL,
    "ciudad" TEXT NOT NULL,
    "estado" "EstadoDonacion" NOT NULL DEFAULT 'PUBLICADA',
    "propietarioId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "solicitudAceptadaId" INTEGER,
    "donanteConfirmoAt" TIMESTAMP(3),
    "receptorConfirmoAt" TIMESTAMP(3),
    "entregadaAt" TIMESTAMP(3),
    "retiradaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagenDonacion" (
    "id" SERIAL NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "ImagenDonacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" SERIAL NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "solicitanteId" INTEGER NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "causaCancelacion" "CausaCancelacionSolicitud",
    "aceptadaAt" TIMESTAMP(3),
    "rechazadaAt" TIMESTAMP(3),
    "canceladaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "ultimoMensajeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "remitenteId" INTEGER NOT NULL,
    "contenido" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calificacion" (
    "id" SERIAL NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExencionCalificacion" (
    "id" SERIAL NOT NULL,
    "donacionId" INTEGER NOT NULL,
    "administradorId" INTEGER NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExencionCalificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaAdministrativa" (
    "id" SERIAL NOT NULL,
    "administradorId" INTEGER NOT NULL,
    "accion" "AccionAuditoriaAdministrativa" NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaAdministrativa_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
ALTER TABLE "Calificacion"
ADD CONSTRAINT "Calificacion_puntuacion_check"
CHECK ("puntuacion" BETWEEN 1 AND 5);

-- AddCheckConstraint
ALTER TABLE "ImagenDonacion"
ADD CONSTRAINT "ImagenDonacion_orden_check"
CHECK ("orden" >= 1);

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_refreshTokenHash_key" ON "Sesion"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_revokedAt_expiresAt_idx" ON "Sesion"("usuarioId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "Sesion_expiresAt_idx" ON "Sesion"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE INDEX "Categoria_activo_nombre_idx" ON "Categoria"("activo", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Donacion_solicitudAceptadaId_key" ON "Donacion"("solicitudAceptadaId");

-- CreateIndex
CREATE INDEX "Donacion_estado_ciudad_createdAt_id_idx" ON "Donacion"("estado", "ciudad", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Donacion_propietarioId_estado_createdAt_id_idx" ON "Donacion"("propietarioId", "estado", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Donacion_categoriaId_estado_ciudad_createdAt_id_idx" ON "Donacion"("categoriaId", "estado", "ciudad", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ImagenDonacion_donacionId_orden_key" ON "ImagenDonacion"("donacionId", "orden");

-- CreateIndex
CREATE INDEX "Solicitud_solicitanteId_estado_createdAt_id_idx" ON "Solicitud"("solicitanteId", "estado", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Solicitud_donacionId_estado_createdAt_id_idx" ON "Solicitud"("donacionId", "estado", "createdAt" DESC, "id" DESC);

-- CreatePartialIndex
CREATE UNIQUE INDEX "Solicitud_una_aceptada_por_donacion_key"
ON "Solicitud"("donacionId")
WHERE "estado" = 'ACEPTADA';

-- CreatePartialIndex
CREATE UNIQUE INDEX "Solicitud_activa_por_donacion_solicitante_key"
ON "Solicitud"("donacionId", "solicitanteId")
WHERE "estado" IN ('PENDIENTE', 'ACEPTADA');

-- CreateIndex
CREATE UNIQUE INDEX "Chat_solicitudId_key" ON "Chat"("solicitudId");

-- CreateIndex
CREATE INDEX "Chat_ultimoMensajeAt_createdAt_id_idx" ON "Chat"("ultimoMensajeAt" DESC, "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Mensaje_chatId_createdAt_id_idx" ON "Mensaje"("chatId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Mensaje_remitenteId_idx" ON "Mensaje"("remitenteId");

-- CreateIndex
CREATE UNIQUE INDEX "Calificacion_donacionId_key" ON "Calificacion"("donacionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExencionCalificacion_donacionId_key" ON "ExencionCalificacion"("donacionId");

-- CreateIndex
CREATE INDEX "ExencionCalificacion_administradorId_createdAt_id_idx" ON "ExencionCalificacion"("administradorId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "AuditoriaAdministrativa_administradorId_createdAt_id_idx" ON "AuditoriaAdministrativa"("administradorId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "AuditoriaAdministrativa_accion_createdAt_id_idx" ON "AuditoriaAdministrativa"("accion", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "AuditoriaAdministrativa_entidad_entidadId_createdAt_id_idx" ON "AuditoriaAdministrativa"("entidad", "entidadId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "AuditoriaAdministrativa_createdAt_id_idx" ON "AuditoriaAdministrativa"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_codigo_key" ON "Rol"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nombreVisible_key" ON "Usuario"("nombreVisible");

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donacion" ADD CONSTRAINT "Donacion_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donacion" ADD CONSTRAINT "Donacion_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donacion" ADD CONSTRAINT "Donacion_solicitudAceptadaId_fkey" FOREIGN KEY ("solicitudAceptadaId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagenDonacion" ADD CONSTRAINT "ImagenDonacion_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "Donacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "Donacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "Donacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExencionCalificacion" ADD CONSTRAINT "ExencionCalificacion_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "Donacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExencionCalificacion" ADD CONSTRAINT "ExencionCalificacion_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaAdministrativa" ADD CONSTRAINT "AuditoriaAdministrativa_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
