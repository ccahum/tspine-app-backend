/**
 * import-viajesvehiculo.ts
 * Puebla: viajes_vehiculo (submódulo "Control de Viajes" de Gestión Vehicular)
 * Dependencias: Tercero (conductor, baja_por), Sede, VehiculoCatalogo (seed-catalogos)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Vehiculos.csv');

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

function parseInt10(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseInt(val.trim(), 10);
  return isNaN(num) ? null : num;
}

function parseBool(val: string | undefined): boolean | null {
  if (!val || val.trim() === '') return null;
  const v = val.trim().toUpperCase();
  if (v === 'TRUE')  return true;
  if (v === 'FALSE') return false;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT VIAJES VEHÍCULO (Control de Viajes)');
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

  const sedesByNombre = new Map<string, string>();
  const allSedes = await prisma.sede.findMany({ select: { id: true, nombre: true } });
  for (const s of allSedes) {
    sedesByNombre.set(norm(s.nombre.trim().toLowerCase()), s.id);
  }
  console.log(`  ✓ ${allSedes.length} sedes`);

  // La columna VEHÍCULO a veces trae la placa (ej. "JW-72-913") y a veces el ID interno del
  // catálogo (ej. "VR3EF9HP8MJ512629", el VIN usado como id en el duplicado legado de esa placa)
  // — se resuelve contra ambos. La placa JW-72-913, YN-3672-F, etc. puede repetirse en el
  // catálogo (duplicado legado de AppSheet); para esa clave nos quedamos con el registro más
  // completo (más campos no nulos).
  const vehiculosByKey = new Map<string, string>();
  const vehiculosCompletitud = new Map<string, number>();
  const allVehiculos = await prisma.vehiculoCatalogo.findMany({
    select: { id: true, placas: true, nombre: true, marca: true, modelo: true, kmActual: true, sedeId: true, fotografia: true },
  });
  for (const v of allVehiculos) {
    vehiculosByKey.set(norm(v.id.trim()), v.id);
    if (!v.placas) continue;
    const p = norm(v.placas.trim());
    const completitud = [v.nombre, v.marca, v.modelo, v.kmActual, v.sedeId, v.fotografia].filter(x => x !== null && x !== undefined).length;
    const actual = vehiculosCompletitud.get(p);
    if (actual === undefined || completitud > actual) {
      vehiculosByKey.set(p, v.id);
      vehiculosCompletitud.set(p, completitud);
    }
  }
  // Alias conocidos que no coinciden ni con placa ni con id del catálogo (VINs sueltos que
  // aparecen en Vehiculos pero no como id del duplicado en VehiculoCatalogo, a diferencia de
  // VR3EF9HP8MJ512629 que sí quedó como id) — confirmado con el usuario caso por caso.
  const VEHICULO_ALIASES: Record<string, string> = {
    ZCG434C: 'YZJ-661-G', // coincide con el VIN del nombre de foto de YZJ-661-G (Rifther)
  };
  for (const [alias, catalogoId] of Object.entries(VEHICULO_ALIASES)) {
    if (vehiculosByKey.has(norm(catalogoId))) vehiculosByKey.set(norm(alias), vehiculosByKey.get(norm(catalogoId))!);
  }
  console.log(`  ✓ ${allVehiculos.length} vehículos del catálogo`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();
  const conductoresNR = new Map<string, string[]>();
  const sedesNR = new Map<string, string[]>();
  const vehiculosNR = new Map<string, string[]>();
  const bajaPorNR = new Map<string, string[]>();

  function incMap(m: Map<string, string[]>, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'Id')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const nombre = getCol(row, 'Nombre')?.trim();
    if (nombre && !tercerosByNombre.has(norm(nombre.toLowerCase()))) incMap(conductoresNR, nombre, id);

    const sede = getCol(row, 'Sede')?.trim();
    if (sede && !sedesByNombre.has(norm(sede.toLowerCase()))) incMap(sedesNR, sede, id);

    const vehiculo = getCol(row, 'Vehículo')?.trim() ?? getCol(row, 'Vehiculo')?.trim();
    if (vehiculo && !vehiculosByKey.has(norm(vehiculo))) incMap(vehiculosNR, vehiculo, id);

    const bajaPor = getCol(row, 'Baja por')?.trim();
    if (bajaPor && !tercerosByNombre.has(norm(bajaPor.toLowerCase()))) incMap(bajaPorNR, bajaPor, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function reportNR(label: string, m: Map<string, string[]>) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].slice(0, 10).forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
    if (m.size > 10) console.log(`    ... y ${m.size - 10} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  reportNR('Nombre (conductor)', conductoresNR);
  reportNR('Sede', sedesNR);
  reportNR('Vehículo (placa/ID)', vehiculosNR);
  reportNR('Baja por', bajaPorNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando viajes_vehiculo...');
  await prisma.viajeVehiculo.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'Id')?.trim();
    if (!id) { omitidos++; continue; }

    const nombreRaw = getCol(row, 'Nombre')?.trim();
    const conductorId = nombreRaw ? (tercerosByNombre.get(norm(nombreRaw.toLowerCase())) ?? null) : null;

    const sedeRaw = getCol(row, 'Sede')?.trim();
    const sedeId = sedeRaw ? (sedesByNombre.get(norm(sedeRaw.toLowerCase())) ?? null) : null;

    const vehiculoRaw = getCol(row, 'Vehículo')?.trim() ?? getCol(row, 'Vehiculo')?.trim();
    const vehiculoId = vehiculoRaw ? (vehiculosByKey.get(norm(vehiculoRaw)) ?? null) : null;

    const bajaPorRaw = getCol(row, 'Baja por')?.trim();
    const bajaPorId = bajaPorRaw ? (tercerosByNombre.get(norm(bajaPorRaw.toLowerCase())) ?? null) : null;

    try {
      await prisma.viajeVehiculo.create({
        data: {
          id,
          marcaTiempo:       parseDateTime(getCol(row, 'Marca de tiempo')),
          conductorId,
          sedeId,
          vehiculoId,
          kilometrajeActual: parseInt10(getCol(row, 'Kilometraje actual')),
          sitioOrigen:       getCol(row, 'Sitio origen')?.trim()  || null,
          sitioDestino:      getCol(row, 'Sitio destino')?.trim() || null,
          fotoTablero:       getCol(row, 'Foto tablero')?.trim()  || null,
          diligencia:        getCol(row, 'Diligencia')?.trim()    || null,
          novedadesEstado:   getCol(row, 'Novedades sobre estado del vehículo')?.trim() || null,
          estadoActual:      parseBool(getCol(row, 'Estado actual')),
          motivo:            getCol(row, 'Motivo')?.trim()   || null,
          bajaPorId,
          bajaEl:            parseDateTime(getCol(row, 'Baja el')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} viajes creados`);

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
