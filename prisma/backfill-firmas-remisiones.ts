/**
 * backfill-firmas-remisiones.ts
 *
 * Corrige remisiones cuya firma se guardó mal: createRemision() guardaba el data URL en base64
 * (tal cual lo manda SignaturePad) directo en la columna `firma`, en vez de escribirlo como archivo
 * en uploads/firmas/ y guardar esa ruta relativa — por eso firmaDisponible (que revisa si el
 * archivo existe en disco) siempre daba false y el detalle de Remisión mostraba "No disponible"
 * aunque sí se hubiera firmado.
 *
 * Esto NO toca las remisiones importadas del histórico de AppSheet: ahí la columna FIRMA trae una
 * referencia a Drive (no un data URL), así que no hay nada que decodificar — esas dependen del
 * proceso de recuperación de archivos de Drive que ya se lleva aparte. Este script solo actúa sobre
 * valores que literalmente empiezan con "data:" (inconfundible con una referencia de Drive).
 *
 * Uso: npx ts-node prisma/backfill-firmas-remisiones.ts
 */

import { PrismaClient } from '@prisma/client';
import { decodeBase64DataUrl, extensionFromMime, mimeFromDataUrl, saveUploadFile, uploadFileExists } from '../src/commons/file-storage.utils';

const prisma = new PrismaClient();

async function main() {
  console.log('═'.repeat(60));
  console.log('  BACKFILL FIRMAS DE REMISIONES (base64 crudo → archivo)');
  console.log('═'.repeat(60));

  const remisiones = await prisma.remision.findMany({
    where: { firma: { startsWith: 'data:' } },
    select: { id: true, firma: true },
  });

  console.log(`  Encontradas ${remisiones.length} remisiones con firma en base64 crudo.\n`);

  let corregidas = 0;
  let fallidas = 0;

  for (const r of remisiones) {
    try {
      if (uploadFileExists(r.firma)) {
        // No debería pasar (un base64 nunca es una ruta válida), pero por si acaso no se pisa nada.
        console.log(`  -  ${r.id}: ya resuelve a un archivo existente, se deja igual`);
        continue;
      }
      const extension = extensionFromMime(mimeFromDataUrl(r.firma!));
      const rutaRelativa = saveUploadFile('firmas', `${r.id}.${extension}`, decodeBase64DataUrl(r.firma!));
      await prisma.remision.update({ where: { id: r.id }, data: { firma: rutaRelativa } });
      console.log(`  ✓  ${r.id} → ${rutaRelativa}`);
      corregidas++;
    } catch (e) {
      console.log(`  ⚠  ${r.id}: no se pudo procesar (${(e as Error).message})`);
      fallidas++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  Corregidas: ${corregidas}  |  Fallidas: ${fallidas}  |  Total revisadas: ${remisiones.length}`);
  console.log('═'.repeat(60));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
