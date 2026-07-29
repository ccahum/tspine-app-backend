-- CreateTable
CREATE TABLE "sistemas" (
    "id_producto" TEXT NOT NULL,
    "usuario_id" TEXT,
    "marca_de_tiempo" TIMESTAMP(3),
    "sistema" TEXT,

    CONSTRAINT "sistemas_pkey" PRIMARY KEY ("id_producto")
);

-- AddForeignKey
ALTER TABLE "sistemas" ADD CONSTRAINT "sistemas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
