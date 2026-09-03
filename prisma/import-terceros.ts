/**
 * import-terceros.ts
 * Script consolidado de migración de Terceros.
 * Puebla: perfiles, cargos, tarifas, países, estados, ciudades,
 *         regimen_fiscal, uso_cfdi, sedes, terceros, tercero_clasificaciones,
 *         datos_fiscales, tercero_sedes_disponible, tercero_sedes_autorizacion,
 *         acceso_datos, hospitales (terceroId + ciudadId).
 *
 * Modo por defecto: sync incremental (upsert) — no borra nada, actualiza lo existente
 * y agrega lo nuevo. Seguro de correr repetidamente (ej. cron diario) sin perder datos
 * generados en la app (solicitudes de programación, etc.) que referencian Tercero.
 *
 * Uso:
 *   npx ts-node prisma/import-terceros.ts          → sync incremental (upsert), no destructivo
 *   npx ts-node prisma/import-terceros.ts --reset   → truncado limpio antes de repoblar
 *                                                      (usar solo para limpiar datos de prueba/basura)
 *
 * Reglas de deduplicación, fuzzy matching de hospitales, mapeos manuales conocidos
 * y logs detallados de cada decisión.
 */
import { ClasificacionTercero, PrismaClient, ReglaCrud, TablaProtegida } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();
const CSV_DIR        = path.join(os.homedir(), 'Desktop', 'tspine-csv');
const CSV_PATH       = path.join(CSV_DIR, 'SistemaTspine1.0 - Terceros.csv');
const CSV_PROG_PATH  = path.join(CSV_DIR, 'SistemaTspine1.0 - Programacion - Programacion.csv');
const RESET          = process.argv.includes('--reset');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const REGLA_POR_PERFIL: Record<string, ReglaCrud> = {
  SA:               'ALL_CHANGES',
  'Administración': 'ALL_CHANGES',
  Financiero:       'ALL_CHANGES',
  Contador:         'ALL_CHANGES',
  General:          'ADDS_AND_UPDATES',
  Comercial:        'ADDS_AND_UPDATES',
  Comercial_P:      'ADDS_AND_UPDATES',
  Comercial_Dir:    'ADDS_AND_UPDATES',
  Administración_Pro: 'ADDS_AND_UPDATES',
  Comad:            'ADDS_AND_UPDATES',
  Compras:          'ADDS_AND_UPDATES',
  Calidad:          'ADDS_AND_UPDATES',
  CoorLogistica:    'ADDS_AND_UPDATES',
  'Logística':      'ADDS_AND_UPDATES',
  'Jefe Almacén':   'ADDS_AND_UPDATES',
  Doctor:           'READ_ONLY',
  'Técnico':        'READ_ONLY',
  'Almacén':        'READ_ONLY',
  Vallarta:         'READ_ONLY',
};

const TABLAS_POR_PERFIL: Record<string, TablaProtegida[]> = {
  SA:               ['Cotizacion', 'Gastos', 'ProgramacionPagos', 'PagosEjecucion'],
  'Administración': ['Cotizacion', 'Gastos', 'ProgramacionPagos', 'PagosEjecucion'],
  Financiero:       ['Gastos', 'ProgramacionPagos', 'PagosEjecucion'],
  Contador:         ['Gastos', 'ProgramacionPagos', 'PagosEjecucion'],
  General:          ['Cotizacion', 'Gastos'],
  Comercial:        ['Cotizacion'],
  Comercial_P:      ['Cotizacion'],
  Comercial_Dir:    ['Cotizacion'],
  Administración_Pro: ['Cotizacion', 'Gastos', 'ProgramacionPagos', 'PagosEjecucion'],
  Comad:            ['Cotizacion'],
  Compras:          ['Cotizacion'],
  Vallarta:         ['Cotizacion'],
  Calidad:          [],
  CoorLogistica:    [],
  'Logística':      [],
  'Jefe Almacén':   [],
  Doctor:           [],
  'Técnico':        [],
  'Almacén':        [],
};

const CLASIFICACIONES: { col: string; val: ClasificacionTercero }[] = [
  { col: 'PARTICULAR',    val: 'PARTICULAR' },
  { col: 'DISTRIBUIDOR',  val: 'DISTRIBUIDOR' },
  { col: 'ASEGURADORA',   val: 'ASEGURADORA' },
  { col: 'CLIENTE',       val: 'CLIENTE' },
  { col: 'EMPLEADO',      val: 'EMPLEADO' },
  { col: 'HOSPITAL',      val: 'HOSPITAL' },
  { col: 'DOCTOR',        val: 'DOCTOR' },
  { col: 'COMISIONISTA',  val: 'COMISIONISTA' },
  { col: 'INVERSIONISTA', val: 'INVERSIONISTA' },
  { col: 'EMPRESA',       val: 'EMPRESA' },
  { col: 'PROVEEDOR',     val: 'PROVEEDOR' },
  { col: 'SEDE?',         val: 'SEDE' },
  { col: 'ALMACEN?',      val: 'ALMACEN' },
  { col: 'GRUPO?',        val: 'GRUPO' },
  { col: 'OTROS',         val: 'OTROS' },
];

// Mapeos manuales conocidos: nombre en DB (de programaciones) → nombre en CSV (de terceros)
const HOSPITAL_MAPEOS_MANUALES: Record<string, string> = {
  'Hopital Medcal': 'Hospital Medcal',
};

// Hospital a fusionar: mover sus programaciones al destino y eliminarlo
const HOSPITAL_FUSIONES: Record<string, string> = {
  'General Cancun':     'Hospital General de Cancun',
  'Hospital Medasisist': 'Hospital Medassist',
};

// Correcciones de ciudad String para hospitales (hospital.ciudad → nombre canónico)
const HOSPITAL_CIUDAD_CORRECCIONES: Record<string, string> = {
  'Innova Morelia': 'Morelia',
  'San Luis':       'San Luis',
};

// Normalización de ciudades: variantes / IDs del catálogo → nombre canónico con Title Case
// null = valor basura, no crear registro en ciudades
const CIUDAD_NORM_MAP: Record<string, string | null> = {
  // Filtrar — no son ciudades
  'Null':    null,
  'sn':      null,
  'NA':      null,
  'na':      null,
  'Global':  null,
  'Av Lopez portillo':                          null,
  'Hacienda de solis No2 Bosques de echegaray': null,

  // IDs del catálogo con display name diferente
  'Trpatitlan': 'Tepatitlán',
  'Tepatitlan': 'Tepatitlán',
  'Tulum':      'Tulúm',
  'Leon , GTO': 'León',

  // Ciudad de México — múltiples variantes
  'CDMX':             'Ciudad de México',
  'CMDX':             'Ciudad de México',
  'CIUDAD DE MEXICO': 'Ciudad de México',
  'CD MEXICO':        'Ciudad de México',
  'CD De México':     'Ciudad de México',
  'CD México':        'Ciudad de México',
  'Ciudad de Mexico': 'Ciudad de México',
  'Ciudad de México': 'Ciudad de México',
  'cdmx':             'Ciudad de México',
  'Cdmx':             'Ciudad de México',
  'Mexico DF':        'Ciudad de México',

  // Guadalajara
  'Guadalajara, Jalisco': 'Guadalajara',
  'GUADALAJARA, JAL':     'Guadalajara',
  'Guadajalajara':        'Guadalajara',
  'Gudalajara':           'Guadalajara',

  // Zapopan
  'ZAPOPAN':          'Zapopan',
  'ZAPOPAN, JALISCO': 'Zapopan',
  'Zapopan Jalisco':  'Zapopan',

  // León, Guanajuato
  'León':             'León',
  'León Guanajuato':  'León',
  'Leon GTO.':        'León',
  'León Gto':         'León',
  'Leon gto':         'León',
  'León, Guanajuato': 'León',
  'Leon, GTO.':       'León',
  'Leon':             'León',

  // Otros con variantes
  'NUEVO LAREDO':      'Nuevo Laredo',
  'CANCÚN':            'Cancún',
  'Cancun':            'Cancún',
  'MONTERREY, NL':     'Monterrey',
  'NEW YORK':          'New York',
  'NUEVA YORK':        'New York',
  'Saltillo, Coahuila': 'Saltillo',
  'Cd. del Carmen':    'Ciudad del Carmen',
  'Cozumet':           'Cozumel',
  'Istapalapa':        'Iztapalapa',
  'Floria':            'Florida',
  'Mexico':            'México',
  'NAYARIT':           'Nayarit',
  'apodaca':           'Apodaca',
};

// Mapeo de IDs internos de AppSheet → nombre real del cargo
const CARGO_ID_MAP: Record<string, string> = {
  '068ac63a': 'Gerente Administrativo',
  '0db7d754': 'Gerente de Redes Médicas',
  '422e53ac': 'Asesor Financiero',
  'c4d01a34': 'Analista de Calidad',
  'ca89b4fb': 'Analista GH',
  'ddd71fd0': 'Analista Contable',
  'd3b138cd': 'Tecnología',
  '8e3e133a': 'Desarrollador',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SISTEMA DE LOGS E ISSUES
// ═══════════════════════════════════════════════════════════════════════════════

type IssueType =
  | 'DUP_CSV'             // mismo NOMBRE COMPLETO, mismo ID TERCEROS → merge
  | 'DUP_NOMBRE_CONFLICTO'// mismo NOMBRE COMPLETO, distinto ID TERCEROS → registros separados
  | 'DUP_DB'              // nombre ya existía en DB → merge aplicado
  | 'CORREO_BASURA'       // correo inválido descartado
  | 'RFC_LIMPIADO'        // RFC inválido descartado
  | 'PAIS_NORM'           // país normalizado
  | 'MERGE_CAMPO'         // campo null en CSV, conservado valor de DB
  | 'PERFIL_DESCONOCIDO'  // perfil no reconocido, creado como READ_ONLY
  | 'SIN_NOMBRE'          // fila sin NOMBRE COMPLETO
  | 'NOMBRE_LIMPIADO'     // caracteres inválidos removidos del nombre
  | 'SEDE_NO_ENCONTRADA'  // SEDE?=true pero no existe en DB
  | 'HOSP_MATCH_EXACTO'   // hospital linkeado por nombre exacto
  | 'HOSP_MATCH_MANUAL'   // hospital linkeado por mapeo manual
  | 'HOSP_MATCH_FUZZY'    // hospital linkeado por fuzzy matching (>80%)
  | 'HOSP_REVISAR'        // fuzzy match entre 60-80%, requiere revisión manual
  | 'HOSP_TERCERO_MINIMO' // hospital con programaciones sin match → Tercero mínimo creado
  | 'HOSP_SIN_PROG'       // hospital sin programaciones y sin terceroId → requiere revisión
  | 'HOSP_CSV_SIN_PROG'   // hospital en CSV de terceros sin match en DB (sin programaciones) → importado como Tercero
  | 'HOSP_FUSION'         // programaciones movidas entre hospitales
  | 'ERROR';

const issueLog: { type: IssueType; msg: string }[] = [];

function logIssue(type: IssueType, msg: string) {
  issueLog.push({ type, msg });
}

function sampleRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN RESOLVER (tolerante a acentos)
// ═══════════════════════════════════════════════════════════════════════════════

let _colIndex: Map<string, string> | null = null;

function buildColIndex(row: Record<string, string>) {
  _colIndex = new Map();
  for (const key of Object.keys(row)) {
    const n = key.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!_colIndex.has(n)) _colIndex.set(n, key); // first column wins on name collision
  }
}

function getCol(row: Record<string, string>, name: string): string {
  if (!_colIndex) buildColIndex(row);
  const n = name.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const actual = _colIndex!.get(n);
  return actual ? (row[actual] ?? '') : (row[name] ?? '');
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS GENERALES
// ═══════════════════════════════════════════════════════════════════════════════

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function cleanNombre(nombre: string): { value: string; limpiado: boolean } {
  const limpio = nombre.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim();
  return { value: limpio, limpiado: limpio !== nombre };
}

function parseBool(val: string): boolean | null {
  const v = val?.trim()?.toUpperCase();
  if (v === 'TRUE')  return true;
  if (v === 'FALSE') return false;
  return null;
}

function parseList(val: string): string[] {
  if (!val?.trim()) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

function parseRegimenFiscalCode(val: string): string | null {
  const v = val?.trim();
  if (!v) return null;
  const match = v.match(/^\((\w+)\)/);
  if (match) return match[1];
  if (/^\d+$/.test(v)) return v;
  return `__INVALIDO__:${v}`;
}

const MESES_ES: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12,
};

function parseDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const v = raw.trim();

  const slashParts = v.split('/');
  if (slashParts.length === 3) {
    const [d, m, y] = slashParts.map(Number);
    if (!d || !m || !y || y < 1900) return null;
    return new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  // Formato "20-oct-1992" (día-mes abreviado en español-año), predominante en la
  // columna FECHA DE NACIMIENTO exportada de Sheets.
  const dashMatch = v.match(/^(\d{1,2})-([a-zA-Zñ]+)-(\d{4})$/);
  if (dashMatch) {
    const [, dStr, mesStr, yStr] = dashMatch;
    const d = Number(dStr);
    const y = Number(yStr);
    const m = MESES_ES[mesStr.toLowerCase()];
    if (!d || !m || !y || y < 1900) return null;
    return new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  return null;
}

function parseDateTime(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const [datePart, timePart] = raw.trim().split(' ');
  if (!datePart) return null;
  const parts = datePart.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  const [h, min, s] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
  return new Date(Date.UTC(y, m - 1, d, h ?? 0, min ?? 0, s ?? 0));
}

function cleanCorreo(val: string): { value: string | null; descartado: string | null } {
  const v = val?.trim().toLowerCase();
  if (!v) return { value: null, descartado: null };
  const basura = ['.', 'na', 'n', 'sn', 'n/a', 'no', 'none', '-', 'correo'];
  if (basura.includes(v)) return { value: null, descartado: v };
  if (!v.includes('@') || !v.includes('.')) return { value: null, descartado: v };
  return { value: v, descartado: null };
}

function cleanRfc(val: string): { value: string | null; descartado: string | null } {
  const v = val?.trim().toUpperCase();
  if (!v) return { value: null, descartado: null };
  if (['NO ESTA', 'NOESTA', 'NO_ESTA', '-', 'N/A', 'NA', 'NO'].includes(v))
    return { value: null, descartado: v };
  return { value: v, descartado: null };
}

function cleanPais(val: string): { value: string | null; original: string | null } {
  const v = val?.trim();
  if (!v) return { value: null, original: null };
  if (['.', 'N', 'n', 'na', 'sn', 'NA', '-', '--'].includes(v)) return { value: null, original: null };
  const normalizar: Record<string, string> = {
    Mexico: 'México', Méxicao: 'México', Mexic: 'México', USA: 'Estados Unidos',
  };
  const norm = normalizar[v];
  return { value: norm ?? v, original: norm ? v : null };
}

function cleanCiudad(val: string): string | null {
  const v = val?.trim();
  if (!v || v === '--' || v === '-' || v.length === 1) return null;
  if (Object.prototype.hasOwnProperty.call(CIUDAD_NORM_MAP, v)) return CIUDAD_NORM_MAP[v];
  return v;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUZZY MATCHING (para hospitales)
// ═══════════════════════════════════════════════════════════════════════════════

function normText(text: string): string {
  return (text ?? '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function wordOverlapScore(a: string, b: string): number {
  const wa = new Set(normText(a).split(' ').filter(Boolean));
  const wb = new Set(normText(b).split(' ').filter(Boolean));
  const intersect = [...wa].filter(w => wb.has(w)).length;
  return intersect / Math.max(wa.size, wb.size);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHES
// ═══════════════════════════════════════════════════════════════════════════════

const paisCache   = new Map<string, string>();
const estadoCache = new Map<string, string>();
const ciudadCache = new Map<string, string>();
const cargoCache  = new Map<string, string>();
const tarifaCache = new Map<string, string>();
const perfilCache = new Map<string, string>();

// ═══════════════════════════════════════════════════════════════════════════════
// CATÁLOGOS
// ═══════════════════════════════════════════════════════════════════════════════

async function getOrCreatePais(nombre: string): Promise<string> {
  if (paisCache.has(nombre)) return paisCache.get(nombre)!;
  const r = await prisma.pais.upsert({ where: { nombre }, update: {}, create: { nombre } });
  paisCache.set(nombre, r.id);
  return r.id;
}

async function getOrCreateEstado(nombre: string, paisNombre?: string | null): Promise<string> {
  const key = `${nombre}|${paisNombre ?? ''}`;
  if (estadoCache.has(key)) return estadoCache.get(key)!;
  const paisId = paisNombre ? await getOrCreatePais(paisNombre) : undefined;
  const existing = await prisma.estado.findFirst({ where: { nombre } });
  if (existing) {
    if (paisId && !existing.paisId) await prisma.estado.update({ where: { id: existing.id }, data: { paisId } });
    estadoCache.set(key, existing.id);
    return existing.id;
  }
  const r = await prisma.estado.create({ data: { nombre, paisId } });
  estadoCache.set(key, r.id);
  return r.id;
}

async function getOrCreateCiudad(nombre: string, estadoNombre?: string | null): Promise<string> {
  const norm = Object.prototype.hasOwnProperty.call(CIUDAD_NORM_MAP, nombre)
    ? CIUDAD_NORM_MAP[nombre]
    : nombre;
  if (!norm) return ''; // valor basura — el llamador debe ignorar strings vacíos
  const key = `${norm}|${estadoNombre ?? ''}`;
  if (ciudadCache.has(key)) return ciudadCache.get(key)!;
  const estadoId = estadoNombre ? await getOrCreateEstado(estadoNombre) : undefined;
  const existing = await prisma.ciudad.findFirst({ where: { nombre: norm } });
  if (existing) {
    if (estadoId && !existing.estadoId) await prisma.ciudad.update({ where: { id: existing.id }, data: { estadoId } });
    ciudadCache.set(key, existing.id);
    return existing.id;
  }
  const r = await prisma.ciudad.create({ data: { nombre: norm, estadoId } });
  ciudadCache.set(key, r.id);
  return r.id;
}

async function getOrCreateCargo(nombre: string): Promise<string> {
  const resolved = CARGO_ID_MAP[nombre] ?? nombre;
  if (cargoCache.has(resolved)) return cargoCache.get(resolved)!;
  const r = await prisma.cargo.upsert({ where: { nombre: resolved }, update: {}, create: { nombre: resolved } });
  cargoCache.set(resolved, r.id);
  return r.id;
}

async function getOrCreateTarifa(codigo: string): Promise<string | null> {
  const c = codigo?.trim();
  if (!c || c.toUpperCase() === 'FALSE') return null;
  if (tarifaCache.has(c)) return c;
  // Fallback: si el código no existe en DB (ya sembrado por seed-catalogos), crear registro mínimo
  await prisma.tarifa.upsert({ where: { id: c }, update: {}, create: { id: c, nombre: c } });
  tarifaCache.set(c, c);
  return c;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MERGE HELPER
// ═══════════════════════════════════════════════════════════════════════════════

function mergeNonNull(
  existing: Record<string, any>,
  incoming: Record<string, any>,
  nombre: string,
): Record<string, any> {
  const result: Record<string, any> = {};
  const conservados: string[] = [];
  const relevantes = ['correo', 'cargoId', 'tarifaId', 'ciudadId', 'paisId', 'perfilId', 'sedeId', 'grupo', 'observaciones'];

  for (const [key, val] of Object.entries(incoming)) {
    if (val === null || val === undefined) {
      if (existing[key] != null) {
        result[key] = existing[key];
        if (relevantes.includes(key)) conservados.push(key);
      }
    } else {
      result[key] = val;
    }
  }

  if (conservados.length > 0)
    logIssue('MERGE_CAMPO', `"${nombre}" — conservado de DB: [${conservados.join(', ')}]`);
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRACIÓN DE SUBENTIDADES
// ═══════════════════════════════════════════════════════════════════════════════

async function migrarClasificaciones(terceroId: string, row: Record<string, string>) {
  for (const { col, val } of CLASIFICACIONES) {
    if (parseBool(getCol(row, col)) === true) {
      await prisma.terceroClasificacion.upsert({
        where:  { terceroId_clasificacion: { terceroId, clasificacion: val } },
        update: {},
        create: { terceroId, clasificacion: val },
      });
    }
  }
}

async function migrarDatosFiscales(terceroId: string, row: Record<string, string>, nombre: string) {
  const rfcResult = cleanRfc(getCol(row, 'RFC'));
  if (rfcResult.descartado)
    logIssue('RFC_LIMPIADO', `"${nombre}" — RFC "${rfcResult.descartado}" descartado`);

  const rfc          = rfcResult.value;
  const razonSocial  = getCol(row, 'RAZON SOCIAL')?.trim() || null;
  const regimenRaw   = parseRegimenFiscalCode(getCol(row, 'REGIMENFISCAL'));
  const invalido     = regimenRaw?.startsWith('__INVALIDO__');
  if (invalido)
    logIssue('RFC_LIMPIADO', `"${nombre}" — REGIMENFISCAL formato no reconocido: "${regimenRaw!.replace('__INVALIDO__:', '')}"`);
  const regimenId  = invalido ? null : regimenRaw;
  const cpFiscal   = getCol(row, 'CODIGOPOSTALFISCAL')?.trim() || null;
  const usoCfdiId  = getCol(row, 'USOCFDI')?.trim() || null;
  const dirFiscal  = getCol(row, 'DIRECCION FISCAL')?.trim() || null;

  if (!rfc && !razonSocial && !regimenId && !usoCfdiId && !dirFiscal) return;

  if (regimenId) await prisma.regimenFiscal.upsert({ where: { id: regimenId }, update: {}, create: { id: regimenId, descripcion: regimenId } });
  if (usoCfdiId) await prisma.usoCfdi.upsert({ where: { id: usoCfdiId }, update: {}, create: { id: usoCfdiId, descripcion: usoCfdiId } });

  const createData = { terceroId, rfc, razonSocial, regimenFiscalId: regimenId, codigoPostalFiscal: cpFiscal, usoCfdiId, direccionFiscal: dirFiscal };
  const existing   = await prisma.datosFiscales.findUnique({ where: { terceroId } });
  const updateData = existing
    ? mergeNonNull(existing as any, { rfc, razonSocial, regimenFiscalId: regimenId, codigoPostalFiscal: cpFiscal, usoCfdiId, direccionFiscal: dirFiscal }, `${nombre} (fiscal)`)
    : createData;

  await prisma.datosFiscales.upsert({ where: { terceroId }, update: updateData, create: createData });
}

async function migrarSedesRelaciones(terceroId: string, row: Record<string, string>) {
  const dispVal = getCol(row, 'SEDES DISPONIBLE') || getCol(row, 'SEDES DISPONBLE');
  for (const sedeNombre of parseList(dispVal)) {
    const sedeId = slugify(sedeNombre);
    await prisma.sede.upsert({ where: { id: sedeId }, update: {}, create: { id: sedeId, nombre: sedeNombre } });
    await prisma.terceroSedeDisponible.upsert({
      where:  { terceroId_sedeId: { terceroId, sedeId } },
      update: {}, create: { terceroId, sedeId },
    }).catch(() => {});
  }
  for (const sedeNombre of parseList(getCol(row, 'SEDES AUTORIZACION'))) {
    const sedeId = slugify(sedeNombre);
    await prisma.sede.upsert({ where: { id: sedeId }, update: {}, create: { id: sedeId, nombre: sedeNombre } });
    await prisma.terceroSedeAutorizacion.upsert({
      where:  { terceroId_sedeId: { terceroId, sedeId } },
      update: {}, create: { terceroId, sedeId },
    }).catch(() => {});
  }
}

async function buildTerceroBaseData(row: Record<string, string>, nombre: string) {
  const ciudadNomb   = cleanCiudad(getCol(row, 'CIUDAD'));
  const estadoNomb   = getCol(row, 'ESTADO')?.trim() || null;
  const paisResult   = cleanPais(getCol(row, 'PAIS') || getCol(row, 'PAÍS'));
  const cargoNomb    = getCol(row, 'CARGO')?.trim() || null;
  const tarifaNomb   = getCol(row, 'TARIFA')?.trim() || null;
  const sedeNomb     = getCol(row, 'SEDE')?.trim() || null;
  const perfilNomb   = getCol(row, 'PERFIL')?.trim() || null;
  const nomComercial = getCol(row, 'NOMBRE COMERCIAL')?.trim() || null;
  const idLegacy     = (getCol(row, 'ID TERCEROS')?.trim().replace(/\s+/g, ' ')) || nombre;

  if (paisResult.original)
    logIssue('PAIS_NORM', `"${nombre}" — país "${paisResult.original}" → "${paisResult.value}"`);

  return {
    idLegacy,
    nombreCompleto:  nombre,
    primerNombre:    getCol(row, 'PRIMER NOMBRE')?.trim()    || null,
    segundoNombre:   getCol(row, 'SEGUNDO NOMBRE')?.trim()   || null,
    primerApellido:  getCol(row, 'PRIMER APELLIDO')?.trim()  || null,
    segundoApellido: getCol(row, 'SEGUNDO APELLIDO')?.trim() || null,
    nombreComercial: (nomComercial === nombre) ? null : nomComercial,
    fechaNacimiento: parseDate(getCol(row, 'FECHA DE NACIMIENTO')),
    fotoPerfilUrl:   getCol(row, 'FOTO DE PERFIL')?.trim() || null,
    observaciones:   getCol(row, 'OBSERVACIONES')?.trim()  || null,
    grupo:           getCol(row, 'GRUPO')?.trim() || null,
    mir:             parseBool(getCol(row, 'MIR?')),
    tipoPersona:     parseBool(getCol(row, 'TIPO DE PERSONA')),
    tipoContacto:    parseBool(getCol(row, 'TIPO DE CONTACTO')),
    activo:          true as const,
    creadoEn:        parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
    creadoPor:       getCol(row, 'REGISTRADO POR')?.trim() || null,
    perfilId:        perfilNomb ? (perfilCache.get(perfilNomb) ?? slugify(perfilNomb)) : null,
    sedeId:          sedeNomb   ? slugify(sedeNomb)   : null,
    cargoId:         cargoNomb  ? await getOrCreateCargo(cargoNomb)   : null,
    tarifaId:        tarifaNomb ? await getOrCreateTarifa(tarifaNomb) : null,
    ciudadId:        ciudadNomb ? await getOrCreateCiudad(ciudadNomb, estadoNomb) : null,
    estadoId:        estadoNomb ? await getOrCreateEstado(estadoNomb, paisResult.value) : null,
    paisId:          paisResult.value ? await getOrCreatePais(paisResult.value) : null,
  };
}

async function procesarTercero(row: Record<string, string>, nombre: string, esHospital = false): Promise<string> {
  const data         = await buildTerceroBaseData(row, nombre);
  const correoResult = cleanCorreo(getCol(row, 'CORREO'));

  if (correoResult.descartado)
    logIssue('CORREO_BASURA', `"${nombre}" — correo "${correoResult.descartado}" descartado`);

  const existente = await prisma.tercero.findFirst({ where: { nombreCompleto: nombre } });

  if (existente) {
    if (!esHospital) logIssue('DUP_DB', `"${nombre}" ya existe en DB — merge aplicado`);
    const updateData = mergeNonNull(existente as any, { ...data, idLegacy: existente.idLegacy ?? data.idLegacy }, nombre);

    if (correoResult.value && !existente.correo) {
      updateData.correo = correoResult.value;
    }

    await prisma.tercero.update({ where: { id: existente.id }, data: updateData });
    return existente.id;
  }

  const nuevo = await prisma.tercero.create({ data: { ...data, correo: correoResult.value } });
  return nuevo.id;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ No se encontró: ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows: Record<string, string>[] = parse(content, {
    columns: true, skip_empty_lines: true,
    relax_quotes: true, relax_column_count: true, bom: true,
  });


  if (rows.length > 0) buildColIndex(rows[0]);

  console.log('\n' + '═'.repeat(70));
  console.log('  IMPORTACIÓN DE TERCEROS');
  console.log('═'.repeat(70));
  console.log(`\n📂 CSV cargado: ${rows.length} filas totales\n`);

  // ── PRE-SCAN: análisis de duplicados en CSV ─────────────────────────────────
  console.log('[PRE] Escaneando CSV...');

  const todasLasColumnas = rows.length > 0 ? Object.keys(rows[0]) : [];
  const gruposPorNombre  = new Map<string, Record<string, string>[]>();
  let filasConflicto     = 0;
  let filasSinNombre     = 0;
  let nombresLimpiados   = 0;

  for (const row of rows) {
    let nombre = getCol(row, 'NOMBRE COMPLETO')?.trim();
    if (!nombre) { filasSinNombre++; logIssue('SIN_NOMBRE', `Fila sin NOMBRE COMPLETO`); continue; }

    // Limpiar caracteres inválidos
    const limpiado = cleanNombre(nombre);
    if (limpiado.limpiado) {
      logIssue('NOMBRE_LIMPIADO', `"${nombre}" → "${limpiado.value}"`);
      nombre = limpiado.value;
      nombresLimpiados++;
    }

    if (!gruposPorNombre.has(nombre)) gruposPorNombre.set(nombre, []);
    gruposPorNombre.get(nombre)!.push(row);
  }

  const totalUnicosEnCsv = gruposPorNombre.size;
  const duplicadosGrupos = [...gruposPorNombre.entries()].filter(([, g]) => g.length > 1);

  console.log(`  Total filas en CSV          : ${rows.length}`);
  console.log(`  Filas sin NOMBRE COMPLETO   : ${filasSinNombre}`);
  console.log(`  Nombres limpiados (chars)   : ${nombresLimpiados}`);
  console.log(`  Nombres únicos              : ${totalUnicosEnCsv}`);
  console.log(`  Grupos con nombre duplicado : ${duplicadosGrupos.length}`);

  // Analizar cada grupo duplicado
  let dupConflicto = 0;
  let dupIdenticos = 0;

  for (const [nombre, grupo] of duplicadosGrupos) {
    const idLegacies = grupo.map(r => getCol(r, 'ID TERCEROS')?.trim().replace(/\s+/g, ' ') ?? '').filter(Boolean);
    const distintos  = new Set(idLegacies);

    // Detectar campos con valores distintos
    const camposDifieren: string[] = [];
    for (const col of todasLasColumnas) {
      const valores = grupo.map(r => (r[col] ?? '').trim());
      const set = new Set(valores.filter(v => v !== ''));
      if (set.size > 1) camposDifieren.push(col);
    }

    if (distintos.size > 1) {
      // IDs diferentes = posiblemente entidades distintas con el mismo nombre
      dupConflicto++;
      filasConflicto += grupo.length - 1;
      logIssue('DUP_NOMBRE_CONFLICTO',
        `"${nombre}" — ${grupo.length} filas con ID TERCEROS distintos: [${[...distintos].join(' | ')}] ` +
        `— se crearán registros separados usando ID TERCEROS como nombre para los adicionales`);
    } else if (camposDifieren.length > 0) {
      logIssue('DUP_CSV',
        `"${nombre}" — ${grupo.length} filas, difieren en: [${camposDifieren.join(', ')}] — merge aplicado (primer valor no-null prevalece)`);
      dupIdenticos++;
    } else {
      logIssue('DUP_CSV', `"${nombre}" — ${grupo.length} filas idénticas — sin pérdida de datos`);
      dupIdenticos++;
    }
  }

  console.log(`    → ${dupConflicto} grupos con ID TERCEROS distintos (se crearán registros separados)`);
  console.log(`    → ${duplicadosGrupos.length - dupConflicto} grupos idénticos o con mismo ID (merge sin pérdida)`);
  console.log(`    → ${rows.length - totalUnicosEnCsv - filasConflicto} filas omitidas por duplicado exacto`);

  // ── PASO 0: Truncado limpio (solo con --reset) ──────────────────────────────
  if (RESET) {
    console.log('\n[0/7] --reset: truncando datos anteriores de terceros...');
    // Eliminar junctions que referencian terceros antes de borrar terceros (FK constraint)
    const delMed = await prisma.programacionMedico.deleteMany({});
    const delTec = await prisma.programacionTecnico.deleteMany({});
    console.log(`  ✓ ${delMed.count} programacion_medicos eliminados`);
    console.log(`  ✓ ${delTec.count} programacion_tecnicos eliminados`);
    await prisma.$executeRaw`UPDATE hospitales SET tercero_id = NULL`;
    await prisma.accesoDato.deleteMany({});
    await prisma.terceroSedeDisponible.deleteMany({});
    await prisma.terceroSedeAutorizacion.deleteMany({});
    await prisma.terceroClasificacion.deleteMany({});
    await prisma.datosFiscales.deleteMany({});
    // NOTA: solicitud_programacion / solicitud_programacion_medicos referencian Tercero
    // sin cascade — si tienen filas, este deleteMany truena a propósito (P2003) en vez
    // de borrar en silencio datos generados por la app. Resolver manualmente antes de --reset.
    const deletedTerceros = await prisma.tercero.deleteMany({});
    console.log(`  ✓ ${deletedTerceros.count} terceros eliminados`);
    console.log(`  ✓ Tablas relacionadas limpiadas`);
  } else {
    console.log('\n[0/7] Sync incremental — sin truncado (usa --reset para limpiar todo)');
  }

  // ── PASO 1: Perfiles ────────────────────────────────────────────────────────
  console.log('\n[1/7] Creando perfiles...');
  perfilCache.set('SA', 'SA');
  // No se gestiona vía REGLA_POR_PERFIL (lo administra el sistema de auth/permisos real),
  // pero sí necesita existir como fila en la BD para que la FK de Tercero.perfilId no
  // truene en una base recién truncada. update:{} para no pisar lo que ya haya ahí.
  await prisma.perfil.upsert({ where: { id: 'SA' }, update: {}, create: { id: 'SA', nombre: 'SA', reglas: 'ALL_CHANGES' } });
  for (const [nombre, reglas] of Object.entries(REGLA_POR_PERFIL)) {
    if (nombre === 'SA') continue;
    const id = slugify(nombre);
    await prisma.perfil.upsert({ where: { id }, update: { nombre, reglas }, create: { id, nombre, reglas } });
    perfilCache.set(nombre, id);
  }
  for (const row of rows) {
    const p = getCol(row, 'PERFIL')?.trim();
    if (p && !REGLA_POR_PERFIL[p] && p !== 'SA') {
      logIssue('PERFIL_DESCONOCIDO', `Perfil "${p}" no reconocido — creado como READ_ONLY`);
      await prisma.perfil.upsert({
        where:  { id: slugify(p) },
        update: {},
        create: { id: slugify(p), nombre: p, reglas: 'READ_ONLY' },
      });
      REGLA_POR_PERFIL[p] = 'READ_ONLY';
      TABLAS_POR_PERFIL[p] = [];
      perfilCache.set(p, slugify(p));
    }
  }
  console.log(`  ✓ ${Object.keys(REGLA_POR_PERFIL).length} perfiles`);

  // ── PASO 2: Catálogos ───────────────────────────────────────────────────────
  console.log('\n[2/7] Creando catálogos...');
  for (const row of rows) {
    const cargoNomb  = getCol(row, 'CARGO')?.trim();
    const tarifaNomb = getCol(row, 'TARIFA')?.trim();
    const paisResult = cleanPais(getCol(row, 'PAIS') || getCol(row, 'PAÍS'));
    const estado     = getCol(row, 'ESTADO')?.trim() || null;
    const ciudad     = cleanCiudad(getCol(row, 'CIUDAD'));
    if (cargoNomb)        await getOrCreateCargo(cargoNomb);
    if (tarifaNomb)       await getOrCreateTarifa(tarifaNomb);
    if (paisResult.value) await getOrCreatePais(paisResult.value);
    if (estado)           await getOrCreateEstado(estado, paisResult.value);
    if (ciudad)           await getOrCreateCiudad(ciudad, estado);
  }
  console.log(`  ✓ ${cargoCache.size} cargos`);
  console.log(`  ✓ ${tarifaCache.size} tarifas`);
  console.log(`  ✓ ${paisCache.size} países, ${estadoCache.size} estados, ${ciudadCache.size} ciudades`);

  // ── PASO 3: Enriquecer Sedes ────────────────────────────────────────────────
  console.log('\n[3/7] Enriqueciendo sedes...');
  const sedeRows = rows.filter(r => parseBool(getCol(r, 'SEDE?')) === true);
  let sedesOk = 0;
  for (const row of sedeRows) {
    const nombre = getCol(row, 'NOMBRE COMPLETO')?.trim();
    if (!nombre) continue;
    const ok = await prisma.sede.update({
      where: { id: slugify(nombre) },
      data:  { ciudad: cleanCiudad(getCol(row, 'CIUDAD')), estado: getCol(row, 'ESTADO')?.trim() || null, observaciones: getCol(row, 'OBSERVACIONES')?.trim() || null },
    }).catch(() => null);
    if (!ok) logIssue('SEDE_NO_ENCONTRADA', `"${nombre}" marcada como SEDE pero no existe en DB`);
    else sedesOk++;
  }
  console.log(`  ✓ ${sedesOk} sedes enriquecidas`);

  // ── PASO 4: Hospitales — fusiones manuales ──────────────────────────────────
  console.log('\n[4/7] Aplicando fusiones de hospitales...');
  for (const [origen, destino] of Object.entries(HOSPITAL_FUSIONES)) {
    const hospOrigen  = await prisma.hospital.findFirst({ where: { nombre: origen } });
    const hospDestino = await prisma.hospital.findFirst({ where: { nombre: destino } });
    if (!hospOrigen)  { console.log(`  ℹ️  "${origen}" no existe en DB — omitido`); continue; }
    if (!hospDestino) { console.log(`  ℹ️  "${destino}" no existe en DB — omitido`); continue; }
    const moved = await prisma.programacion.updateMany({ where: { hospitalId: hospOrigen.id }, data: { hospitalId: hospDestino.id } });
    await prisma.hospital.delete({ where: { id: hospOrigen.id } });
    logIssue('HOSP_FUSION', `"${origen}" → "${destino}" (${moved.count} programaciones movidas, hospital eliminado)`);
  }

  // ── PASO 5: Hospitales — ciudad String → ciudadId FK ───────────────────────
  console.log('\n[5/7] Procesando hospitales (terceroId + ciudadId)...');
  const hospitalesDb = await prisma.hospital.findMany({
    include: { _count: { select: { programaciones: true } } },
  });
  console.log(`  ${hospitalesDb.length} hospitales en DB`);

  // Hospitales del CSV — nombres limpios para que el matching exacto y fuzzy funcionen
  const csvHospRows = rows.filter(r => parseBool(getCol(r, 'HOSPITAL')) === true);
  // Construir entradas (nombreLimpio, row) para reutilizar en todos los paths
  const csvHospEntries: { nombre: string; row: Record<string, string> }[] = csvHospRows
    .map(r => ({ nombre: cleanNombre(getCol(r, 'NOMBRE COMPLETO')?.trim() ?? '').value, row: r }))
    .filter(e => !!e.nombre);
  const csvHospNames = csvHospEntries.map(e => e.nombre);

  let hospExactos = 0, hospManuales = 0, hospFuzzyAlto = 0, hospFuzzyMedio = 0, hospMinimo = 0, hospSinProg = 0;
  const processedCsvHospNombres = new Set<string>(); // nombres (limpios) del CSV procesados en step 5

  for (const hosp of hospitalesDb) {
    if (hosp.terceroId) continue; // ya tiene tercero

    // 1. Match exacto
    const matchExacto = csvHospNames.find(n => n === hosp.nombre);
    if (matchExacto) {
      const csvRow    = csvHospEntries.find(e => e.nombre === matchExacto)!.row;
      const terceroId = await procesarTercero(csvRow, matchExacto, true);
      const tCiudad   = !hosp.ciudadId ? await prisma.tercero.findUnique({ where: { id: terceroId }, select: { ciudadId: true } }) : null;
      await prisma.hospital.update({ where: { id: hosp.id }, data: { terceroId, ...(tCiudad?.ciudadId ? { ciudadId: tCiudad.ciudadId } : {}) } });
      await migrarClasificaciones(terceroId, csvRow);
      await migrarDatosFiscales(terceroId, csvRow, matchExacto);
      processedCsvHospNombres.add(matchExacto);
      logIssue('HOSP_MATCH_EXACTO', `"${hosp.nombre}" — match exacto`);
      hospExactos++;
      continue;
    }

    // 2. Mapeo manual conocido
    const nombreCsv = HOSPITAL_MAPEOS_MANUALES[hosp.nombre];
    if (nombreCsv) {
      const nombreCsvLimp = cleanNombre(nombreCsv).value;
      const entry = csvHospEntries.find(e => e.nombre === nombreCsvLimp);
      if (entry) {
        const terceroId = await procesarTercero(entry.row, nombreCsvLimp, true);
        const conflicto = await prisma.hospital.findFirst({
          where:   { terceroId, id: { not: hosp.id } },
          include: { _count: { select: { programaciones: true } } },
        });
        if (conflicto) {
          if (conflicto._count.programaciones === 0) {
            await prisma.hospital.update({ where: { id: conflicto.id }, data: { terceroId: null } });
          } else {
            logIssue('ERROR', `"${hosp.nombre}" — Tercero "${nombreCsvLimp}" ya está linkeado a "${conflicto.nombre}" con programaciones`);
            continue;
          }
        }
        const tCiudadM  = !hosp.ciudadId ? await prisma.tercero.findUnique({ where: { id: terceroId }, select: { ciudadId: true } }) : null;
        await prisma.hospital.update({ where: { id: hosp.id }, data: { terceroId, ...(tCiudadM?.ciudadId ? { ciudadId: tCiudadM.ciudadId } : {}) } });
        await migrarClasificaciones(terceroId, entry.row);
        await migrarDatosFiscales(terceroId, entry.row, nombreCsvLimp);
        processedCsvHospNombres.add(nombreCsvLimp);
        logIssue('HOSP_MATCH_MANUAL', `"${hosp.nombre}" → Tercero "${nombreCsvLimp}"`);
        hospManuales++;
        continue;
      }
    }

    // 3. Fuzzy matching (sobre nombres ya limpios → scores correctos)
    const scores = csvHospNames
      .map(n => ({ nombre: n, score: wordOverlapScore(hosp.nombre, n) }))
      .filter(x => x.score >= 0.6)
      .sort((a, b) => b.score - a.score);

    if (scores.length > 0) {
      const best = scores[0];
      if (best.score > 0.8) {
        const csvRow    = csvHospEntries.find(e => e.nombre === best.nombre)!.row;
        const terceroId = await procesarTercero(csvRow, best.nombre, true);
        const tCiudadF  = !hosp.ciudadId ? await prisma.tercero.findUnique({ where: { id: terceroId }, select: { ciudadId: true } }) : null;
        await prisma.hospital.update({ where: { id: hosp.id }, data: { terceroId, ...(tCiudadF?.ciudadId ? { ciudadId: tCiudadF.ciudadId } : {}) } });
        await migrarClasificaciones(terceroId, csvRow);
        await migrarDatosFiscales(terceroId, csvRow, best.nombre);
        processedCsvHospNombres.add(best.nombre);
        logIssue('HOSP_MATCH_FUZZY', `"${hosp.nombre}" → "${best.nombre}" (score: ${Math.round(best.score * 100)}%)`);
        hospFuzzyAlto++;
        continue;
      } else {
        logIssue('HOSP_REVISAR', `"${hosp.nombre}" — mejor match fuzzy: "${best.nombre}" (${Math.round(best.score * 100)}%) — no aplicado, creando Tercero mínimo`);
        hospFuzzyMedio++;
        // fall through → Tercero mínimo
      }
    }

    // 4. Sin match — crear Tercero mínimo si tiene programaciones
    if (hosp._count.programaciones > 0) {
      const tercero = await prisma.tercero.create({ data: { nombreCompleto: hosp.nombre, activo: true, idLegacy: hosp.nombre } });
      await prisma.terceroClasificacion.create({ data: { terceroId: tercero.id, clasificacion: 'HOSPITAL' } });
      await prisma.hospital.update({ where: { id: hosp.id }, data: { terceroId: tercero.id } });
      logIssue('HOSP_TERCERO_MINIMO', `"${hosp.nombre}" — sin match en CSV, Tercero mínimo creado (${hosp._count.programaciones} programaciones)`);
      hospMinimo++;
    } else {
      logIssue('HOSP_SIN_PROG', `"${hosp.nombre}" — sin match en CSV y sin programaciones — revisar manualmente`);
      hospSinProg++;
    }
  }

  // Hospitales en CSV de terceros sin match en DB (no tuvieron programaciones)
  let hospCsvSinProgEnDb = 0;
  for (const { nombre, row: csvRow } of csvHospEntries) {
    if (!nombre || processedCsvHospNombres.has(nombre)) continue;
    try {
      const terceroId  = await procesarTercero(csvRow, nombre, true);
      await migrarClasificaciones(terceroId, csvRow);
      await migrarDatosFiscales(terceroId, csvRow, nombre);
      await migrarSedesRelaciones(terceroId, csvRow);

      const tCiudadS   = await prisma.tercero.findUnique({ where: { id: terceroId }, select: { ciudadId: true } });
      const ciudadData = tCiudadS?.ciudadId ? { ciudadId: tCiudadS.ciudadId } : {};
      const hospId     = slugify(nombre).slice(0, 36) || nombre.slice(0, 36);
      await prisma.hospital.upsert({
        where:  { id: hospId },
        update: { terceroId, ...ciudadData },
        create: { id: hospId, nombre, terceroId, ...ciudadData },
      });

      logIssue('HOSP_CSV_SIN_PROG', `"${nombre}" — sin programaciones en DB — importado como Tercero + Hospital`);
      hospCsvSinProgEnDb++;
    } catch (err: any) {
      logIssue('ERROR', `Hospital CSV sin prog "${nombre}": ${err.message}`);
    }
  }

  console.log(`  ✓ Match exacto      : ${hospExactos}`);
  console.log(`  ✓ Match manual      : ${hospManuales}`);
  console.log(`  ✓ Fuzzy >80%        : ${hospFuzzyAlto}`);
  console.log(`  ✓ Tercero mínimo    : ${hospMinimo}`);
  console.log(`  ✓ CSV sin prog en DB: ${hospCsvSinProgEnDb} (importados como Tercero + Hospital)`);
  console.log(`  ⚠ Fuzzy 60-80%      : ${hospFuzzyMedio} (revisar manual)`);
  console.log(`  ⚠ Sin prog/sin match: ${hospSinProg} (revisar manual)`);

  // ── PASO 6: Terceros ────────────────────────────────────────────────────────
  console.log('\n[6/7] Importando terceros...');
  const terceroRows = rows.filter(r =>
    parseBool(getCol(r, 'HOSPITAL')) !== true &&
    parseBool(getCol(r, 'SEDE?'))    !== true
  );

  let creados = 0, actualizados = 0, errores = 0, omitidos = 0;
  const procesados = new Set<string>();

  for (const row of terceroRows) {
    let nombre = getCol(row, 'NOMBRE COMPLETO')?.trim();
    if (!nombre) { omitidos++; continue; }

    // Limpiar nombre
    const limpiado = cleanNombre(nombre);
    nombre = limpiado.value;

    const idLegacy = getCol(row, 'ID TERCEROS')?.trim().replace(/\s+/g, ' ');

    // DUP_NOMBRE_CONFLICTO: mismo nombre pero diferente ID → usar ID como nombre para el adicional
    if (procesados.has(nombre) && idLegacy && idLegacy !== nombre) {
      const nombreAlt = idLegacy;
      try {
        const existeAlt = await prisma.tercero.findFirst({ where: { nombreCompleto: nombreAlt } });
        const terceroId = await procesarTercero(row, nombreAlt);
        if (existeAlt) actualizados++; else creados++;
        await migrarClasificaciones(terceroId, row);
        await migrarDatosFiscales(terceroId, row, nombreAlt);
        await migrarSedesRelaciones(terceroId, row);
      } catch (err: any) {
        logIssue('ERROR', `"${nombreAlt}": ${err.message}`);
        errores++;
      }
      continue;
    }

    procesados.add(nombre);

    try {
      const existeEnDb = await prisma.tercero.findFirst({ where: { nombreCompleto: nombre }, select: { id: true } });
      const terceroId  = await procesarTercero(row, nombre);
      if (existeEnDb) actualizados++; else creados++;

      await migrarClasificaciones(terceroId, row);
      await migrarDatosFiscales(terceroId, row, nombre);
      await migrarSedesRelaciones(terceroId, row);

      if ((creados + actualizados) % 200 === 0 && (creados + actualizados) > 0)
        console.log(`    ... ${creados + actualizados} procesados`);
    } catch (err: any) {
      logIssue('ERROR', `"${nombre}": ${err.message}`);
      errores++;
    }
  }

  console.log(`  ✓ Creados     : ${creados}`);
  console.log(`  ✓ Actualizados: ${actualizados}`);
  console.log(`  ✗ Errores     : ${errores}`);
  console.log(`  - Omitidos    : ${omitidos} (sin nombre)`);

  // ── PASO 7: AccesoDato ──────────────────────────────────────────────────────
  console.log('\n[7/7] Generando AccesoDato...');
  let accesosCreados = 0;

  for (const row of rows) {
    const perfilNomb = getCol(row, 'PERFIL')?.trim();
    let nombre       = getCol(row, 'NOMBRE COMPLETO')?.trim();
    if (!perfilNomb || !nombre) continue;
    nombre = cleanNombre(nombre).value;

    const tablas = TABLAS_POR_PERFIL[perfilNomb] ?? [];
    if (tablas.length === 0) continue;

    const tercero = await prisma.tercero.findFirst({ where: { nombreCompleto: nombre } });
    if (!tercero) { logIssue('ERROR', `AccesoDato: no se encontró tercero "${nombre}"`); continue; }

    const sedesAuth  = parseList(getCol(row, 'SEDES AUTORIZACION'));
    const sedePropia = getCol(row, 'SEDE')?.trim();
    const sedesAcceso = sedesAuth.length > 0 ? sedesAuth : (sedePropia ? [sedePropia] : []);

    if (sedesAcceso.length === 0) { logIssue('ERROR', `AccesoDato: "${nombre}" sin sede — sin accesos generados`); continue; }

    for (const sedeNombre of sedesAcceso) {
      const sedeId = slugify(sedeNombre);
      for (const tabla of tablas) {
        await prisma.accesoDato.upsert({
          where:  { terceroId_tabla_sedeId: { terceroId: tercero.id, tabla, sedeId } },
          update: {},
          create: { terceroId: tercero.id, tabla, sedeId },
        }).catch(() => {});
        accesosCreados++;
      }
    }
  }
  console.log(`  ✓ ${accesosCreados} registros de AccesoDato`);

  // ── PASO 8: Reconstruir programacion_medicos y programacion_tecnicos ─────────
  console.log('\n[8/7] Reconstruyendo médicos y técnicos de programaciones...');

  if (!fs.existsSync(CSV_PROG_PATH)) {
    console.log('  ⚠️  CSV de programaciones no encontrado — junction tables no reconstruidas');
    console.log(`      Ruta esperada: ${CSV_PROG_PATH}`);
  } else {
    const progContent = fs.readFileSync(CSV_PROG_PATH, 'utf-8');
    const progRows: Record<string, string>[] = parse(progContent, {
      columns: true, skip_empty_lines: true,
      relax_quotes: true, relax_column_count: true, bom: true,
    });

    const normalizarNombre = (s: string) =>
      s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

    // Cargar todos los terceros importados para detección de similares
    const todosTerceros = await prisma.tercero.findMany({ select: { nombreCompleto: true, idLegacy: true } });
    const nombreNormMap   = new Map<string, string[]>(); // normalizado → [nombreCompleto originales]
    const idLegacyNormMap = new Map<string, { nombreCompleto: string; idLegacy: string }>(); // normalizado → tercero
    const tercerosPalab   = todosTerceros.map(t => ({
      nombreCompleto: t.nombreCompleto,
      idLegacy:       t.idLegacy,
      normNombre:     normalizarNombre(t.nombreCompleto),
      palabras:       new Set(normalizarNombre(t.nombreCompleto).split(' ').filter(Boolean)),
    }));
    for (const t of todosTerceros) {
      const norm = normalizarNombre(t.nombreCompleto);
      const arr  = nombreNormMap.get(norm) ?? [];
      arr.push(t.nombreCompleto);
      nombreNormMap.set(norm, arr);
      if (t.idLegacy) idLegacyNormMap.set(normalizarNombre(t.idLegacy), { nombreCompleto: t.nombreCompleto, idLegacy: t.idLegacy });
    }

    type TipoMatch = 'subconjunto' | 'orden-diferente' | 'id-legacy';
    function buscarCandidatosExtendidos(nombre: string): { nombreCompleto: string; idLegacy: string | null; tipo: TipoMatch }[] {
      const normNombre     = normalizarNombre(nombre);
      const palabrasNombre = new Set(normNombre.split(' ').filter(Boolean));
      const resultado: { nombreCompleto: string; idLegacy: string | null; tipo: TipoMatch }[] = [];
      const vistos = new Set<string>();

      for (const t of tercerosPalab) {
        if (t.nombreCompleto === nombre || vistos.has(t.nombreCompleto)) continue;
        const aEnB = [...palabrasNombre].every(p => t.palabras.has(p));
        const bEnA = [...t.palabras].every(p => palabrasNombre.has(p));
        if (aEnB && bEnA && t.normNombre !== normNombre) {
          resultado.push({ nombreCompleto: t.nombreCompleto, idLegacy: t.idLegacy, tipo: 'orden-diferente' });
          vistos.add(t.nombreCompleto);
        } else if ((aEnB || bEnA) && !vistos.has(t.nombreCompleto)) {
          resultado.push({ nombreCompleto: t.nombreCompleto, idLegacy: t.idLegacy, tipo: 'subconjunto' });
          vistos.add(t.nombreCompleto);
        }
      }

      const idMatch = idLegacyNormMap.get(normNombre);
      if (idMatch && !vistos.has(idMatch.nombreCompleto))
        resultado.push({ nombreCompleto: idMatch.nombreCompleto, idLegacy: idMatch.idLegacy, tipo: 'id-legacy' });

      return resultado;
    }

    const terceroCache2 = new Map<string, string | null>();
    const minimosCreados = new Map<string, { rol: 'médico' | 'técnico' | 'ambos'; candidatos: string[]; programaciones: string[] }>();

    async function getTerceroId(rawNombre: string, rol: 'médico' | 'técnico'): Promise<string | null> {
      if (!rawNombre) return null;
      const nombre = cleanNombre(rawNombre).value;
      if (!nombre) return null;
      if (terceroCache2.has(nombre)) return terceroCache2.get(nombre)!;
      const t = await prisma.tercero.findFirst({ where: { nombreCompleto: nombre } });
      if (t) { terceroCache2.set(nombre, t.id); return t.id; }
      // Si no existe, crear minimal (técnicos/médicos que no estaban en CSV de terceros)
      const nuevo = await prisma.tercero.create({ data: { nombreCompleto: nombre, activo: true } });
      terceroCache2.set(nombre, nuevo.id);
      const candidatos = (nombreNormMap.get(normalizarNombre(nombre)) ?? []).filter(c => c !== nombre);
      const rolPrevio = minimosCreados.get(nombre);
      minimosCreados.set(nombre, {
        rol: rolPrevio && rolPrevio.rol !== rol ? 'ambos' : rol,
        candidatos: rolPrevio?.candidatos ?? candidatos,
        programaciones: rolPrevio?.programaciones ?? [],
      });
      return nuevo.id;
    }

    function registrarProgEnMinimo(rawNombre: string, idLegacy: string) {
      const nombre = cleanNombre(rawNombre).value;
      const entry  = minimosCreados.get(nombre);
      if (entry && !entry.programaciones.includes(idLegacy)) {
        entry.programaciones.push(idLegacy);
      }
    }

    let medRecreados = 0, tecRecreados = 0, progNoEncontrada = 0;

    for (const row of progRows) {
      const idLegacy        = row['ID_PROGRAMACION']?.trim();
      const medicosNombres  = parseList(row['MÉDICO'] || '');
      const tecnicosNombres = parseList(row['TECNICOS ASIGNADOS'] || '');

      if (!idLegacy || (medicosNombres.length === 0 && tecnicosNombres.length === 0)) continue;

      const prog = await prisma.programacion.findUnique({ where: { id: idLegacy }, select: { id: true } });
      if (!prog) { progNoEncontrada++; continue; }

      for (const nombre of medicosNombres) {
        const medicoId = await getTerceroId(nombre, 'médico');
        if (!medicoId) continue;
        registrarProgEnMinimo(nombre, idLegacy);
        await prisma.programacionMedico.upsert({
          where:  { programacionId_medicoId: { programacionId: prog.id, medicoId } },
          update: {},
          create: { programacionId: prog.id, medicoId },
        });
        medRecreados++;
      }

      for (const nombre of tecnicosNombres) {
        const tecnicoId = await getTerceroId(nombre, 'técnico');
        if (!tecnicoId) continue;
        registrarProgEnMinimo(nombre, idLegacy);
        await prisma.programacionTecnico.upsert({
          where:  { programacionId_tecnicoId: { programacionId: prog.id, tecnicoId } },
          update: {},
          create: { programacionId: prog.id, tecnicoId },
        });
        tecRecreados++;
      }
    }

    console.log(`  ✓ programacion_medicos  : ${medRecreados}`);
    console.log(`  ✓ programacion_tecnicos : ${tecRecreados}`);
    if (progNoEncontrada > 0)
      console.log(`  ⚠️  ${progNoEncontrada} programaciones del CSV no encontradas en DB`);
    if (minimosCreados.size > 0) {
      const conCandidatos = [...minimosCreados.entries()].filter(([, v]) => v.candidatos.length > 0);
      const sinCandidatos = [...minimosCreados.entries()].filter(([, v]) => v.candidatos.length === 0);
      console.log(`\n  ⚠️  ${minimosCreados.size} terceros creados como mínimos (no estaban en CSV de terceros):`);
      if (conCandidatos.length > 0) {
        console.log(`\n     Posibles duplicados (nombre similar ya existe en DB):`);
        for (const [nombre, v] of conCandidatos) {
          console.log(`      - [${v.rol}] "${nombre}"`);
          for (const c of v.candidatos) console.log(`              ↳ similar: "${c}"`);
        }
      }
      if (sinCandidatos.length > 0) {
        console.log(`\n     Sin candidato (búsqueda extendida por palabras e ID):`);
        for (const [nombre, v] of sinCandidatos) {
          console.log(`      - [${v.rol}] "${nombre}"`);
          if (v.programaciones.length > 0)
            console.log(`              ↳ programaciones: ${v.programaciones.join(', ')}`);
          const ext = buscarCandidatosExtendidos(nombre);
          for (const c of ext) {
            const idStr = c.idLegacy ? `  [ID: ${c.idLegacy}]` : '';
            console.log(`              ↳ ${c.tipo}: "${c.nombreCompleto}"${idStr}`);
          }
          if (ext.length === 0)
            console.log(`              ↳ sin candidato por ningún criterio — nuevo real`);
        }
      }
    }
  }

  // ── PASO 9: Limpiar ciudades huérfanas o con nombre basura ────────────────────
  console.log('\n[9/7] Limpiando ciudades sin referencias...');
  const ciudadesHuerfanas = await prisma.ciudad.findMany({
    where: { terceros: { none: {} }, hospitales: { none: {} } },
    select: { id: true, nombre: true },
  });
  let ciudadesEliminadas = 0;
  for (const c of ciudadesHuerfanas) {
    await prisma.ciudad.delete({ where: { id: c.id } });
    ciudadesEliminadas++;
  }
  console.log(ciudadesEliminadas > 0
    ? `  ✓ ${ciudadesEliminadas} ciudades huérfanas eliminadas`
    : '  ✓ Sin ciudades huérfanas');

  // ── PASO 10: Limpiar cargos con ID hash (residuos de importaciones anteriores) ─
  console.log('\n[9/7] Limpiando cargos con nombre de ID hash...');
  const hashIds = Object.keys(CARGO_ID_MAP);
  const cargosHash = await prisma.cargo.findMany({
    where: { nombre: { in: hashIds } },
    include: { _count: { select: { terceros: true } } },
  });
  let cargosEliminados = 0;
  for (const c of cargosHash) {
    if (c._count.terceros === 0) {
      await prisma.cargo.delete({ where: { id: c.id } });
      console.log(`  ✓ Eliminado cargo hash "${c.nombre}" → "${CARGO_ID_MAP[c.nombre]}"`);
      cargosEliminados++;
    } else {
      console.log(`  ⚠ Cargo hash "${c.nombre}" aún tiene ${c._count.terceros} terceros — no eliminado`);
    }
  }
  if (cargosEliminados === 0 && cargosHash.length === 0) {
    console.log('  ✓ Sin residuos hash en cargos');
  }

  // ── RESUMEN FINAL ───────────────────────────────────────────────────────────
  const [totalT, totalH, totalHosp, totalC, totalF, totalA, totalSD, totalSA, totalP, totalE, totalCiud, totalCarg, totalTar, totalMedRec, totalTecRec] = await Promise.all([
    prisma.tercero.count(),
    prisma.hospital.count(),
    prisma.hospital.count({ where: { terceroId: null } }),
    prisma.terceroClasificacion.count(),
    prisma.datosFiscales.count(),
    prisma.accesoDato.count(),
    prisma.terceroSedeDisponible.count(),
    prisma.terceroSedeAutorizacion.count(),
    prisma.pais.count(),
    prisma.estado.count(),
    prisma.ciudad.count(),
    prisma.cargo.count(),
    prisma.tarifa.count(),
    prisma.programacionMedico.count(),
    prisma.programacionTecnico.count(),
  ]);

  console.log('\n' + '═'.repeat(70));
  console.log('  RESUMEN FINAL');
  console.log('═'.repeat(70));
  console.log(`\n  📂 CSV`);
  console.log(`     Filas totales           : ${rows.length}`);
  console.log(`     Nombres únicos          : ${totalUnicosEnCsv}`);
  console.log(`     Filas sin nombre        : ${filasSinNombre}`);
  console.log(`     Nombres repetidos CSV   : ${duplicadosGrupos.length} (${dupConflicto} con ID distinto)`);

  console.log(`\n  📊 Tablas pobladas`);
  console.log(`     terceros                : ${totalT}`);
  console.log(`     hospitales              : ${totalH} (${totalHosp} sin terceroId → revisar)`);
  console.log(`     tercero_clasificaciones : ${totalC}`);
  console.log(`     datos_fiscales          : ${totalF}`);
  console.log(`     acceso_datos            : ${totalA}`);
  console.log(`     tercero_sedes_disponible: ${totalSD}`);
  console.log(`     sedes_autorizacion      : ${totalSA}`);
  console.log(`     paises                  : ${totalP}`);
  console.log(`     estados                 : ${totalE}`);
  console.log(`     ciudades                : ${totalCiud}`);
  console.log(`     cargos                  : ${totalCarg}`);
  console.log(`     tarifas                 : ${totalTar}`);
  console.log(`     programacion_medicos    : ${totalMedRec}`);
  console.log(`     programacion_tecnicos   : ${totalTecRec}`);

  console.log(`\n  🏥 Hospitales`);
  console.log(`     Match exacto            : ${hospExactos}`);
  console.log(`     Match manual            : ${hospManuales}`);
  console.log(`     Fuzzy >80%              : ${hospFuzzyAlto}`);
  console.log(`     Tercero mínimo          : ${hospMinimo}`);
  console.log(`     CSV sin prog en DB      : ${hospCsvSinProgEnDb}`);
  console.log(`     ⚠ Fuzzy 60-80% (revisar): ${hospFuzzyMedio}`);
  console.log(`     ⚠ Sin prog/sin match    : ${hospSinProg}`);

  // Issues por tipo
  if (issueLog.length > 0) {
    const conteo = new Map<IssueType, number>();
    const mensajesPorTipo = new Map<IssueType, string[]>();
    for (const { type, msg } of issueLog) {
      conteo.set(type, (conteo.get(type) ?? 0) + 1);
      if (!mensajesPorTipo.has(type)) mensajesPorTipo.set(type, []);
      mensajesPorTipo.get(type)!.push(msg);
    }

    console.log(`\n  ⚠️  Issues detectados:`);
    const labels: Record<IssueType, string> = {
      DUP_CSV:              'Duplicados en CSV (merge aplicado)',
      DUP_NOMBRE_CONFLICTO: 'Mismo nombre, ID distinto (registros separados)',
      DUP_DB:               'Ya existían en DB (merge aplicado)',
      CORREO_BASURA:        'Correos inválidos descartados',
      RFC_LIMPIADO:         'RFC inválidos limpiados',
      PAIS_NORM:            'Países normalizados',
      MERGE_CAMPO:          'Campos conservados de DB',
      PERFIL_DESCONOCIDO:   'Perfiles no reconocidos (READ_ONLY)',
      SIN_NOMBRE:           'Filas sin NOMBRE COMPLETO',
      NOMBRE_LIMPIADO:      'Nombres con caracteres inválidos limpiados',
      SEDE_NO_ENCONTRADA:   'Sedes no encontradas en DB',
      HOSP_MATCH_EXACTO:    'Hospitales — match exacto',
      HOSP_MATCH_MANUAL:    'Hospitales — match manual',
      HOSP_MATCH_FUZZY:     'Hospitales — fuzzy >80%',
      HOSP_REVISAR:         'Hospitales — fuzzy 60-80% (REQUIEREN REVISIÓN)',
      HOSP_TERCERO_MINIMO:  'Hospitales — Tercero mínimo creado',
      HOSP_SIN_PROG:        'Hospitales — sin prog ni match (REQUIEREN REVISIÓN)',
      HOSP_CSV_SIN_PROG:    'Hospitales — en CSV sin programaciones en DB (importados)',
      HOSP_FUSION:          'Hospitales — programaciones fusionadas',
      ERROR:                'Errores inesperados',
    };

    for (const [type, count] of [...conteo.entries()].sort((a, b) => b[1] - a[1])) {
      const icono = ['HOSP_REVISAR', 'HOSP_SIN_PROG', 'ERROR'].includes(type) ? '❌' : '   ';
      console.log(`  ${icono} ${String(count).padStart(4)}x  ${labels[type]}`);
      const muestra = sampleRandom(mensajesPorTipo.get(type)!, 5);
      for (const m of muestra) console.log(`         · ${m}`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  if (hospSinProg > 0 || hospFuzzyMedio > 0 || dupConflicto > 0) {
    console.log('  ⚠️  Migración completa con pendientes — ejecuta validate-terceros.ts para el detalle.');
  } else {
    console.log('  ✅ Migración de terceros completa.');
  }
  console.log('═'.repeat(70) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
