-- CreateTable
CREATE TABLE "bancos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "bancos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "no_de_cuenta" TEXT,
    "clabe_interbancaria" TEXT,
    "banco_id" TEXT,
    "tipo_de_cuenta" TEXT,
    "tipo" TEXT,
    "tercero_id" TEXT,
    "tc" BOOLEAN,
    "monto_disponible" DECIMAL(15,2),
    "fecha_de_corte" DATE,
    "saldo_inicial" DECIMAL(15,2),
    "fecha_de_pago" DATE,
    "transferencia_internacional" BOOLEAN,
    "swift_bic" TEXT,
    "banco_destino" TEXT,
    "direccion" TEXT,
    "pais" TEXT,
    "estado" TEXT,
    "sede_id" TEXT,
    "caja_chica" BOOLEAN,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
