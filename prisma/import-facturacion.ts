/**
 * import-facturacion.ts
 * Puebla: facturas
 * Dependencias: Tercero (generadaPor, empresa, cliente), Remision, Sede
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine - Facturacion.csv');

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

/** D/M/YYYY H:MM:SS */
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

function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT FACTURACIÓN');
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

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const remisionesSet = new Set(
    (await prisma.remision.findMany({ select: { id: true } })).map(r => r.id)
  );
  console.log(`  ✓ ${remisionesSet.size} remisiones`);

  const sedesByNombre = new Map<string, string>();
  const allSedes = await prisma.sede.findMany({ select: { id: true, nombre: true } });
  for (const s of allSedes) {
    sedesByNombre.set(norm(s.nombre.trim().toLowerCase()), s.id);
  }
  console.log(`  ✓ ${allSedes.length} sedes`);

  // ── [2/4] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/4] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedEntry = { id: string; ts: string };
  type UnresolvedMap   = Map<string, UnresolvedEntry[]>;
  const generadaPorNR: UnresolvedMap = new Map();
  const remisionesNR:  UnresolvedMap = new Map();
  const empresasNR:    UnresolvedMap = new Map();
  const clientesNR:    UnresolvedMap = new Map();
  const sedesNR:       UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string, ts: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push({ id, ts });
  }

  for (const row of rows) {
    const id = getCol(row, 'ID INTERNO')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const ts = getCol(row, 'MARCADETIEMPO')?.trim() ?? '';

    const generadaPor = getCol(row, 'GENERADA POR')?.trim();
    if (generadaPor && !tercerosByNombre.has(norm(generadaPor.toLowerCase()))) incMap(generadaPorNR, generadaPor, id, ts);

    const remision = getCol(row, 'REMISION')?.trim();
    if (remision && !remisionesSet.has(remision)) incMap(remisionesNR, remision, id, ts);

    const empresa = getCol(row, 'EMPRESA')?.trim();
    if (empresa && !tercerosByNombre.has(norm(empresa.toLowerCase()))) incMap(empresasNR, empresa, id, ts);

    const cliente = getCol(row, 'CLIENTE')?.trim();
    if (cliente && !tercerosByNombre.has(norm(cliente.toLowerCase()))) incMap(clientesNR, cliente, id, ts);

    const sede = getCol(row, 'SEDE RESPONSABLE')?.trim();
    if (sede && !sedesByNombre.has(norm(sede.toLowerCase()))) incMap(sedesNR, sede, id, ts);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap, opts?: { summarizePrefix?: string; exampleCount?: number }) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }

    const prefix = opts?.summarizePrefix;
    const exampleCount = opts?.exampleCount ?? 2;

    if (!prefix) {
      console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
      [...m.entries()].forEach(([k, entries]) => {
        console.log(`    - "${k}" (${entries.length} factura${entries.length > 1 ? 's' : ''})`);
        entries.forEach(({ id, ts }) => console.log(`        · ${id.padEnd(10)}  ${ts}`));
      });
      return;
    }

    const resumidos = [...m.entries()].filter(([k]) => k.startsWith(prefix));
    const detallados = [...m.entries()].filter(([k]) => !k.startsWith(prefix));

    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    if (resumidos.length > 0) {
      console.log(`    - ${resumidos.length} referencias "${prefix}..." (sistema anterior, se omiten del detalle):`);
      resumidos.slice(0, exampleCount).forEach(([k, entries]) => {
        console.log(`        ej. "${k}" (${entries.length} factura${entries.length > 1 ? 's' : ''})`);
      });
    }
    detallados.forEach(([k, entries]) => {
      console.log(`    - "${k}" (${entries.length} factura${entries.length > 1 ? 's' : ''})`);
      entries.forEach(({ id, ts }) => console.log(`        · ${id.padEnd(10)}  ${ts}`));
    });
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Generada Por', generadaPorNR);
  printAnalysis('Remision',     remisionesNR, { summarizePrefix: 'RPM' });
  printAnalysis('Empresa',      empresasNR);
  printAnalysis('Cliente',      clientesNR);
  printAnalysis('Sede',         sedesNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando facturas...');
  await prisma.factura.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando facturas...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID INTERNO')?.trim();
    if (!id) { omitidos++; continue; }

    const generadaPorRaw = getCol(row, 'GENERADA POR')?.trim();
    const generadaPorId  = generadaPorRaw
      ? (tercerosByNombre.get(norm(generadaPorRaw.toLowerCase())) ?? null)
      : null;

    const remisionRaw = getCol(row, 'REMISION')?.trim();
    const remisionId  = remisionRaw && remisionesSet.has(remisionRaw) ? remisionRaw : null;

    const empresaRaw = getCol(row, 'EMPRESA')?.trim();
    const empresaId  = empresaRaw
      ? (tercerosByNombre.get(norm(empresaRaw.toLowerCase())) ?? null)
      : null;

    const clienteRaw = getCol(row, 'CLIENTE')?.trim();
    const clienteId  = clienteRaw
      ? (tercerosByNombre.get(norm(clienteRaw.toLowerCase())) ?? null)
      : null;

    const sedeRaw = getCol(row, 'SEDE RESPONSABLE')?.trim();
    const sedeId  = sedeRaw
      ? (sedesByNombre.get(norm(sedeRaw.toLowerCase())) ?? null)
      : null;

    try {
      await prisma.factura.create({
        data: {
          id,
          marcaDeTiempo:    parseDateTime(getCol(row, 'MARCADETIEMPO')),
          fechaCreacion:    parseDate(getCol(row, 'FECHA CREACION')),
          generadaPorId,
          remisionId,
          empresaId,
          clienteId,
          folioFacturacion: getCol(row, 'FOLIO FACTURACION')?.trim() || null,
          doctor:           getCol(row, 'DOCTOR')?.trim()            || null,
          hospital:         getCol(row, 'HOSPITAL')?.trim()          || null,
          paciente:         getCol(row, 'PACIENTE')?.trim()          || null,
          fechaCirugia:     parseDate(getCol(row, 'FECHA CIRUGIA')),
          descuentoGlobal:  parseDecimal(getCol(row, 'DESCUENTO GLOBAL')),
          sedeId,
          observaciones:    getCol(row, 'OBSERVACIONES')?.trim()     || null,
          impuestos:        getCol(row, 'IMPUESTOS')?.trim()         || null,
          fechaFactura:     parseDate(getCol(row, 'FECHA DE FACTURA')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} facturas creadas`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados              : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)       : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV   : ${dupIds.length}`);
  console.log(`  ⚠ Generada Por s/resolver : ${generadaPorNR.size}`);
  console.log(`  ⚠ Remision s/resolver     : ${remisionesNR.size}`);
  console.log(`  ⚠ Empresa s/resolver      : ${empresasNR.size}`);
  console.log(`  ⚠ Cliente s/resolver      : ${clientesNR.size}`);
  console.log(`  ⚠ Sede s/resolver         : ${sedesNR.size}`);
  console.log(`  ❌ Errores                : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
