ALTER TABLE "Donacion"
ADD COLUMN "clientId" UUID;

CREATE UNIQUE INDEX "Donacion_propietarioId_clientId_key"
ON "Donacion"("propietarioId", "clientId");
