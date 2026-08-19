/**
 * import-documentosprogramacion.ts
 * Puebla: documentos_programacion
 * Dependencias: Programacion, Tercero (cargadoPor)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - DocumentosProgramacion.csv');

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

// ── Parsers ───────────────────────────────────────────────────────────────────

/** D/M/YYYY H:MM:SS — tratado como UTC para evitar desfase de zona */
function parseDateTime(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const [datePart, timePart] = val.trim().split(' ');
  if (!datePart) return null;
  const [d, m, y] = datePart.split('/');
  if (!d || !m || !y) return null;
  const timeNormalized = (timePart ?? '00:00:00').split(':').map(p => p.padStart(2, '0')).join(':');
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timeNormalized}Z`;
  const dt  = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT DOCUMENTOS PROGRAMACIÓN');
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

  // ── [1/3] Precargar catálogos ─────────────────────────────────────────────
  console.log('\n[1/3] Precargando catálogos...');

  const programacionesSet = new Set(
    (await prisma.programacion.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${programacionesSet.size} programaciones`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();
  const programacionesNR = new Map<string, string[]>();
  const cargadoPorNR = new Map<string, string[]>();

  function incMap(m: Map<string, string[]>, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'Id')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const program = getCol(row, 'Programacion')?.trim();
    if (program && !programacionesSet.has(program)) incMap(programacionesNR, program, id);

    const cargadoPor = getCol(row, 'Cargado por')?.trim();
    if (cargadoPor && !tercerosByNombre.has(norm(cargadoPor.toLowerCase()))) incMap(cargadoPorNR, cargadoPor, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  if (programacionesNR.size === 0) console.log('  ✓ Todas las Programación resueltas');
  else {
    console.log(`  ⚠ ${programacionesNR.size} Programación sin resolver:`);
    [...programacionesNR.entries()].slice(0, 10).forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
    if (programacionesNR.size > 10) console.log(`    ... y ${programacionesNR.size - 10} más`);
  }

  if (cargadoPorNR.size === 0) console.log('  ✓ Todos los Cargado por resueltos');
  else {
    console.log(`  ⚠ ${cargadoPorNR.size} Cargado por sin resolver:`);
    [...cargadoPorNR.entries()].slice(0, 10).forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
    if (cargadoPorNR.size > 10) console.log(`    ... y ${cargadoPorNR.size - 10} más`);
  }

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando documentos_programacion...');
  await prisma.documentoProgramacion.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'Id')?.trim();
    if (!id) { omitidos++; continue; }

    const programRaw = getCol(row, 'Programacion')?.trim();
    const programacionId = programRaw && programacionesSet.has(programRaw) ? programRaw : null;

    const cargadoPorRaw = getCol(row, 'Cargado por')?.trim();
    const cargadoPorId  = cargadoPorRaw
      ? (tercerosByNombre.get(norm(cargadoPorRaw.toLowerCase())) ?? null)
      : null;

    try {
      await prisma.documentoProgramacion.create({
        data: {
          id,
          programacionId,
          nombre:    getCol(row, 'Nombre')?.trim()    || null,
          documento: getCol(row, 'Documento')?.trim() || null,
          cargadoEl: parseDateTime(getCol(row, 'Cargado el')),
          cargadoPorId,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} documentos creados`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados            : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)     : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV : ${dupIds.length}`);
  console.log(`  ❌ Errores              : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
