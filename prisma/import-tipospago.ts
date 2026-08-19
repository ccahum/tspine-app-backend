/**
 * import-tipospago.ts
 * Puebla: tipos_pago
 * Dependencias: ClasificacionGasto (clasificacion) — el catálogo se enriquece
 *               sobre la marcha con valores nuevos encontrados en este CSV.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - TiposPago.csv');

// ── Column resolver ───────────────────────────────────────────────────────────

let _colIndex: Map<string, number> = new Map();

function buildColIndex(header: Record<string, string>) {
  _colIndex = new Map();
  Object.keys(header).forEach((key, idx) => {
    const n = key.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!_colIndex.has(n)) _colIndex.set(n, idx);
  });
}

function norm(name: string): string {
  return name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getCol(row: Record<string, string>, name: string): string | undefined {
  const idx = _colIndex.get(norm(name));
  if (idx === undefined) return undefined;
  return Object.values(row)[idx];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT TIPOS DE PAGO');
  console.log('═'.repeat(60));

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌ CSV no encontrado: ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows: Record<string, string>[] = parse(content, {
    columns:            true,
    skip_empty_lines:   true,
    relax_quotes:       true,
    relax_column_count: true,
    bom:                true,
  });

  if (rows.length > 0) buildColIndex(rows[0]);
  console.log(`\n📂 CSV cargado: ${rows.length} filas`);

  // ── [1/3] Precargar / enriquecer ClasificacionGasto ───────────────────────
  console.log('\n[1/3] Precargando y enriqueciendo ClasificacionGasto...');

  const clasificacionesSet = new Set(
    (await prisma.clasificacionGasto.findMany({ select: { id: true } })).map(c => c.id)
  );
  console.log(`  ✓ ${clasificacionesSet.size} clasificaciones ya existentes`);

  let enriquecidas = 0;
  for (const row of rows) {
    const clasificacion = getCol(row, 'CLASIFICACIÓN')?.trim();
    if (!clasificacion || clasificacionesSet.has(clasificacion)) continue;
    await prisma.clasificacionGasto.create({ data: { id: clasificacion, clasificacion } });
    clasificacionesSet.add(clasificacion);
    enriquecidas++;
    console.log(`  + "${clasificacion}" (nueva)`);
  }
  console.log(`  ✓ ${enriquecidas} clasificaciones nuevas agregadas`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();
  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);
  }
  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);
  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando tipos_pago...');
  await prisma.tipoPago.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const clasificacionRaw = getCol(row, 'CLASIFICACIÓN')?.trim();
    const clasificacionId  = clasificacionRaw && clasificacionesSet.has(clasificacionRaw) ? clasificacionRaw : null;

    try {
      await prisma.tipoPago.create({
        data: {
          id,
          clasificacionId,
          descripcion:   getCol(row, 'DESCRIPCIÓN')?.trim() || null,
          frecuencia:    getCol(row, 'FRECUENCIA')?.trim() || null,
          observaciones: getCol(row, 'OBSERVACIONES')?.trim() || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} tipos de pago creados`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados             : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)      : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV  : ${dupIds.length}`);
  console.log(`  + Clasificaciones nuevas : ${enriquecidas}`);
  console.log(`  ❌ Errores               : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
