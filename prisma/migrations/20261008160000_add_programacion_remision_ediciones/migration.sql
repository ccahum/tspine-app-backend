-- CreateTable
CREATE TABLE "programacion_ediciones" (
    "id" TEXT NOT NULL,
    "programacion_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "editado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programacion_ediciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remision_ediciones" (
    "id" TEXT NOT NULL,
    "remision_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "editado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remision_ediciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "programacion_ediciones" ADD CONSTRAINT "programacion_ediciones_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "programacion_ediciones" ADD CONSTRAINT "programacion_ediciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remision_ediciones" ADD CONSTRAINT "remision_ediciones_remision_id_fkey" FOREIGN KEY ("remision_id") REFERENCES "remisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "remision_ediciones" ADD CONSTRAINT "remision_ediciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
