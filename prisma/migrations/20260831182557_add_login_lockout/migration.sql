-- AlterTable
ALTER TABLE "terceros" ADD COLUMN     "bloqueado_hasta" TIMESTAMP(3),
ADD COLUMN     "intentos_fallidos_login" INTEGER NOT NULL DEFAULT 0;
