/**
 * import-dettecnicos.ts
 * Puebla: det_tecnicos
 * Dependencias: Programacion, Tercero (tecnico), Remision
 * Omitidos (denormalizados): FECHA QX, DOCTOR, HOSPITAL, CONSUMO, NOMBRE DEL PACIENTE
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma   = new PrismaClient();
const CSV_PATH = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine1.0 - Det_Tecnicos.csv');

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

function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function parseBool(val: string | undefined): boolean | null {
  if (!val || val.trim() === '') return null;
  const v = val.trim().toUpperCase();
  if (v === 'TRUE' || v === 'SI' || v === 'YES' || v === '1') return true;
  if (v === 'FALSE' || v === 'NO' || v === '0') return false;
  return null;
}

/** Porcentaje: "16.00%" → 16.00 */
function parsePorcentaje(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace('%', '').trim());
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT DET_TECNICOS');
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

  const programacionesSet = new Set(
    (await prisma.programacion.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${programacionesSet.size} programaciones`);

  const remisionesSet = new Set(
    (await prisma.remision.findMany({ select: { id: true } })).map(r => r.id)
  );
  console.log(`  ✓ ${remisionesSet.size} remisiones`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  // ── [2/4] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/4] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedEntry = { id: string; programacion: string };
  type UnresolvedMap   = Map<string, UnresolvedEntry[]>;
  const programacionesNR: UnresolvedMap = new Map();
  const remisionesNR:     UnresolvedMap = new Map();
  const tecnicosNR:       UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string, programacion: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push({ id, programacion });
  }

  for (const row of rows) {
    const id = getCol(row, 'ID_TECNICOS')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const prog = getCol(row, 'N° PROGRAMACION')?.trim() ?? '';

    const programacion = getCol(row, 'N° PROGRAMACION')?.trim();
    if (programacion && !programacionesSet.has(programacion)) incMap(programacionesNR, programacion, id, prog);

    const remision = getCol(row, 'NO REMISION')?.trim();
    if (remision && !remisionesSet.has(remision)) incMap(remisionesNR, remision, id, prog);

    const tecnico = getCol(row, 'NOMBRE TECNICO')?.trim();
    if (tecnico && !tercerosByNombre.has(norm(tecnico.toLowerCase()))) incMap(tecnicosNR, tecnico, id, prog);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, entries]) => {
      console.log(`    - "${k}" (${entries.length} registro${entries.length > 1 ? 's' : ''})`);
      entries.forEach(({ id, programacion }) => console.log(`        · ${id.padEnd(10)}  prog: ${programacion}`));
    });
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Programacion', programacionesNR);
  printAnalysis('Remision',     remisionesNR);
  printAnalysis('Tecnico',      tecnicosNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando det_tecnicos...');
  await prisma.detTecnico.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando det_tecnicos...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID_TECNICOS')?.trim();
    if (!id) { omitidos++; continue; }

    const programacionRaw = getCol(row, 'N° PROGRAMACION')?.trim();
    const programacionId  = programacionRaw && programacionesSet.has(programacionRaw) ? programacionRaw : null;

    const remisionRaw = getCol(row, 'NO REMISION')?.trim();
    const remisionId  = remisionRaw && remisionesSet.has(remisionRaw) ? remisionRaw : null;

    const tecnicoRaw = getCol(row, 'NOMBRE TECNICO')?.trim();
    const tecnicoId  = tecnicoRaw
      ? (tercerosByNombre.get(norm(tecnicoRaw.toLowerCase())) ?? null)
      : null;

    try {
      await prisma.detTecnico.create({
        data: {
          id,
          programacionId,
          categoria:        getCol(row, 'CATEGORIA')?.trim()          || null,
          tipo:             getCol(row, 'TIPO')?.trim()               || null,
          tecnicoId,
          vrComision:       parseDecimal(getCol(row, 'V/R COMIS. O BONIFIC.')),
          observaciones:    getCol(row, 'OBSERVACIONES')?.trim()      || null,
          estadoActual:     parseBool(getCol(row, 'ESTADO ACTUAL')),
          esProgramacion:   parseBool(getCol(row, 'PROGRAMACION')),
          remisionId,
          quieresDesglosar: parseBool(getCol(row, '¿QUIERES DESGLOSAR?')),
          seleccioneTipo:   getCol(row, 'SELECCIONE TIPO')?.trim()    || null,
          agregarIva:       parseBool(getCol(row, '¿AGREGAR IVA?')),
          cargarPorcentaje: parsePorcentaje(getCol(row, 'CARGAR %')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} registros creados`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados              : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)       : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV   : ${dupIds.length}`);
  console.log(`  ⚠ Programacion s/resolver : ${programacionesNR.size}`);
  console.log(`  ⚠ Remision s/resolver     : ${remisionesNR.size}`);
  console.log(`  ⚠ Tecnico s/resolver      : ${tecnicosNR.size}`);
  console.log(`  ❌ Errores                : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
