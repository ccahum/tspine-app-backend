-- CreateTable
CREATE TABLE "programacion_pagos" (
    "id" TEXT NOT NULL,
    "marca_tiempo" TIMESTAMP(3),
    "fecha_origen_movimiento" DATE,
    "fecha_pago" DATE,
    "programado_por_id" TEXT,
    "beneficiario_gasto_id" TEXT,
    "beneficiario_pago_id" TEXT,
    "folio_relacionado" TEXT,
    "tipo" TEXT,
    "proviene_de" TEXT,
    "folio_gasto_id" TEXT,
    "folio_compra_id" TEXT,
    "folio_comisiones_id" TEXT,
    "folio_mir_id" TEXT,
    "segmentador" TEXT,
    "tipo_de_pago" TEXT,
    "cuenta_contable" TEXT,
    "folio_caja_id" TEXT,
    "comision" DECIMAL(15,2),
    "sede" TEXT,

    CONSTRAINT "programacion_pagos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "programacion_pagos" ADD CONSTRAINT "programacion_pagos_programado_por_id_fkey" FOREIGN KEY ("programado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_pagos" ADD CONSTRAINT "programacion_pagos_beneficiario_gasto_id_fkey" FOREIGN KEY ("beneficiario_gasto_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_pagos" ADD CONSTRAINT "programacion_pagos_beneficiario_pago_id_fkey" FOREIGN KEY ("beneficiario_pago_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_pagos" ADD CONSTRAINT "programacion_pagos_folio_gasto_id_fkey" FOREIGN KEY ("folio_gasto_id") REFERENCES "gastos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_pagos" ADD CONSTRAINT "programacion_pagos_folio_compra_id_fkey" FOREIGN KEY ("folio_compra_id") REFERENCES "compras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_pagos" ADD CONSTRAINT "programacion_pagos_folio_comisiones_id_fkey" FOREIGN KEY ("folio_comisiones_id") REFERENCES "det_tecnicos"("id_det_tecnico") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_pagos" ADD CONSTRAINT "programacion_pagos_folio_mir_id_fkey" FOREIGN KEY ("folio_mir_id") REFERENCES "mir"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_pagos" ADD CONSTRAINT "programacion_pagos_folio_caja_id_fkey" FOREIGN KEY ("folio_caja_id") REFERENCES "movimientos_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
