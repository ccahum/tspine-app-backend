/**
 * import-movimientoscaja.ts
 * Puebla: movimientos_caja
 * Dependencias: Tercero (usuario, empresa, contacto, funcionarioRecibe), Sede,
 *               FormaPago (formaRecaudo), Cuenta, Banco (destino), ConceptoMovimiento
 * Nota: EMPRESA, SEDE, TIPO y N° RECAUDO vienen vacíos en todos los registros del CSV.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - MovimientosDeCaja.csv');

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

/** Número con comas de miles: "233,067.20" → 233067.20 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/** Porcentaje: "5.00%" → 5.00  |  "" → null */
function parsePorcentaje(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace('%', '').trim());
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT MOVIMIENTOS DE CAJA');
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

  const sedesSet = new Set((await prisma.sede.findMany({ select: { id: true } })).map(s => s.id));
  const sedesByNombre = new Map<string, string>();
  (await prisma.sede.findMany({ select: { id: true, nombre: true } })).forEach(s => sedesByNombre.set(norm(s.nombre), s.id));
  console.log(`  ✓ ${sedesSet.size} sedes`);

  const formasPagoSet = new Set((await prisma.formaPago.findMany({ select: { id: true } })).map(f => f.id));
  console.log(`  ✓ ${formasPagoSet.size} formas de pago`);

  const cuentasSet = new Set((await prisma.cuenta.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${cuentasSet.size} cuentas`);

  const bancosSet = new Set((await prisma.banco.findMany({ select: { id: true } })).map(b => b.id));
  console.log(`  ✓ ${bancosSet.size} bancos`);

  const conceptosSet = new Set((await prisma.conceptoMovimiento.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${conceptosSet.size} conceptos de movimiento`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const usuariosNR:      UnresolvedMap = new Map();
  const empresasNR:      UnresolvedMap = new Map();
  const sedesNR:         UnresolvedMap = new Map();
  const contactosNR:     UnresolvedMap = new Map();
  const formasRecaudoNR: UnresolvedMap = new Map();
  const cuentasNR:       UnresolvedMap = new Map();
  const destinosNR:      UnresolvedMap = new Map();
  const funcionariosNR:  UnresolvedMap = new Map();
  const conceptosNR:     UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const usuario = getCol(row, 'USUARIO')?.trim();
    if (usuario && !tercero(usuario)) incMap(usuariosNR, usuario, id);

    const empresa = getCol(row, 'EMPRESA')?.trim();
    if (empresa && !tercero(empresa)) incMap(empresasNR, empresa, id);

    const sede = getCol(row, 'SEDE')?.trim();
    if (sede && !sedesSet.has(sede) && !sedesByNombre.has(norm(sede))) incMap(sedesNR, sede, id);

    const contacto = getCol(row, 'CONTACTO')?.trim();
    if (contacto && !tercero(contacto)) incMap(contactosNR, contacto, id);

    const formaRecaudo = getCol(row, 'FORMA RECAUDO')?.trim();
    if (formaRecaudo && !formasPagoSet.has(formaRecaudo)) incMap(formasRecaudoNR, formaRecaudo, id);

    const cuenta = getCol(row, 'CUENTA')?.trim();
    if (cuenta && !cuentasSet.has(cuenta)) incMap(cuentasNR, cuenta, id);

    const destino = getCol(row, 'DESTINO')?.trim();
    if (destino && !bancosSet.has(destino)) incMap(destinosNR, destino, id);

    const funcionario = getCol(row, 'FUNCIONARIO QUE RECIBE')?.trim();
    if (funcionario && !tercero(funcionario)) incMap(funcionariosNR, funcionario, id);

    const concepto = getCol(row, 'CONCEPTO')?.trim();
    if (concepto && !conceptosSet.has(concepto)) incMap(conceptosNR, concepto, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].slice(0, 8).forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
    if (m.size > 8) console.log(`    ... y ${m.size - 8} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Usuario',                usuariosNR);
  printAnalysis('Empresa',                empresasNR);
  printAnalysis('Sede',                   sedesNR);
  printAnalysis('Contacto',               contactosNR);
  printAnalysis('Forma Recaudo',          formasRecaudoNR);
  printAnalysis('Cuenta',                 cuentasNR);
  printAnalysis('Destino (Banco)',        destinosNR);
  printAnalysis('Funcionario Que Recibe', funcionariosNR);
  printAnalysis('Concepto',               conceptosNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando movimientos de caja...');
  await prisma.movimientoCaja.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const sedeRaw = getCol(row, 'SEDE')?.trim();
    const sedeId  = sedeRaw
      ? (sedesSet.has(sedeRaw) ? sedeRaw : sedesByNombre.get(norm(sedeRaw)) ?? null)
      : null;

    const formaRecaudoRaw = getCol(row, 'FORMA RECAUDO')?.trim();
    const formaRecaudoId  = formaRecaudoRaw && formasPagoSet.has(formaRecaudoRaw) ? formaRecaudoRaw : null;

    const cuentaRaw = getCol(row, 'CUENTA')?.trim();
    const cuentaId  = cuentaRaw && cuentasSet.has(cuentaRaw) ? cuentaRaw : null;

    const destinoRaw = getCol(row, 'DESTINO')?.trim();
    const destinoId  = destinoRaw && bancosSet.has(destinoRaw) ? destinoRaw : null;

    const conceptoRaw = getCol(row, 'CONCEPTO')?.trim();
    const conceptoId  = conceptoRaw && conceptosSet.has(conceptoRaw) ? conceptoRaw : null;

    try {
      await prisma.movimientoCaja.create({
        data: {
          id,
          usuarioId:           resolveTercero(getCol(row, 'USUARIO')),
          marcaTiempo:         parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          empresaId:           resolveTercero(getCol(row, 'EMPRESA')),
          sedeId,
          tipo:                getCol(row, 'TIPO')?.trim()      || null,
          contactoId:          resolveTercero(getCol(row, 'CONTACTO')),
          numRecaudo:          getCol(row, 'N° RECAUDO')?.trim() || null,
          fecha:               parseDate(getCol(row, 'FECHA')),
          formaRecaudoId,
          cuentaId,
          destinoId,
          valor:               parseDecimal(getCol(row, 'VALOR')),
          porcentajeComision:  parsePorcentaje(getCol(row, '% COMISION')),
          funcionarioRecibeId: resolveTercero(getCol(row, 'FUNCIONARIO QUE RECIBE')),
          conceptoId,
          observaciones:       getCol(row, 'OBSERVACIONES')?.trim() || null,
          noRec:               getCol(row, 'NOREC')?.trim()         || null,
          status:              getCol(row, 'STATUS')?.trim()        || null,
          tipoDeRecaudo:       getCol(row, 'TIPODERECAUDO')?.trim() || null,
          porcentaje:          parsePorcentaje(getCol(row, 'PORCENTAJE')),
          imagenSoporte:       getCol(row, 'IMAGEN SOPORTE')?.trim()  || null,
          archivoSoporte:      getCol(row, 'ARCHIVO SOPORTE')?.trim() || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} movimientos de caja creados`);

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
