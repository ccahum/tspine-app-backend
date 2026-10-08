-- AlterTable: la última edición pasa a vivir en cotizacion_ediciones (un registro por edición)
-- en vez de estos dos campos (que solo guardaban la última).
ALTER TABLE "cotizaciones" DROP CONSTRAINT IF EXISTS "cotizaciones_editado_por_id_fkey";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "editado_por_id";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "editado_en";

-- CreateTable
CREATE TABLE "cotizacion_ediciones" (
    "id" TEXT NOT NULL,
    "cotizacion_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "editado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotizacion_ediciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cotizacion_ediciones" ADD CONSTRAINT "cotizacion_ediciones_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cotizacion_ediciones" ADD CONSTRAINT "cotizacion_ediciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
