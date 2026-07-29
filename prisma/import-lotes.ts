/**
 * import-lotes.ts
 * Puebla: lotes
 * Sin dependencias de otras tablas
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma   = new PrismaClient();
const CSV_PATH = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine1.0 - Lote.csv');

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

// ── Parser de fecha DD/MM/YYYY ────────────────────────────────────────────────

function parseDate(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const [d, m, y] = val.trim().split('/');
  if (!d || !m || !y) return null;
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT LOTES');
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

  // ── Análisis previo ───────────────────────────────────────────────────────
  console.log('\n[1/3] Analizando CSV...');
  const idCount = new Map<string, number>();
  for (const row of rows) {
    const id = getCol(row, 'IDLOTE')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);
  }
  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);
  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else {
    console.log(`  ⚠ ${dupIds.length} IDs duplicados:`);
    dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`));
  }

  // ── Truncar ───────────────────────────────────────────────────────────────
  console.log('\n[2/3] Truncando lotes...');
  await prisma.lote.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── Importar ──────────────────────────────────────────────────────────────
  console.log('\n[3/3] Importando lotes...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'IDLOTE')?.trim();
    if (!id) { omitidos++; continue; }

    try {
      await prisma.lote.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          lote:           getCol(row, 'LOTE')?.trim()               || null,
          fechaRegistro:  parseDate(getCol(row, 'FECHA DE REGISTRO')),
          fechaCaducidad: parseDate(getCol(row, 'FECHA DE CADUCIDAD')),
          fechaAlerta:    parseDate(getCol(row, 'FECHA DE ALERTA')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados            : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)     : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV : ${dupIds.length}`);
  console.log(`  ❌ Errores              : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores de inserción:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
