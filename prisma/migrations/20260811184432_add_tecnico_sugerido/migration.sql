-- CreateTable
CREATE TABLE "tecnicos_sugeridos" (
    "id" TEXT NOT NULL,
    "programacion_id" TEXT NOT NULL,
    "tecnico_id" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrado_por_id" TEXT,

    CONSTRAINT "tecnicos_sugeridos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tecnicos_sugeridos" ADD CONSTRAINT "tecnicos_sugeridos_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tecnicos_sugeridos" ADD CONSTRAINT "tecnicos_sugeridos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "terceros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tecnicos_sugeridos" ADD CONSTRAINT "tecnicos_sugeridos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
