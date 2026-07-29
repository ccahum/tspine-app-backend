/**
 * import-notacredito.ts
 * Puebla: notas_credito
 * Dependencias: Factura, Tercero (aplicadaPor)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma   = new PrismaClient();
const CSV_PATH = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine1.0 - NotaCredito.csv');

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
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timePart ?? '00:00:00'}Z`;
  const dt  = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

/** D/M/YYYY */
function parseDate(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const parts = val.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const dt  = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Número con comas de miles: "60,102.08" → 60102.08 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/** Porcentaje: "12.00%" → 12.00  |  "0.00%" → 0  |  "" → null */
function parsePorcentaje(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace('%', '').trim());
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT NOTA CRÉDITO');
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

  const facturasSet = new Set(
    (await prisma.factura.findMany({ select: { id: true } })).map(f => f.id)
  );
  console.log(`  ✓ ${facturasSet.size} facturas`);

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

  type UnresolvedEntry = { id: string; ts: string };
  type UnresolvedMap   = Map<string, UnresolvedEntry[]>;
  const facturasNR:    UnresolvedMap = new Map();
  const aplicadoPorNR: UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string, ts: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push({ id, ts });
  }

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const ts = getCol(row, 'MARCATIEMPO')?.trim() ?? '';

    const factura = getCol(row, 'REMISION')?.trim();
    if (factura && !facturasSet.has(factura)) incMap(facturasNR, factura, id, ts);

    const aplicadoPor = getCol(row, 'APLICADA POR')?.trim();
    if (aplicadoPor && !tercerosByNombre.has(norm(aplicadoPor.toLowerCase()))) incMap(aplicadoPorNR, aplicadoPor, id, ts);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, entries]) => {
      console.log(`    - "${k}" (${entries.length} nota${entries.length > 1 ? 's' : ''})`);
      entries.forEach(({ id, ts }) => console.log(`        · ${id.padEnd(10)}  ${ts}`));
    });
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Factura',     facturasNR);
  printAnalysis('Aplicada Por', aplicadoPorNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando notas_credito...');
  await prisma.notaCredito.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando notas de crédito...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const facturaRaw = getCol(row, 'REMISION')?.trim();
    const facturaId  = facturaRaw && facturasSet.has(facturaRaw) ? facturaRaw : null;

    const aplicadaPorRaw = getCol(row, 'APLICADA POR')?.trim();
    const aplicadaPorId  = aplicadaPorRaw
      ? (tercerosByNombre.get(norm(aplicadaPorRaw.toLowerCase())) ?? null)
      : null;

    try {
      await prisma.notaCredito.create({
        data: {
          id,
          marcaTiempo:      parseDateTime(getCol(row, 'MARCATIEMPO')),
          fechaRemision:    parseDate(getCol(row, 'FECHA REMISION')),
          fechaNotaCredito: parseDate(getCol(row, 'FECHA NOTA CREDITO')),
          facturaId,
          total:            parseDecimal(getCol(row, 'TOTAL')),
          formaDescuento:   getCol(row, 'FORMA DE DESCUENTO')?.trim() || null,
          valor:            parseDecimal(getCol(row, 'VALOR')),
          porcentaje:       parsePorcentaje(getCol(row, 'PORCENTAJE')),
          aplicadaPorId,
          notas:            getCol(row, 'NOTAS')?.trim() || null,
          valorNc:          parseDecimal(getCol(row, 'VALOR NC')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} notas de crédito creadas`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados              : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)       : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV   : ${dupIds.length}`);
  console.log(`  ⚠ Factura s/resolver      : ${facturasNR.size}`);
  console.log(`  ⚠ Aplicada Por s/resolver : ${aplicadoPorNR.size}`);
  console.log(`  ❌ Errores                : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
