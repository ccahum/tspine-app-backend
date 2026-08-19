/**
 * import-cuentas.ts
 * Puebla: cuentas
 * Dependencias: Banco (cuenta), Tercero (tercero), Sede (sede)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Cuentas.csv');

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

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// ── Parsers ───────────────────────────────────────────────────────────────────

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

function parseBool(val: string | undefined): boolean | null {
  const v = val?.trim()?.toUpperCase();
  if (v === 'TRUE')  return true;
  if (v === 'FALSE') return false;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT CUENTAS');
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

  const bancosSet = new Set(
    (await prisma.banco.findMany({ select: { id: true } })).map(b => b.id)
  );
  console.log(`  ✓ ${bancosSet.size} bancos`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const sedesSet = new Set(
    (await prisma.sede.findMany({ select: { id: true } })).map(s => s.id)
  );
  console.log(`  ✓ ${sedesSet.size} sedes`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const bancosNR:   UnresolvedMap = new Map();
  const tercerosNR: UnresolvedMap = new Map();
  const sedesNR:    UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const banco = getCol(row, 'CUENTA')?.trim();
    if (banco && !bancosSet.has(banco)) incMap(bancosNR, banco, id);

    const tercero = getCol(row, 'TERCERO')?.trim();
    if (tercero && !tercerosByNombre.has(norm(tercero.toLowerCase()))) incMap(tercerosNR, tercero, id);

    const sede = getCol(row, 'SEDE')?.trim();
    if (sede && !sedesSet.has(slugify(sede))) incMap(sedesNR, sede, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].slice(0, 10).forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
    if (m.size > 10) console.log(`    ... y ${m.size - 10} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Banco (CUENTA)', bancosNR);
  printAnalysis('Tercero',        tercerosNR);
  printAnalysis('Sede',           sedesNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando cuentas...');
  await prisma.cuenta.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const bancoRaw = getCol(row, 'CUENTA')?.trim();
    const bancoId  = bancoRaw && bancosSet.has(bancoRaw) ? bancoRaw : null;

    const terceroRaw = getCol(row, 'TERCERO')?.trim();
    const terceroId  = terceroRaw ? (tercerosByNombre.get(norm(terceroRaw.toLowerCase())) ?? null) : null;

    const sedeRaw  = getCol(row, 'SEDE')?.trim();
    const sedeSlug = sedeRaw ? slugify(sedeRaw) : null;
    const sedeId   = sedeSlug && sedesSet.has(sedeSlug) ? sedeSlug : null;

    try {
      await prisma.cuenta.create({
        data: {
          id,
          noDeCuenta:                 getCol(row, 'NO DE CUENTA')?.trim() || null,
          clabeInterbancaria:         getCol(row, 'CLABE INTERBANCARIA')?.trim() || null,
          bancoId,
          tipoDeCuenta:               getCol(row, 'TIPO DE CUENTA')?.trim() || null,
          tipo:                       getCol(row, 'TIPO')?.trim() || null,
          terceroId,
          tc:                         parseBool(getCol(row, 'TC?')),
          montoDisponible:            parseDecimal(getCol(row, 'MONTO DISPONIBLE')),
          fechaDeCorte:               parseDate(getCol(row, 'FECHA DE CORTE')),
          saldoInicial:               parseDecimal(getCol(row, 'SALDO INICIAL')),
          fechaDePago:                parseDate(getCol(row, 'FECHA DE PAGO')),
          transferenciaInternacional: parseBool(getCol(row, 'TRANSFERENCIA INTERNACIONAL?')),
          swiftBic:                   getCol(row, 'SWIFT / BIC')?.trim() || null,
          bancoDestino:               getCol(row, 'BANCO DESTINO')?.trim() || null,
          direccion:                  getCol(row, 'DIRECCIÓN')?.trim() || null,
          pais:                       getCol(row, 'PAIS')?.trim() || null,
          estado:                     getCol(row, 'ESTADO')?.trim() || null,
          sedeId,
          cajaChica:                  parseBool(getCol(row, 'CAJA CHICA?')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} cuentas creadas`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados            : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)     : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV : ${dupIds.length}`);
  console.log(`  ⚠ Banco s/resolver      : ${bancosNR.size}`);
  console.log(`  ⚠ Tercero s/resolver    : ${tercerosNR.size}`);
  console.log(`  ⚠ Sede s/resolver       : ${sedesNR.size}`);
  console.log(`  ❌ Errores              : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
