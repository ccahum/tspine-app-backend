-- DropForeignKey
ALTER TABLE "det_requisiciones" DROP CONSTRAINT "det_requisiciones_movimiento_id_fkey";

-- AddForeignKey
ALTER TABLE "det_requisiciones" ADD CONSTRAINT "det_requisiciones_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "requisiciones"("id_movimiento") ON DELETE CASCADE ON UPDATE CASCADE;
