-- CreateTable
CREATE TABLE "tercero_contactos" (
    "id" TEXT NOT NULL,
    "tercero_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dato" TEXT NOT NULL,
    "persona_contacto" TEXT,
    "notas" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tercero_contactos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tercero_contactos" ADD CONSTRAINT "tercero_contactos_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
