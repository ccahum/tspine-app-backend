/**
 * import-requisiciones.ts
 * Puebla: requisiciones
 * Dependencias: Tercero (usuario, contacto), Programacion, Tarifa (cubrimiento, tarifa), Sede (sedeOrigen)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Requisiciones.csv');

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

function parseBool(val: string | undefined): boolean | null {
  const v = val?.trim()?.toUpperCase();
  if (v === 'TRUE')  return true;
  if (v === 'FALSE') return false;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT REQUISICIONES');
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

  const programacionesSet = new Set(
    (await prisma.programacion.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${programacionesSet.size} programaciones`);

  const tarifasSet = new Set(
    (await prisma.tarifa.findMany({ select: { id: true } })).map(t => t.id)
  );
  console.log(`  ✓ ${tarifasSet.size} tarifas`);

  const sedesSet = new Set(
    (await prisma.sede.findMany({ select: { id: true } })).map(s => s.id)
  );
  console.log(`  ✓ ${sedesSet.size} sedes`);

  // ── [2/4] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/4] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const usuariosNR:       UnresolvedMap = new Map();
  const contactosNR:      UnresolvedMap = new Map();
  const programacionesNR: UnresolvedMap = new Map();
  const cubrimientosNR:   UnresolvedMap = new Map();
  const tarifasNR:        UnresolvedMap = new Map();
  const sedesOrigenNR:    UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'ID MOVIMIENTO')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const usuario = getCol(row, 'USUARIO')?.trim();
    if (usuario && !tercerosByNombre.has(norm(usuario.toLowerCase()))) incMap(usuariosNR, usuario, id);

    const contacto = getCol(row, 'CONTACTO')?.trim();
    if (contacto && !tercerosByNombre.has(norm(contacto.toLowerCase()))) incMap(contactosNR, contacto, id);

    const numProgram = getCol(row, 'NO PROGRAMACION')?.trim();
    if (numProgram && !programacionesSet.has(numProgram)) incMap(programacionesNR, numProgram, id);

    const cubrimiento = getCol(row, 'CUBRIMIENTO')?.trim();
    if (cubrimiento && !tarifasSet.has(cubrimiento)) incMap(cubrimientosNR, cubrimiento, id);

    const tarifa = getCol(row, 'TARIFA')?.trim();
    if (tarifa && !tarifasSet.has(tarifa)) incMap(tarifasNR, tarifa, id);

    const sedeOrigen = getCol(row, 'SEDE ORIGEN')?.trim();
    if (sedeOrigen && !sedesSet.has(slugify(sedeOrigen))) incMap(sedesOrigenNR, sedeOrigen, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].slice(0, 10).forEach(([k, ids]) => {
      console.log(`    - "${k}" (${ids.length}x)`);
    });
    if (m.size > 10) console.log(`    ... y ${m.size - 10} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Usuario',       usuariosNR);
  printAnalysis('Contacto',      contactosNR);
  printAnalysis('Programación',  programacionesNR);
  printAnalysis('Cubrimiento',   cubrimientosNR);
  printAnalysis('Tarifa',        tarifasNR);
  printAnalysis('Sede Origen',   sedesOrigenNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando requisiciones...');
  await prisma.requisicion.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando requisiciones...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID MOVIMIENTO')?.trim();
    if (!id) { omitidos++; continue; }

    const usuarioRaw = getCol(row, 'USUARIO')?.trim();
    const usuarioId  = usuarioRaw ? (tercerosByNombre.get(norm(usuarioRaw.toLowerCase())) ?? null) : null;

    const contactoRaw = getCol(row, 'CONTACTO')?.trim();
    const contactoId  = contactoRaw ? (tercerosByNombre.get(norm(contactoRaw.toLowerCase())) ?? null) : null;

    const numProgramRaw = getCol(row, 'NO PROGRAMACION')?.trim();
    const programacionId = numProgramRaw && programacionesSet.has(numProgramRaw) ? numProgramRaw : null;

    const cubrimientoRaw = getCol(row, 'CUBRIMIENTO')?.trim();
    const cubrimientoId  = cubrimientoRaw && tarifasSet.has(cubrimientoRaw) ? cubrimientoRaw : null;

    const tarifaRaw = getCol(row, 'TARIFA')?.trim();
    const tarifaId   = tarifaRaw && tarifasSet.has(tarifaRaw) ? tarifaRaw : null;

    const sedeOrigenRaw = getCol(row, 'SEDE ORIGEN')?.trim();
    const sedeOrigenSlug = sedeOrigenRaw ? slugify(sedeOrigenRaw) : null;
    const sedeOrigenId   = sedeOrigenSlug && sedesSet.has(sedeOrigenSlug) ? sedeOrigenSlug : null;

    try {
      await prisma.requisicion.create({
        data: {
          id,
          marcaDeTiempo:          parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          usuarioId,
          fecha:                  parseDate(getCol(row, 'FECHA')),
          status:                 getCol(row, 'STATUS')?.trim() || null,
          idRelacionado:          getCol(row, 'ID RELACIONADO')?.trim() || null,
          provieneDeProgramacion: parseBool(getCol(row, 'PROVIENE DE PROGRAMACIÓN?')),
          programacionId,
          folio:                  getCol(row, 'FOLIO')?.trim() || null,
          validacion:             getCol(row, 'VALIDACION')?.trim() || null,
          existeProgramacion:     parseBool(getCol(row, 'EXISTE PROGRAMACIÒN?')),
          cubrimientoId,
          tarifaId,
          contactoId,
          sedeOrigenId,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} requisiciones creadas`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados            : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)     : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV : ${dupIds.length}`);
  console.log(`  ⚠ Usuario s/resolver    : ${usuariosNR.size}`);
  console.log(`  ⚠ Contacto s/resolver   : ${contactosNR.size}`);
  console.log(`  ⚠ Programación s/resolver: ${programacionesNR.size}`);
  console.log(`  ⚠ Cubrimiento s/resolver : ${cubrimientosNR.size}`);
  console.log(`  ⚠ Tarifa s/resolver      : ${tarifasNR.size}`);
  console.log(`  ⚠ Sede Origen s/resolver : ${sedesOrigenNR.size}`);
  console.log(`  ❌ Errores               : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
