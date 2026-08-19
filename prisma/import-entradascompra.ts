/**
 * import-entradascompra.ts
 * Puebla: entradas_por_compra
 * Dependencias: DetalleCompra, Producto (descripcion), Lote, Tercero (validadoPor)
 * Nota: CANTIDAD viene ya calculada en el CSV (fórmula de hoja de cálculo real, no columna
 *       virtual de AppSheet: [ALMACEN PZ]+[CONTENDEDOR PZ]), así que se importa tal cual.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - EntradasPorCompra.csv');

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

function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/\$/g, '').replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function parseInt_(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseInt(val.trim().replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT ENTRADAS POR COMPRA');
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

  const detalleComprasSet = new Set((await prisma.detalleCompra.findMany({ select: { id: true } })).map(d => d.id));
  console.log(`  ✓ ${detalleComprasSet.size} detalle_compras`);

  const productosSet = new Set((await prisma.producto.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${productosSet.size} productos`);

  const lotesSet = new Set((await prisma.lote.findMany({ select: { id: true } })).map(l => l.id));
  console.log(`  ✓ ${lotesSet.size} lotes`);

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

  type UnresolvedMap = Map<string, string[]>;
  const detalleComprasNR: UnresolvedMap = new Map();
  const productosNR:      UnresolvedMap = new Map();
  const lotesNR:           UnresolvedMap = new Map();
  const validadoPorNR:    UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'IDVALLOTECOMPRA')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const detalleCompra = getCol(row, 'IDDETALLECOMPRA')?.trim();
    if (detalleCompra && !detalleComprasSet.has(detalleCompra)) incMap(detalleComprasNR, detalleCompra, id);

    const producto = getCol(row, 'DESCRIPCION')?.trim();
    if (producto && !productosSet.has(producto)) incMap(productosNR, producto, id);

    const lote = getCol(row, 'LOTE')?.trim();
    if (lote && !lotesSet.has(lote)) incMap(lotesNR, lote, id);

    const validadoPor = getCol(row, 'Validado por')?.trim();
    if (validadoPor && !tercero(validadoPor)) incMap(validadoPorNR, validadoPor, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Detalle Compra', detalleComprasNR);
  printAnalysis('Producto',       productosNR);
  printAnalysis('Lote',           lotesNR);
  printAnalysis('Validado Por',   validadoPorNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando entradas_por_compra...');
  await prisma.entradaCompra.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'IDVALLOTECOMPRA')?.trim();
    if (!id) { omitidos++; continue; }

    const detalleCompraRaw = getCol(row, 'IDDETALLECOMPRA')?.trim();
    const detalleCompraId  = detalleCompraRaw && detalleComprasSet.has(detalleCompraRaw) ? detalleCompraRaw : null;

    const productoRaw = getCol(row, 'DESCRIPCION')?.trim();
    const productoId  = productoRaw && productosSet.has(productoRaw) ? productoRaw : null;

    const loteRaw = getCol(row, 'LOTE')?.trim();
    const loteId  = loteRaw && lotesSet.has(loteRaw) ? loteRaw : null;

    try {
      await prisma.entradaCompra.create({
        data: {
          id,
          detalleCompraId,
          productoId,
          costo:            parseDecimal(getCol(row, 'COSTO')),
          cantidad:         parseDecimal(getCol(row, 'CANTIDAD')),
          loteId,
          contador:         parseInt_(getCol(row, 'CONTADOR')),
          almacenPz:        parseInt_(getCol(row, 'ALMACEN PZ')),
          contendedorPz:    parseInt_(getCol(row, 'CONTENDEDOR PZ')),
          h0:               parseDecimal(getCol(row, 'H0')),
          h1:               parseDecimal(getCol(row, 'H1')),
          empBM:            getCol(row, 'EMP B/M')?.trim() || null,
          temp:             getCol(row, 'TEMP')?.trim()    || null,
          desviacion:       getCol(row, 'DESV.')?.trim()   || null,
          ac:               getCol(row, 'AC')?.trim()      || null,
          estado:           getCol(row, 'Estado')?.trim()  || null,
          validadoPorId:    resolveTercero(getCol(row, 'Validado por')),
          horaDeValidacion: parseDateTime(getCol(row, 'Hora de Validacion')),
          notas:            getCol(row, 'Notas')?.trim()   || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} entradas_por_compra creadas`);

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
