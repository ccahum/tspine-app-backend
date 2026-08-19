/**
 * import-det-cotiza.ts
 * Puebla: det_cotiza
 * Dependencias: Cotizacion, Tercero (hospital), Producto
 *
 * Notas de mapeo:
 * - COTIZACION viene como el id de la cotización (ej. "CT-ba2f2b2f") → match directo contra Cotizacion.id.
 * - HOSPITAL viene como nombre completo → se resuelve por match normalizado contra Tercero.nombreCompleto.
 * - DESCRIPCIÓN viene como el mismo valor que REFERENCIA (Producto.id === Producto.referencia en los
 *   productos verificados), así que se resuelve por match directo contra Producto.id.
 * - BUSCADOR ESPECIAL no se importa: es una columna virtual de AppSheet (concatenación de hospital+referencia).
 * - SEDE y USUARIO no son relación aquí (no se pidieron como tal): se guardan como texto plano.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Det_Cotiza.csv');

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
  return name.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getCol(row: Record<string, string>, name: string): string | undefined {
  const idx = _colIndex.get(norm(name));
  if (idx === undefined) return undefined;
  return Object.values(row)[idx];
}

// ── Parsers ───────────────────────────────────────────────────────────────────

/** D/M/YYYY H:MM:SS (la hora puede venir sin cero a la izquierda, ej. "9:50:22") */
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
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT DETALLE COTIZACION');
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

  const cotizacionesSet = new Set((await prisma.cotizacion.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${cotizacionesSet.size} cotizaciones`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto);
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const productosSet = new Set((await prisma.producto.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${productosSet.size} productos`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const cotizacionesNR: UnresolvedMap = new Map();
  const hospitalesNR:   UnresolvedMap = new Map();
  const productosNR:    UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'ID_DETALLE')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const cotizacion = getCol(row, 'COTIZACION')?.trim();
    if (cotizacion && !cotizacionesSet.has(cotizacion)) incMap(cotizacionesNR, cotizacion, id);

    const hospital = getCol(row, 'HOSPITAL')?.trim();
    if (hospital && !tercerosByNombre.has(norm(hospital))) incMap(hospitalesNR, hospital, id);

    const producto = getCol(row, 'DESCRIPCIÓN')?.trim();
    if (producto && !productosSet.has(producto)) incMap(productosNR, producto, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Cotización', cotizacionesNR);
  printAnalysis('Hospital',   hospitalesNR);
  printAnalysis('Producto',   productosNR);

  // ── [3/3] Truncar + Importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando det_cotiza...');
  await prisma.detCotiza.deleteMany();
  console.log('  ✓ Tabla limpia');

  console.log('\nImportando detalle de cotizaciones...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID_DETALLE')?.trim();
    if (!id) { omitidos++; continue; }

    const cotizacionRaw = getCol(row, 'COTIZACION')?.trim();
    const cotizacionId  = cotizacionRaw && cotizacionesSet.has(cotizacionRaw) ? cotizacionRaw : null;

    const hospitalRaw = getCol(row, 'HOSPITAL')?.trim();
    const hospitalId  = hospitalRaw ? (tercerosByNombre.get(norm(hospitalRaw)) ?? null) : null;

    const productoRaw = getCol(row, 'DESCRIPCIÓN')?.trim();
    const productoId  = productoRaw && productosSet.has(productoRaw) ? productoRaw : null;

    try {
      await prisma.detCotiza.create({
        data: {
          id,
          cotizacionId,
          marcaDeTiempo: parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          hospitalId,
          referencia:    getCol(row, 'REFERENCIA')?.trim() || null,
          productoId,
          cantidad:      parseDecimal(getCol(row, 'CANTIDAD')),
          valorUnitario: parseDecimal(getCol(row, 'VALOR UNITARIO')),
          valor:         parseDecimal(getCol(row, 'VALOR')),
          observaciones: getCol(row, 'OBSERVACIONES')?.trim() || null,
          sede:          getCol(row, 'SEDE')?.trim() || null,
          usuario:       getCol(row, 'USUARIO')?.trim() || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} detalles de cotización creados`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados            : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)     : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV : ${dupIds.length}`);
  console.log(`  ⚠ Cotización s/resolver : ${cotizacionesNR.size}`);
  console.log(`  ⚠ Hospital s/resolver   : ${hospitalesNR.size}`);
  console.log(`  ⚠ Producto s/resolver   : ${productosNR.size}`);
  console.log(`  ❌ Errores               : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
