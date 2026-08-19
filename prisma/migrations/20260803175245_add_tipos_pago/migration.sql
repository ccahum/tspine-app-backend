-- CreateTable
CREATE TABLE "tipos_pago" (
    "id" TEXT NOT NULL,
    "clasificacion_id" TEXT,
    "descripcion" TEXT,
    "frecuencia" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "tipos_pago_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tipos_pago" ADD CONSTRAINT "tipos_pago_clasificacion_id_fkey" FOREIGN KEY ("clasificacion_id") REFERENCES "clasificaciones_gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
