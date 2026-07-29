/**
 * import-productos.ts
 * Puebla: productos
 * Dependencias: Tercero (usuario, proveedor), Sistema, Categoria, Marca,
 *               UnidadMedidaSat, ObjetoImpuesto
 * Campos calculados OMITIDOS: DIAS DE VIDA UTIL, COSTO DIARIO
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma   = new PrismaClient();
const CSV_PATH = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine1.0 - Productos.csv');

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

/** D/M/YYYY H:MM:SS */
function parseDateTime(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const [datePart, timePart] = val.trim().split(' ');
  if (!datePart) return null;
  const [d, m, y] = datePart.split('/');
  if (!d || !m || !y) return null;
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timePart ?? '00:00:00'}Z`;
  const dt  = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Número con comas de miles: "7,787.52" → 7787.52 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function parseBool(val: string | undefined): boolean | null {
  if (!val || val.trim() === '') return null;
  const v = val.trim().toUpperCase();
  if (v === 'TRUE' || v === 'SI' || v === 'YES' || v === '1') return true;
  if (v === 'FALSE' || v === 'NO' || v === '0') return false;
  return null;
}

function boolDef(val: string | undefined, def: boolean): boolean {
  return parseBool(val) ?? def;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT PRODUCTOS');
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

  // ── [1/5] Precargar catálogos ─────────────────────────────────────────────
  console.log('\n[1/5] Precargando catálogos...');

  // Terceros: resolver por correo (email) o por nombreCompleto
  const tercerosByEmail  = new Map<string, string>(); // correo.lower → id
  const tercerosByNombre = new Map<string, string>(); // nombreCompleto.norm → id
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, correo: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    if (t.correo) tercerosByEmail.set(t.correo.toLowerCase().trim(), t.id);
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const sistemasSet  = new Set((await prisma.sistema.findMany({ select: { id: true } })).map(s => s.id));
  const categoriasSet = new Set((await prisma.categoria.findMany({ select: { categoria: true } })).map(c => c.categoria));
  const marcasSet    = new Set((await prisma.marca.findMany({ select: { id: true } })).map(m => m.id));
  const udemsSet     = new Set((await prisma.unidadMedidaSat.findMany({ select: { id: true } })).map(u => u.id));
  const objetosSet   = new Set((await prisma.objetoImpuesto.findMany({ select: { id: true } })).map(o => o.id));
  console.log(`  ✓ ${sistemasSet.size} sistemas   ${categoriasSet.size} categorías   ${marcasSet.size} marcas`);
  console.log(`  ✓ ${udemsSet.size} unidades de medida   ${objetosSet.size} objetos de impuesto`);

  // ── [2/5] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/5] Analizando CSV...');

  const idCount   = new Map<string, number>();
  const sinNombre: string[] = [];

  type UnresolvedMap = Map<string, number>;
  const usuariosNR:   UnresolvedMap = new Map();
  const proveedoresNR: UnresolvedMap = new Map();
  const sistemasNR:   UnresolvedMap = new Map();
  const categoriasNR: UnresolvedMap = new Map();
  const marcasNR:     UnresolvedMap = new Map();
  const udemsNR:      UnresolvedMap = new Map();
  const objetosNR:    UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string) {
    m.set(key, (m.get(key) ?? 0) + 1);
  }

  for (const row of rows) {
    const id = getCol(row, 'ID PRODUCTO')?.trim();
    if (!id || id === 'Producto Saldo Inicial') continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    if (!getCol(row, 'NOMBRE')?.trim()) sinNombre.push(id);

    const usuario = getCol(row, 'USUARIO')?.trim();
    if (usuario) {
      const uid = tercerosByEmail.get(usuario.toLowerCase())
               ?? tercerosByNombre.get(norm(usuario.toLowerCase()));
      if (!uid) incMap(usuariosNR, usuario);
    }

    const proveedor = getCol(row, 'PROVEEDOR')?.trim();
    if (proveedor && !tercerosByNombre.has(norm(proveedor.toLowerCase()))) incMap(proveedoresNR, proveedor);

    const sistema = getCol(row, 'SISTEMA')?.trim();
    if (sistema && !sistemasSet.has(sistema)) incMap(sistemasNR, sistema);

    const categoria = getCol(row, 'CATEGORIA')?.trim();
    if (categoria && !categoriasSet.has(categoria)) incMap(categoriasNR, categoria);

    const marca = getCol(row, 'MARCA')?.trim();
    if (marca && !marcasSet.has(marca)) incMap(marcasNR, marca);

    const udem = getCol(row, 'UDEM')?.trim();
    if (udem && !udemsSet.has(udem)) incMap(udemsNR, udem);

    const objeto = getCol(row, 'OBJETO DE IMPUESTO')?.trim();
    if (objeto && !objetosSet.has(objeto)) incMap(objetosNR, objeto);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, c]) => console.log(`    - "${k}" (${c} producto${c > 1 ? 's' : ''})`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.slice(0, 10).forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  if (sinNombre.length === 0) console.log('  ✓ Sin productos sin NOMBRE');
  else console.log(`  ⚠ ${sinNombre.length} productos sin NOMBRE`);

  printAnalysis('USUARIO',         usuariosNR);
  printAnalysis('PROVEEDOR',       proveedoresNR);
  printAnalysis('SISTEMA',         sistemasNR);
  printAnalysis('CATEGORÍA',       categoriasNR);
  printAnalysis('MARCA',           marcasNR);
  printAnalysis('UdeM',            udemsNR);
  printAnalysis('Objeto Impuesto', objetosNR);

  // ── [3/5] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/5] Truncando productos...');
  await prisma.producto.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/5] Importar (sin conBaseAId — primera pasada) ──────────────────────
  console.log('\n[4/5] Importando productos...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  // Guardar CON BASE A para segunda pasada (excluir auto-referencia)
  const conBaseAPendientes: { id: string; conBaseAId: string }[] = [];
  const todosLosIds = new Set(rows.map(r => getCol(r, 'ID PRODUCTO')?.trim()).filter(Boolean) as string[]);

  for (const row of rows) {
    const id = getCol(row, 'ID PRODUCTO')?.trim();
    if (!id || id === 'Producto Saldo Inicial') { omitidos++; continue; }

    // Resolver FKs
    const usuarioRaw  = getCol(row, 'USUARIO')?.trim();
    const usuarioId   = usuarioRaw
      ? (tercerosByEmail.get(usuarioRaw.toLowerCase())
      ?? tercerosByNombre.get(norm(usuarioRaw.toLowerCase())) ?? null)
      : null;

    const proveedorRaw = getCol(row, 'PROVEEDOR')?.trim();
    const proveedorId  = proveedorRaw
      ? (tercerosByNombre.get(norm(proveedorRaw.toLowerCase())) ?? null)
      : null;

    const sistemaRaw = getCol(row, 'SISTEMA')?.trim();
    const sistemaId  = sistemaRaw && sistemasSet.has(sistemaRaw) ? sistemaRaw : null;

    const categoriaRaw = getCol(row, 'CATEGORIA')?.trim();
    const categoriaId  = categoriaRaw && categoriasSet.has(categoriaRaw) ? categoriaRaw : null;

    const marcaRaw = getCol(row, 'MARCA')?.trim();
    const marcaId  = marcaRaw && marcasSet.has(marcaRaw) ? marcaRaw : null;

    const udemRaw = getCol(row, 'UDEM')?.trim();
    const udemId  = udemRaw && udemsSet.has(udemRaw) ? udemRaw : null;

    const objetoRaw = getCol(row, 'OBJETO DE IMPUESTO')?.trim();
    const objetoImpuestoId = objetoRaw && objetosSet.has(objetoRaw) ? objetoRaw : null;

    const conBaseARaw = getCol(row, 'CON BASE A')?.trim();
    if (conBaseARaw && todosLosIds.has(conBaseARaw)) {
      conBaseAPendientes.push({ id, conBaseAId: conBaseARaw });
    }

    try {
      await prisma.producto.create({
        data: {
          id,
          usuarioId,
          marcaDeTiempo:           parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          sistemaId,
          referencia:              getCol(row, 'REFERENCIA')?.trim()    || null,
          nombre:                  getCol(row, 'NOMBRE')?.trim()        || null,
          categoriaId,
          importado:               boolDef(getCol(row, 'IMPORTADO?'),                   false),
          proveedorId,
          costoUsd:                parseDecimal(getCol(row, 'COSTO USD')),
          // La columna puede llamarse "COSTO MXN" o "COSTO MNX" según la hoja
          costoMxn:                parseDecimal(getCol(row, 'COSTO MXN') ?? getCol(row, 'COSTO MNX')),
          distribuidor:            parseDecimal(getCol(row, 'DISTRIBUIDOR')),
          particulares:            parseDecimal(getCol(row, 'PARTICULARES')),
          hospitales:              parseDecimal(getCol(row, 'HOSPITALES')),
          aseguradora:             parseDecimal(getCol(row, 'ASEGURADORA')),
          orden:                   parseInt(getCol(row, 'ORDEN') ?? '') || null,
          imagen:                  getCol(row, 'IMAGEN')?.trim()        || null,
          observaciones:           getCol(row, 'OBSERVACIONES')?.trim() || null,
          marcaId,
          sePuedeComprar:          boolDef(getCol(row, 'SE PUEDE COMPRAR?'),            false),
          sePuedeVender:           boolDef(getCol(row, 'SE PUEDE VENDER?'),             false),
          manejaRequisiciones:     boolDef(getCol(row, 'MANEJA REQUISICIONES?'),        false),
          manejaLote:              boolDef(getCol(row, 'MANEJA LOTE?'),                 false),
          actualizar:              parseBool(getCol(row, 'ACTUALIZAR')),
          denegar:                 parseBool(getCol(row, 'DENEGAR')),
          conBaseAId:              null, // segunda pasada
          anosVidaUtil:            parseDecimal(getCol(row, 'ANOS DE VIDA UTIL')),
          min:                     parseInt(getCol(row, 'MIN') ?? '') || null,
          h0:                      parseDecimal(getCol(row, 'H0')),
          h1:                      parseDecimal(getCol(row, 'H1')),
          manejaExistencias:       boolDef(getCol(row, 'MANEJA EXISTENCIAS?'),          false),
          udi:                     parseBool(getCol(row, 'UDI')),
          seReusa:                 boolDef(getCol(row, 'SE REUSA?'),                    false),
          generaListaPrecios:      boolDef(getCol(row, 'GENERA LISTA DE PRECIOS?'),     false),
          seCotiza:                boolDef(getCol(row, 'SE COTIZA?'),                   false),
          crearListaPrecios:       getCol(row, 'CREAR LISTA DE PRECIOS')?.trim()        || null,
          actualizarCostos:        getCol(row, 'ACTUALIZAR COSTOS')?.trim()             || null,
          controlarStockRemisiones: boolDef(getCol(row, 'CONTROLAR STOCK EN REMISIONES?'), false),
          udemId,
          codigoSat:               getCol(row, 'CODIGO SAT')?.trim()                   || null,
          objetoImpuestoId,
          registroSanitario:       getCol(row, 'N° REGISTRO SANITARIO')?.trim()        || null,
          fechaVencimiento:        parseDate(getCol(row, 'FECHA V/TO')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} productos creados`);

  // ── [5/5] Segunda pasada: CON BASE A ─────────────────────────────────────
  console.log(`\n[5/5] Resolviendo CON BASE A (${conBaseAPendientes.length} referencias)...`);

  let conBaseAOk  = 0;
  let conBaseAErr = 0;

  for (const { id, conBaseAId } of conBaseAPendientes) {
    try {
      await prisma.producto.update({ where: { id }, data: { conBaseAId } });
      conBaseAOk++;
    } catch {
      conBaseAErr++;
    }
  }

  if (conBaseAOk  > 0) console.log(`  ✓ ${conBaseAOk} referencias resueltas`);
  if (conBaseAErr > 0) console.log(`  ⚠ ${conBaseAErr} referencias no resueltas`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados              : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)       : ${omitidos}`);
  console.log(`  ✓ CON BASE A resueltos    : ${conBaseAOk}`);
  console.log(`  ⚠ CON BASE A sin resolver : ${conBaseAErr}`);
  console.log(`  ⚠ IDs duplicados en CSV   : ${dupIds.length}`);
  console.log(`  ⚠ Sin nombre              : ${sinNombre.length}`);
  console.log(`  ⚠ USUARIO sin resolver    : ${usuariosNR.size}`);
  console.log(`  ⚠ PROVEEDOR sin resolver  : ${proveedoresNR.size}`);
  console.log(`  ⚠ SISTEMA sin resolver    : ${sistemasNR.size}`);
  console.log(`  ⚠ CATEGORÍA sin resolver  : ${categoriasNR.size}`);
  console.log(`  ⚠ MARCA sin resolver      : ${marcasNR.size}`);
  console.log(`  ⚠ UdeM sin resolver       : ${udemsNR.size}`);
  console.log(`  ⚠ Obj. Impuesto s/resolver: ${objetosNR.size}`);
  console.log(`  ❌ Errores                : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
