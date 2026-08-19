-- CreateTable
CREATE TABLE "documentos_programacion" (
    "id" TEXT NOT NULL,
    "programacion_id" TEXT,
    "nombre" TEXT,
    "documento" TEXT,
    "cargado_el" TIMESTAMP(3),
    "cargado_por_id" TEXT,

    CONSTRAINT "documentos_programacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documentos_programacion" ADD CONSTRAINT "documentos_programacion_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_programacion" ADD CONSTRAINT "documentos_programacion_cargado_por_id_fkey" FOREIGN KEY ("cargado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
