-- CreateTable
CREATE TABLE "tercero_totp" (
    "tercero_id" TEXT NOT NULL,
    "secreto" TEXT NOT NULL,
    "activado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tercero_totp_pkey" PRIMARY KEY ("tercero_id")
);

-- AddForeignKey
ALTER TABLE "tercero_totp" ADD CONSTRAINT "tercero_totp_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
