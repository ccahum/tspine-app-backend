/**
 * import-abonos.ts
 * Puebla: abonos
 * Dependencias: Tercero (usuario, tercero), MovimientoCaja (recaudo), Factura (N° FACTURA),
 *               FormaPago, Cuenta, Banco (bancoCaja)
 * Nota: NO FACTURA, COMPLEMENTO, XML y ESTADOCOMPLEMENTO vienen vacíos en la mayoría de los registros.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Abonos.csv');

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

/** Número con comas de miles: "40,000.00" → 40000.00 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT ABONOS');
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

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const movimientosCajaSet = new Set((await prisma.movimientoCaja.findMany({ select: { id: true } })).map(m => m.id));
  console.log(`  ✓ ${movimientosCajaSet.size} movimientos de caja`);

  const facturasSet = new Set((await prisma.factura.findMany({ select: { id: true } })).map(f => f.id));
  console.log(`  ✓ ${facturasSet.size} facturas`);

  const formasPagoSet = new Set((await prisma.formaPago.findMany({ select: { id: true } })).map(f => f.id));
  console.log(`  ✓ ${formasPagoSet.size} formas de pago`);

  const cuentasSet = new Set((await prisma.cuenta.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${cuentasSet.size} cuentas`);

  const bancosSet = new Set((await prisma.banco.findMany({ select: { id: true } })).map(b => b.id));
  console.log(`  ✓ ${bancosSet.size} bancos`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const usuarioNR   : UnresolvedMap = new Map();
  const recaudoNR   : UnresolvedMap = new Map();
  const terceroNR   : UnresolvedMap = new Map();
  const facturaNR   : UnresolvedMap = new Map();
  const formaPagoNR : UnresolvedMap = new Map();
  const cuentaNR    : UnresolvedMap = new Map();
  const bancoCajaNR : UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'ID_ABONO')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const usuario = getCol(row, 'USUARIO')?.trim();
    if (usuario && !tercero(usuario)) incMap(usuarioNR, usuario, id);

    const recaudo = getCol(row, 'RECAUDO')?.trim();
    if (recaudo && !movimientosCajaSet.has(recaudo)) incMap(recaudoNR, recaudo, id);

    const terceroVal = getCol(row, 'TERCERO')?.trim();
    if (terceroVal && !tercero(terceroVal)) incMap(terceroNR, terceroVal, id);

    const factura = getCol(row, 'N° FACTURA')?.trim();
    if (factura && !facturasSet.has(factura)) incMap(facturaNR, factura, id);

    const formaPago = getCol(row, 'FORMA DE PAGO')?.trim();
    if (formaPago && !formasPagoSet.has(formaPago)) incMap(formaPagoNR, formaPago, id);

    const cuenta = getCol(row, 'CUENTA')?.trim();
    if (cuenta && !cuentasSet.has(cuenta)) incMap(cuentaNR, cuenta, id);

    const bancoCaja = getCol(row, 'BANCOCAJA')?.trim();
    if (bancoCaja && !bancosSet.has(bancoCaja)) incMap(bancoCajaNR, bancoCaja, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Usuario',       usuarioNR);
  printAnalysis('Recaudo',       recaudoNR);
  printAnalysis('Tercero',       terceroNR);
  printAnalysis('Factura',       facturaNR);
  printAnalysis('Forma de Pago', formaPagoNR);
  printAnalysis('Cuenta',        cuentaNR);
  printAnalysis('Banco/Caja',    bancoCajaNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando abonos...');
  await prisma.abono.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'ID_ABONO')?.trim();
    if (!id) { omitidos++; continue; }

    const recaudoRaw = getCol(row, 'RECAUDO')?.trim();
    const recaudoId  = recaudoRaw && movimientosCajaSet.has(recaudoRaw) ? recaudoRaw : null;

    const facturaRaw = getCol(row, 'N° FACTURA')?.trim();
    const facturaId  = facturaRaw && facturasSet.has(facturaRaw) ? facturaRaw : null;

    const formaPagoRaw = getCol(row, 'FORMA DE PAGO')?.trim();
    const formaPagoId  = formaPagoRaw && formasPagoSet.has(formaPagoRaw) ? formaPagoRaw : null;

    const cuentaRaw = getCol(row, 'CUENTA')?.trim();
    const cuentaId  = cuentaRaw && cuentasSet.has(cuentaRaw) ? cuentaRaw : null;

    const bancoCajaRaw = getCol(row, 'BANCOCAJA')?.trim();
    const bancoCajaId  = bancoCajaRaw && bancosSet.has(bancoCajaRaw) ? bancoCajaRaw : null;

    try {
      await prisma.abono.create({
        data: {
          id,
          usuarioId:              resolveTercero(getCol(row, 'USUARIO')),
          marcaTiempo:            parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          recaudoId,
          saldoActual:            parseDecimal(getCol(row, 'SALDO ACTUAL')),
          terceroId:              resolveTercero(getCol(row, 'TERCERO')),
          facturaId,
          fecha:                  parseDate(getCol(row, 'FECHA')),
          valor:                  parseDecimal(getCol(row, 'VALOR')),
          formaPagoId,
          cuentaId,
          bancoCajaId,
          observaciones:          getCol(row, 'OBSERVACIONES')?.trim()      || null,
          saldo:                  parseDecimal(getCol(row, 'SALDO')),
          noFactura:              getCol(row, 'NO FACTURA')?.trim()        || null,
          complemento:            getCol(row, 'COMPLEMENTO')?.trim()       || null,
          xml:                    getCol(row, 'XML')?.trim()               || null,
          estadoComplemento:      getCol(row, 'ESTADOCOMPLEMENTO')?.trim() || null,
          previousBalanceAmount:  parseDecimal(getCol(row, 'PREVIOUSBALANCEAMOUNT')),
          remainingBalanceAmount: parseDecimal(getCol(row, 'REMAININGBALANCEAMOUNT')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} abonos creados`);

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
