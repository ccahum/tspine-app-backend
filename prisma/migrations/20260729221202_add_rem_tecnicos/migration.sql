-- CreateTable
CREATE TABLE "rem_tecnicos" (
    "id_tecnico" TEXT NOT NULL,
    "programacion_id" TEXT,
    "remision_id" TEXT,
    "tecnico_id" TEXT,
    "registrado_por_id" TEXT,
    "editado_por_id" TEXT,
    "fecha_registro" TIMESTAMP(3),
    "ultima_edicion" TIMESTAMP(3),

    CONSTRAINT "rem_tecnicos_pkey" PRIMARY KEY ("id_tecnico")
);

-- AddForeignKey
ALTER TABLE "rem_tecnicos" ADD CONSTRAINT "rem_tecnicos_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rem_tecnicos" ADD CONSTRAINT "rem_tecnicos_remision_id_fkey" FOREIGN KEY ("remision_id") REFERENCES "remisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rem_tecnicos" ADD CONSTRAINT "rem_tecnicos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rem_tecnicos" ADD CONSTRAINT "rem_tecnicos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rem_tecnicos" ADD CONSTRAINT "rem_tecnicos_editado_por_id_fkey" FOREIGN KEY ("editado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
