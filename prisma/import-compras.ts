/**
 * import-compras.ts
 * Puebla: compras
 * Dependencias: Sede (almacenDestino), Almacen (ubicacionDestino), Tercero (proveedor, registradoPor),
 *               Proyecto, FormaPago
 * Nota: FOLIO, PROYECTO y SOLICITUD DE COTIZACION vienen vacíos en todos los registros del CSV.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Compras.csv');

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

function parseInt_(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseInt(val.trim().replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
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
  console.log('  IMPORT COMPRAS');
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

  const sedesSet = new Set((await prisma.sede.findMany({ select: { id: true } })).map(s => s.id));
  const sedesByNombre = new Map<string, string>();
  (await prisma.sede.findMany({ select: { id: true, nombre: true } })).forEach(s => sedesByNombre.set(norm(s.nombre), s.id));
  console.log(`  ✓ ${sedesSet.size} sedes`);

  const almacenesSet = new Set((await prisma.almacen.findMany({ select: { id: true } })).map(a => a.id));
  const almacenesByNombre = new Map<string, string>();
  (await prisma.almacen.findMany({ select: { id: true, nombre: true } })).forEach(a => {
    if (a.nombre) almacenesByNombre.set(norm(a.nombre), a.id);
  });
  console.log(`  ✓ ${almacenesSet.size} almacenes`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const proyectosSet = new Set((await prisma.proyecto.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${proyectosSet.size} proyectos`);

  const formasPagoSet = new Set((await prisma.formaPago.findMany({ select: { id: true } })).map(f => f.id));
  console.log(`  ✓ ${formasPagoSet.size} formas de pago`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const almacenDestinoNR:   UnresolvedMap = new Map();
  const ubicacionDestinoNR: UnresolvedMap = new Map();
  const proveedoresNR:      UnresolvedMap = new Map();
  const registradoPorNR:    UnresolvedMap = new Map();
  const proyectosNR:        UnresolvedMap = new Map();
  const formasPagoNR:       UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const almacenDestino = getCol(row, 'ALMACEN DESTINO')?.trim();
    if (almacenDestino && !sedesSet.has(almacenDestino) && !sedesByNombre.has(norm(almacenDestino))) incMap(almacenDestinoNR, almacenDestino, id);

    const ubicacionDestino = getCol(row, 'UBICACION DESTINO')?.trim();
    if (ubicacionDestino && !almacenesSet.has(ubicacionDestino) && !almacenesByNombre.has(norm(ubicacionDestino))) incMap(ubicacionDestinoNR, ubicacionDestino, id);

    const proveedor = getCol(row, 'PROVEEDOR')?.trim();
    if (proveedor && !tercero(proveedor)) incMap(proveedoresNR, proveedor, id);

    const registradoPor = getCol(row, 'REGISTRADO POR')?.trim();
    if (registradoPor && !tercero(registradoPor)) incMap(registradoPorNR, registradoPor, id);

    const proyecto = getCol(row, 'PROYECTO')?.trim();
    if (proyecto && !proyectosSet.has(proyecto)) incMap(proyectosNR, proyecto, id);

    const formaPago = getCol(row, 'FORMA DE PAGO')?.trim();
    if (formaPago && !formasPagoSet.has(formaPago)) incMap(formasPagoNR, formaPago, id);
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

  printAnalysis('Almacén Destino (Sede)',    almacenDestinoNR);
  printAnalysis('Ubicación Destino (Almacén)', ubicacionDestinoNR);
  printAnalysis('Proveedor',                 proveedoresNR);
  printAnalysis('Registrado Por',            registradoPorNR);
  printAnalysis('Proyecto',                  proyectosNR);
  printAnalysis('Forma de Pago',             formasPagoNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando compras...');
  await prisma.compra.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const almacenDestinoRaw = getCol(row, 'ALMACEN DESTINO')?.trim();
    const almacenDestinoId  = almacenDestinoRaw
      ? (sedesSet.has(almacenDestinoRaw) ? almacenDestinoRaw : sedesByNombre.get(norm(almacenDestinoRaw)) ?? null)
      : null;

    const ubicacionDestinoRaw = getCol(row, 'UBICACION DESTINO')?.trim();
    const ubicacionDestinoId  = ubicacionDestinoRaw
      ? (almacenesSet.has(ubicacionDestinoRaw) ? ubicacionDestinoRaw : almacenesByNombre.get(norm(ubicacionDestinoRaw)) ?? null)
      : null;

    const proyectoRaw = getCol(row, 'PROYECTO')?.trim();
    const proyectoId  = proyectoRaw && proyectosSet.has(proyectoRaw) ? proyectoRaw : null;

    const formaPagoRaw = getCol(row, 'FORMA DE PAGO')?.trim();
    const formaPagoId  = formaPagoRaw && formasPagoSet.has(formaPagoRaw) ? formaPagoRaw : null;

    try {
      await prisma.compra.create({
        data: {
          id,
          marcaTiempo:         parseDateTime(getCol(row, 'MARCATIEMPO')),
          ordenAValidar:       getCol(row, 'ORDEN A VALIDAR')?.trim()  || null,
          folio:               getCol(row, 'FOLIO')?.trim()           || null,
          fecha:               parseDate(getCol(row, 'FECHA')),
          almacenDestinoId,
          ubicacionDestinoId,
          forma:               getCol(row, 'FORMA')?.trim()           || null,
          proveedorId:         resolveTercero(getCol(row, 'PROVEEDOR')),
          fechaVencimiento:    parseDate(getCol(row, 'FECHA VENCIMIENTO')),
          registradoPorId:     resolveTercero(getCol(row, 'REGISTRADO POR')),
          estado:              getCol(row, 'ESTADO')?.trim()          || null,
          contador:            parseInt_(getCol(row, 'CONTADOR')),
          status:              getCol(row, 'STATUS')?.trim()          || null,
          tipoCompra:          parseBool(getCol(row, 'TIPO DE COMPRA')),
          proyectoId,
          formaPagoId,
          solicitudCotizacion: getCol(row, 'SOLICITUD DE COTIZACION')?.trim() || null,
          tipoPersona:         getCol(row, 'TIPO DE PERSONA')?.trim()  || null,
          contadorCompras:     parseInt_(getCol(row, 'CONTADOR COMPRAS')),
          pdf:                 getCol(row, 'PDF')?.trim()             || null,
          condicionesPago:     getCol(row, 'CONDICIONES DE PAGO')?.trim() || null,
          usoCfdi:             getCol(row, 'USO DE CFDI')?.trim()     || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} compras creadas`);

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
