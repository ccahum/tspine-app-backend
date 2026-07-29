/**
 * import-dettecnicodetalle.ts
 * Puebla: det_tecnicos_detalles
 * Dependencias: DetTecnico, Programacion (por numProgram), Remision (por numRemision), Producto
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(String.raw`C:\Users\ASUS\Desktop\tspine-csv`, 'SistemaTspine1.0 - Det_Tecnicos_Detalle.csv');

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
  const num = Number.parseFloat(val.trim().replaceAll(',', ''));
  return Number.isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT DET_TECNICOS_DETALLES');
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

  const detTecnicosSet = new Set(
    (await prisma.detTecnico.findMany({ select: { id: true } })).map(d => d.id),
  );
  console.log(`  ✓ ${detTecnicosSet.size} det_tecnicos`);

  const programacionesByNumProgram = new Map<string, string>();
  const programacionesById         = new Set<string>();
  const allProgramaciones = await prisma.programacion.findMany({ select: { id: true, numProgram: true } });
  for (const p of allProgramaciones) {
    programacionesById.add(p.id);
    if (p.numProgram) programacionesByNumProgram.set(p.numProgram.trim(), p.id);
  }
  console.log(`  ✓ ${allProgramaciones.length} programaciones`);

  const remisionesByNumRemision = new Map<string, string>();
  const remisionesById          = new Set<string>();
  const allRemisiones = await prisma.remision.findMany({ select: { id: true, numRemision: true } });
  for (const r of allRemisiones) {
    remisionesById.add(r.id);
    if (r.numRemision) remisionesByNumRemision.set(r.numRemision.trim(), r.id);
  }
  console.log(`  ✓ ${allRemisiones.length} remisiones`);

  const productosByRef    = new Map<string, string>();
  const productosByNombre = new Map<string, string>();
  const allProductos = await prisma.producto.findMany({ select: { id: true, referencia: true, nombre: true } });
  for (const p of allProductos) {
    if (p.referencia) productosByRef.set(norm(p.referencia.trim()), p.id);
    if (p.nombre)     productosByNombre.set(norm(p.nombre.trim()), p.id);
  }
  console.log(`  ✓ ${allProductos.length} productos`);

  // ── [2/4] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/4] Analizando CSV...');

  const idCount           = new Map<string, number>();
  const detTecnicosNR     = new Map<string, string[]>();
  const programacionesNR  = new Map<string, string[]>();
  const remisionesNR      = new Map<string, string[]>();
  const productosNR       = new Map<string, string[]>();

  function incMap(m: Map<string, string[]>, key: string, id: string) {
    const arr = m.get(key) ?? [];
    arr.push(id);
    m.set(key, arr);
  }

  let registrosSinProg = 0;
  let registrosSinRem  = 0;

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const detTecnico = getCol(row, 'DET_TECNICOS')?.trim();
    if (detTecnico && !detTecnicosSet.has(detTecnico)) incMap(detTecnicosNR, detTecnico, id);

    const prog = getCol(row, 'NO PROGRAMACION')?.trim();
    if (prog) {
      const progResuelto = programacionesByNumProgram.has(prog) || programacionesById.has(prog);
      if (!progResuelto) { registrosSinProg++; incMap(programacionesNR, prog, id); }
    }

    const rem = getCol(row, 'NO REMISION')?.trim();
    if (rem) {
      const remResuelta = remisionesByNumRemision.has(rem) || remisionesById.has(rem);
      if (!remResuelta) { registrosSinRem++; incMap(remisionesNR, rem, id); }
    }

    const prod = getCol(row, 'PRODUCTO')?.trim();
    if (prod && !productosByRef.has(norm(prod)) && !productosByNombre.has(norm(prod))) incMap(productosNR, prod, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  console.log(`  Registros sin programacion resuelta : ${registrosSinProg}`);
  console.log(`  Registros sin remision resuelta     : ${registrosSinRem}`);

  function printAnalysis(label: string, m: Map<string, string[]>) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver (mostrando primeros 5):`);
    [...m.entries()].slice(0, 5).forEach(([k, ids]) =>
      console.log(`    - "${k}" (${ids.length} registro${ids.length > 1 ? 's' : ''})`));
    if (m.size > 5) console.log(`    ... y ${m.size - 5} más`);
  }

  function printAllUnique(label: string, m: Map<string, string[]>) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    const keys = [...m.keys()];
    console.log(`  ⚠ ${label} sin resolver (${keys.length} únicos, sin duplicados):`);
    keys.forEach(k => console.log(`    - ${k}`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else {
    console.log(`  ⚠ ${dupIds.length} IDs duplicados`);
    dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`));
  }

  printAnalysis('DetTecnico', detTecnicosNR);
  printAllUnique('Programacion', programacionesNR);
  printAllUnique('Remision',     remisionesNR);
  printAnalysis('Producto',     productosNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando det_tecnicos_detalles...');
  await prisma.detTecnicoDetalle.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando det_tecnicos_detalles...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const detTecnicoRaw  = getCol(row, 'DET_TECNICOS')?.trim();
    const detTecnicoId   = detTecnicoRaw && detTecnicosSet.has(detTecnicoRaw) ? detTecnicoRaw : null;

    const progRaw        = getCol(row, 'NO PROGRAMACION')?.trim();
    let programacionId: string | null = null;
    if (progRaw) {
      programacionId = programacionesByNumProgram.get(progRaw) ?? null;
      if (!programacionId && programacionesById.has(progRaw)) programacionId = progRaw;
    }

    const remRaw     = getCol(row, 'NO REMISION')?.trim();
    let remisionId: string | null = null;
    if (remRaw) {
      remisionId = remisionesByNumRemision.get(remRaw) ?? null;
      if (!remisionId && remisionesById.has(remRaw)) remisionId = remRaw;
    }

    const prodRaw        = getCol(row, 'PRODUCTO')?.trim();
    const productoId     = prodRaw
      ? (productosByRef.get(norm(prodRaw)) ?? productosByNombre.get(norm(prodRaw)) ?? null)
      : null;

    try {
      await prisma.detTecnicoDetalle.create({
        data: {
          id,
          detTecnicoId,
          programacionId,
          remisionId,
          productoId,
          valor: parseDecimal(getCol(row, 'VALOR')),
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
  console.log(`  ⚠ DetTecnico s/resolver   : ${detTecnicosNR.size}`);
  console.log(`  ⚠ Programacion s/resolver : ${programacionesNR.size}`);
  console.log(`  ⚠ Remision s/resolver     : ${remisionesNR.size}`);
  console.log(`  ⚠ Producto s/resolver     : ${productosNR.size}`);
  console.log(`  ❌ Errores                : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
