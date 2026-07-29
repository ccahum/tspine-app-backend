/**
 * import-marcas.ts
 * Puebla: marcas
 * Sin dependencias de otras tablas
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma   = new PrismaClient();
const CSV_PATH = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine1.0 - Marcas.csv');

// ── Column resolver ───────────────────────────────────────────────────────────

let _colIndex: Map<string, number> = new Map();

function buildColIndex(header: Record<string, string>) {
  _colIndex = new Map();
  Object.keys(header).forEach((key, idx) => {
    const n = key.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!_colIndex.has(n)) _colIndex.set(n, idx);
  });
}

function getCol(row: Record<string, string>, name: string): string | undefined {
  const norm = name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const idx  = _colIndex.get(norm);
  if (idx === undefined) return undefined;
  return Object.values(row)[idx];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT MARCAS');
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

  // ── [1/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[1/3] Analizando CSV...');

  const idCount    = new Map<string, number>();
  const nombreNorm = new Map<string, string>(); // nombreNormalizado → id original
  const dupIds:       string[] = [];
  const dupNombres:   string[] = [];
  const sospechosos:  string[] = [];

  const SOSPECHOSOS_PATTERN = /^[.\-_\/\\N\/A]+$/i;

  for (const row of rows) {
    const id     = getCol(row, 'ID MARCA')?.trim();
    const nombre = getCol(row, 'MARCA')?.trim();
    if (!id) continue;

    // Duplicados por ID
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    // Duplicados por nombre (normalizado: sin tildes, minúsculas, sin espacios/puntos extra)
    if (nombre) {
      const norm = nombre.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[\s.]/g, '');
      if (nombreNorm.has(norm)) {
        dupNombres.push(`"${nombre}" (${id})  ↔  "${getCol(rows.find(r => getCol(r, 'ID MARCA')?.trim() === nombreNorm.get(norm))!, 'MARCA')?.trim()}" (${nombreNorm.get(norm)})`);
      } else {
        nombreNorm.set(norm, id);
      }

      // Registros sospechosos (solo puntos, N/A, etc.)
      if (SOSPECHOSOS_PATTERN.test(nombre) || nombre.length <= 1) {
        sospechosos.push(`${id} → "${nombre}"`);
      }
    }
  }

  for (const [id, count] of idCount.entries()) {
    if (count > 1) dupIds.push(`${id} (${count}x)`);
  }

  if (dupIds.length === 0)      console.log('  ✓ Sin IDs duplicados en CSV');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(d => console.log(`    - ${d}`)); }

  if (dupNombres.length === 0)  console.log('  ✓ Sin nombres similares detectados');
  else { console.log(`  ⚠ ${dupNombres.length} nombres similares (posibles duplicados):`); dupNombres.forEach(d => console.log(`    - ${d}`)); }

  if (sospechosos.length === 0) console.log('  ✓ Sin registros sospechosos');
  else { console.log(`  ⚠ ${sospechosos.length} registros sospechosos:`); sospechosos.forEach(d => console.log(`    - ${d}`)); }

  // ── [2/3] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[2/3] Truncando marcas...');
  await prisma.marca.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [3/3] Importar ────────────────────────────────────────────────────────
  console.log('\n[3/3] Importando marcas...');

  let importadas = 0;
  let omitidas   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID MARCA')?.trim();
    if (!id) { omitidas++; continue; }

    try {
      await prisma.marca.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          marca: getCol(row, 'MARCA')?.trim() || null,
        },
      });
      importadas++;
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importadas            : ${importadas}`);
  console.log(`  ✗ Omitidas (sin ID)     : ${omitidas}`);
  console.log(`  ⚠ IDs duplicados en CSV : ${dupIds.length}`);
  console.log(`  ⚠ Nombres similares     : ${dupNombres.length}`);
  console.log(`  ⚠ Sospechosos           : ${sospechosos.length}`);
  console.log(`  ❌ Errores              : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores de inserción:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
