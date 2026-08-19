/**
 * import-remtecnicos.ts
 * Puebla: rem_tecnicos
 * Dependencias: Programacion (por id), Remision (por id), Tercero (por nombreCompleto)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Rem_Tecnicos.csv');

// ── Column resolver ───────────────────────────────────────────────────────────

let _colIndex: Map<string, number> = new Map();

function buildColIndex(header: Record<string, string>) {
  _colIndex = new Map();
  Object.keys(header).forEach((key, idx) => {
    const n = norm(key.trim());
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

/** D/M/YYYY H:MM:SS → Date (UTC) */
function parseDateTime(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const [datePart, timePart] = val.trim().split(' ');
  if (!datePart) return null;
  const [d, m, y] = datePart.split('/');
  if (!d || !m || !y) return null;
  const timeNormalized = (timePart ?? '00:00:00').split(':').map(p => p.padStart(2, '0')).join(':');
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timeNormalized}Z`;
  const dt  = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT REM_TECNICOS');
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

  // ── [1/4] Precargar catálogos ─────────────────────────────────────────────
  console.log('\n[1/4] Precargando catálogos...');

  const programacionSet = new Set(
    (await prisma.programacion.findMany({ select: { id: true } })).map(p => p.id),
  );
  console.log(`  ✓ ${programacionSet.size} programaciones`);

  const remisionSet = new Set(
    (await prisma.remision.findMany({ select: { id: true } })).map(r => r.id),
  );
  console.log(`  ✓ ${remisionSet.size} remisiones`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const k = norm(t.nombreCompleto.trim());
    if (!tercerosByNombre.has(k)) tercerosByNombre.set(k, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  // ── [2/4] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/4] Analizando CSV...');

  const idCount        = new Map<string, number>();
  const programNR      = new Map<string, string[]>();
  const remisionNR     = new Map<string, string[]>();
  const tecnicoNR      = new Map<string, string[]>();
  const registradoNR   = new Map<string, string[]>();
  const editadoNR      = new Map<string, string[]>();

  function incMap(m: Map<string, string[]>, key: string, id: string) {
    const arr = m.get(key) ?? [];
    arr.push(id);
    m.set(key, arr);
  }

  for (const row of rows) {
    const id = getCol(row, 'ID_TECNICOS')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const prog = getCol(row, 'N° PROGRAMACION')?.trim();
    if (prog && !programacionSet.has(prog)) incMap(programNR, prog, id);

    const rem = getCol(row, 'REMISION')?.trim();
    if (rem && !remisionSet.has(rem)) incMap(remisionNR, rem, id);

    const tec = getCol(row, 'NOMBRE TECNICO')?.trim();
    if (tec && !tercerosByNombre.has(norm(tec))) incMap(tecnicoNR, tec, id);

    const reg = getCol(row, 'REGISTRADO POR')?.trim();
    if (reg && !tercerosByNombre.has(norm(reg))) incMap(registradoNR, reg, id);

    const edit = getCol(row, 'EDITADO POR')?.trim();
    if (edit && !tercerosByNombre.has(norm(edit))) incMap(editadoNR, edit, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: Map<string, string[]>) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver (primeros 5):`);
    [...m.entries()].slice(0, 5).forEach(([k, ids]) =>
      console.log(`    - "${k}" (${ids.length} reg.)`));
    if (m.size > 5) console.log(`    ... y ${m.size - 5} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else dupIds.forEach(([id, c]) => console.log(`  ⚠ Duplicado: ${id} (${c}x)`));

  printAnalysis('Programacion', programNR);
  printAnalysis('Remision',     remisionNR);
  printAnalysis('Tecnico',      tecnicoNR);
  printAnalysis('RegistradoPor', registradoNR);
  printAnalysis('EditadoPor',   editadoNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando rem_tecnicos...');
  await prisma.remTecnico.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando rem_tecnicos...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID_TECNICOS')?.trim();
    if (!id) { omitidos++; continue; }

    const progRaw      = getCol(row, 'N° PROGRAMACION')?.trim();
    const programacionId = progRaw && programacionSet.has(progRaw) ? progRaw : null;

    const remRaw     = getCol(row, 'REMISION')?.trim();
    const remisionId = remRaw && remisionSet.has(remRaw) ? remRaw : null;

    const tecRaw    = getCol(row, 'NOMBRE TECNICO')?.trim();
    const tecnicoId = tecRaw ? (tercerosByNombre.get(norm(tecRaw)) ?? null) : null;

    const regRaw        = getCol(row, 'REGISTRADO POR')?.trim();
    const registradoPorId = regRaw ? (tercerosByNombre.get(norm(regRaw)) ?? null) : null;

    const editRaw      = getCol(row, 'EDITADO POR')?.trim();
    const editadoPorId = editRaw ? (tercerosByNombre.get(norm(editRaw)) ?? null) : null;

    const fechaRegistro = parseDateTime(getCol(row, 'FECHA DE REGISTRO'));
    const ultimaEdicion = parseDateTime(getCol(row, 'ULTIMA EDICION'));

    try {
      await prisma.remTecnico.create({
        data: {
          id,
          programacionId,
          remisionId,
          tecnicoId,
          registradoPorId,
          editadoPorId,
          fechaRegistro,
          ultimaEdicion,
        },
      });
      importados++;
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} registros creados`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados               : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)        : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV    : ${dupIds.length}`);
  console.log(`  ⚠ Programacion s/resolver  : ${programNR.size}`);
  console.log(`  ⚠ Remision s/resolver      : ${remisionNR.size}`);
  console.log(`  ⚠ Tecnico s/resolver       : ${tecnicoNR.size}`);
  console.log(`  ⚠ RegistradoPor s/resolver : ${registradoNR.size}`);
  console.log(`  ⚠ EditadoPor s/resolver    : ${editadoNR.size}`);
  console.log(`  ❌ Errores                 : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 10).forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
