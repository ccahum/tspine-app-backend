-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "marca_tiempo" TIMESTAMP(3),
    "registrado_por_id" TEXT,
    "proyecto" TEXT,
    "descripcion" TEXT,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "estado" TEXT,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
