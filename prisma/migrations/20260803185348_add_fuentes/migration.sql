-- CreateTable
CREATE TABLE "fuentes" (
    "id" TEXT NOT NULL,
    "marca_tiempo" TIMESTAMP(3),
    "programacion_id" TEXT,
    "gasto_id" TEXT,
    "monto" DECIMAL(15,2),
    "registrado_por_id" TEXT,

    CONSTRAINT "fuentes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fuentes" ADD CONSTRAINT "fuentes_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuentes" ADD CONSTRAINT "fuentes_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gastos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuentes" ADD CONSTRAINT "fuentes_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
