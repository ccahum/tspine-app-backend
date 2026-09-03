/**
 * import-cotizacion.ts
 * Puebla: cotizaciones
 * Dependencias: Tercero (usuario, hospital, responsableEconomico, empresa), Tarifa (cubrimiento, tarifa),
 *               Sede, PaqueteCotizacion, DetallePaquete
 *
 * Notas de mapeo:
 * - USUARIO, HOSPITAL, RESPONSABLE ECONOMICO, EMPRESA vienen como nombre completo → se resuelven
 *   por match normalizado contra Tercero.nombreCompleto.
 * - CUBRIMIENTO y TARIFA vienen como el id de la subtarifa (ej. "1A18") → match directo contra Tarifa.id.
 * - SEDE viene como el nombre visible (ej. "Sede Guadalajara") → se resuelve por match normalizado
 *   contra Sede.nombre (Sede.id es un slug interno, ej. "sede_guadalajara", no coincide con la hoja).
 * - Paquete viene como el id del paquete (ej. "ie14042601") → match directo contra PaqueteCotizacion.id.
 * - ProductosPaquete viene como el id del detalle de paquete (ej. "DetPaq001") → match directo
 *   contra DetallePaquete.id.
 * - MÉDICO no es relación (no se pidió como tal): se guarda como texto plano.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Cotizacion.csv');

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
  const NBSP = String.fromCharCode(160);
  return name
    .split(NBSP).join(' ')  // espacio de no separacion (comun al copiar de Sheets/Word) -> espacio normal
    .trim()
    .split(' ').filter(Boolean).join(' ')  // colapsa espacios dobles/multiples
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function getCol(row: Record<string, string>, name: string): string | undefined {
  const idx = _colIndex.get(norm(name));
  if (idx === undefined) return undefined;
  return Object.values(row)[idx];
}

// ── Parsers ───────────────────────────────────────────────────────────────────

/** DD/MM/YYYY  (1/1/1900 = vacío en Excel) */
function parseDate(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const parts = val.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (y === '1900') return null;
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const dt  = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

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

function parseInt10(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseInt(val.trim(), 10);
  return isNaN(num) ? null : num;
}

function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  return val.trim().toUpperCase() === 'TRUE';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT COTIZACIONES');
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
    const n = norm(t.nombreCompleto);
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const tarifasSet = new Set((await prisma.tarifa.findMany({ select: { id: true } })).map(t => t.id));
  console.log(`  ✓ ${tarifasSet.size} subtarifas`);

  const sedesByNombre = new Map<string, string>();
  const allSedes = await prisma.sede.findMany({ select: { id: true, nombre: true } });
  for (const s of allSedes) {
    const n = norm(s.nombre);
    if (!sedesByNombre.has(n)) sedesByNombre.set(n, s.id);
  }
  console.log(`  ✓ ${allSedes.length} sedes`);

  const paquetesSet = new Set((await prisma.paqueteCotizacion.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${paquetesSet.size} paquetes de cotización`);

  const detallePaquetesSet = new Set((await prisma.detallePaquete.findMany({ select: { id: true } })).map(d => d.id));
  console.log(`  ✓ ${detallePaquetesSet.size} detalles de paquete`);

  const resolveTercero = (val: string | undefined): string | null => {
    const raw = val?.trim();
    if (!raw) return null;
    return tercerosByNombre.get(norm(raw)) ?? null;
  };

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const usuariosNR:    UnresolvedMap = new Map();
  const hospitalesNR:  UnresolvedMap = new Map();
  const cubrimientosNR: UnresolvedMap = new Map();
  const responsablesNR: UnresolvedMap = new Map();
  const tarifasNR:     UnresolvedMap = new Map();
  const empresasNR:    UnresolvedMap = new Map();
  const sedesNR:       UnresolvedMap = new Map();
  const paquetesNR:    UnresolvedMap = new Map();
  const detallesNR:    UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const usuario = getCol(row, 'USUARIO')?.trim();
    if (usuario && !tercerosByNombre.has(norm(usuario))) incMap(usuariosNR, usuario, id);

    const hospital = getCol(row, 'HOSPITAL')?.trim();
    if (hospital && !tercerosByNombre.has(norm(hospital))) incMap(hospitalesNR, hospital, id);

    const cubrimiento = getCol(row, 'CUBRIMIENTO')?.trim();
    if (cubrimiento && !tarifasSet.has(cubrimiento)) incMap(cubrimientosNR, cubrimiento, id);

    const responsable = getCol(row, 'RESPONSABLE ECONOMICO')?.trim();
    if (responsable && !tercerosByNombre.has(norm(responsable))) incMap(responsablesNR, responsable, id);

    const tarifa = getCol(row, 'TARIFA')?.trim();
    if (tarifa && !tarifasSet.has(tarifa)) incMap(tarifasNR, tarifa, id);

    const empresa = getCol(row, 'EMPRESA')?.trim();
    if (empresa && !tercerosByNombre.has(norm(empresa))) incMap(empresasNR, empresa, id);

    const sede = getCol(row, 'SEDE')?.trim();
    if (sede && !sedesByNombre.has(norm(sede))) incMap(sedesNR, sede, id);

    const paquete = getCol(row, 'Paquete')?.trim();
    if (paquete && !paquetesSet.has(paquete)) incMap(paquetesNR, paquete, id);

    const detalle = getCol(row, 'ProductosPaquete')?.trim();
    if (detalle && !detallePaquetesSet.has(detalle)) incMap(detallesNR, detalle, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Usuario', usuariosNR);
  printAnalysis('Hospital', hospitalesNR);
  printAnalysis('Cubrimiento', cubrimientosNR);
  printAnalysis('Responsable Económico', responsablesNR);
  printAnalysis('Tarifa', tarifasNR);
  printAnalysis('Empresa', empresasNR);
  printAnalysis('Sede', sedesNR);
  printAnalysis('Paquete', paquetesNR);
  printAnalysis('ProductosPaquete', detallesNR);

  // ── [3/3] Truncar + Importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando cotizaciones...');
  await prisma.cotizacion.deleteMany();
  console.log('  ✓ Tabla limpia');

  console.log('\nImportando cotizaciones...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const cubrimientoRaw = getCol(row, 'CUBRIMIENTO')?.trim();
    const tarifaRaw       = getCol(row, 'TARIFA')?.trim();
    const sedeRaw         = getCol(row, 'SEDE')?.trim();
    const paqueteRaw      = getCol(row, 'Paquete')?.trim();
    const detalleRaw      = getCol(row, 'ProductosPaquete')?.trim();

    try {
      await prisma.cotizacion.create({
        data: {
          id,
          usuarioId:              resolveTercero(getCol(row, 'USUARIO')),
          marcaDeTiempo:           parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          numCotizacion:           getCol(row, 'N° COTIZACIÓN')?.trim() || null,
          fecha:                   parseDate(getCol(row, 'FECHA')),
          dirigidoA:               getCol(row, 'DIRIGIDO A')?.trim() || null,
          medico:                  getCol(row, 'MÉDICO')?.trim() || null,
          hospitalId:              resolveTercero(getCol(row, 'HOSPITAL')),
          cirugia:                 getCol(row, 'CIRUGÍA')?.trim() || null,
          cubrimientoId:           cubrimientoRaw && tarifasSet.has(cubrimientoRaw) ? cubrimientoRaw : null,
          responsableEconomicoId:  resolveTercero(getCol(row, 'RESPONSABLE ECONOMICO')),
          numProveedor:            getCol(row, 'N° PROVEEDOR')?.trim() || null,
          tarifaId:                tarifaRaw && tarifasSet.has(tarifaRaw) ? tarifaRaw : null,
          tiempoEntrega:           getCol(row, 'TIEMPO DE ENTREGA')?.trim() || null,
          observaciones:           getCol(row, 'OBSERVACIONES')?.trim() || null,
          tieneDcto:               parseBool(getCol(row, 'TIENE DCTO?')),
          porcentajeDcto:          parseDecimal(getCol(row, '% DTO')),
          vrDcto:                  parseDecimal(getCol(row, 'V/R DCTO')),
          vrDctoPesos:             parseDecimal(getCol(row, 'V/R DCTO $')),
          impuestos:               getCol(row, 'IMPUESTOS')?.trim() || null,
          nota:                    getCol(row, 'NOTA')?.trim() || null,
          imagen:                  getCol(row, 'IMAGEN')?.trim() || null,
          empresaId:               resolveTercero(getCol(row, 'EMPRESA')),
          status:                  getCol(row, 'STATUS')?.trim() || null,
          sedeId:                  sedeRaw ? (sedesByNombre.get(norm(sedeRaw)) ?? null) : null,
          paqueteId:               paqueteRaw && paquetesSet.has(paqueteRaw) ? paqueteRaw : null,
          productosPaqueteId:      detalleRaw && detallePaquetesSet.has(detalleRaw) ? detalleRaw : null,
          contadorPaquetes:        parseInt10(getCol(row, 'ContadorPaquetes')),
          nivel:                   getCol(row, 'Nivel')?.trim() || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} cotizaciones creadas`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados                    : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)             : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV         : ${dupIds.length}`);
  console.log(`  ⚠ Usuario s/resolver            : ${usuariosNR.size}`);
  console.log(`  ⚠ Hospital s/resolver           : ${hospitalesNR.size}`);
  console.log(`  ⚠ Cubrimiento s/resolver        : ${cubrimientosNR.size}`);
  console.log(`  ⚠ Responsable Económico s/resolver: ${responsablesNR.size}`);
  console.log(`  ⚠ Tarifa s/resolver             : ${tarifasNR.size}`);
  console.log(`  ⚠ Empresa s/resolver            : ${empresasNR.size}`);
  console.log(`  ⚠ Sede s/resolver               : ${sedesNR.size}`);
  console.log(`  ⚠ Paquete s/resolver            : ${paquetesNR.size}`);
  console.log(`  ⚠ ProductosPaquete s/resolver   : ${detallesNR.size}`);
  console.log(`  ❌ Errores                       : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
