/**
 * import-precios-especiales.ts
 * Puebla: precios_especiales
 * Dependencias: Producto, Tercero (contacto)
 *
 * A diferencia de otros imports, los datos vienen pegados directamente (solo 31 registros,
 * no hay hoja de Google Sheets para esta tabla) y se declaran aquí mismo en PRECIOS_ESPECIALES.
 *
 * Notas de mapeo:
 * - PRODUCTO viene como el mismo valor que REFERENCIA (Producto.id === Producto.referencia
 *   en los productos verificados), así que se resuelve por match directo contra Producto.id.
 * - CONTACTO viene como nombre completo (ej. "Hospital Country 2000") → se resuelve por
 *   match normalizado contra Tercero.nombreCompleto.
 *
 * Requiere que Productos y Terceros ya estén importados (correr después en run-imports.ts).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PrecioEspecialRow = { id: string; producto: string; contacto: string; precio: number; notas: string | null };

const PRECIOS_ESPECIALES: PrecioEspecialRow[] = [
  { id: '92a0fa3d',       producto: 'RRLAPH',         contacto: 'Hospital Country 2000',             precio: 12000,    notas: 'Por solicitud en correo del 4 de diciembre de 2024 por' },
  { id: 'fa288d8f',       producto: 'EMNM',           contacto: 'Bernardett MAC',                     precio: 6000,     notas: 'Solicitud del correo de 28-04-2025' },
  { id: 'e2ca45ab',       producto: 'IPACL',          contacto: 'Bernardett MAC',                     precio: 4500,     notas: 'Correo de 28-04-2025' },
  { id: 'b4ebd0f5',       producto: 'MAYFIELD',       contacto: 'Bernardett MAC',                     precio: 10000,    notas: 'Correo de 28-04-2025' },
  { id: '762ae212',       producto: 'MIDAS REX',      contacto: 'Bernardett MAC',                     precio: 7000,     notas: 'Correo de 28-04-2025' },
  { id: '3c952dfc',       producto: '302430-000-090', contacto: 'Hospital San Francisco de Asís',     precio: 7055.75,  notas: null },
  { id: '250a32d4',       producto: '901200-',        contacto: 'Hospital San Francisco de Asís',     precio: 7642.42,  notas: null },
  { id: 'e47df8a8',       producto: 'RCRFSMUE',       contacto: 'Hospital San Francisco de Asís',     precio: 27249,    notas: null },
  { id: '445bc173',       producto: 'RMMB0',          contacto: 'Hospital San Francisco de Asís',     precio: 5731.56,  notas: null },
  { id: 'b9726289',       producto: 'RSTV4K',         contacto: 'Hospital San Francisco de Asís',     precio: 49500,    notas: null },
  { id: '2b02ea4f',       producto: 'PAD',            contacto: 'Hospital San Francisco de Asís',     precio: 3000,     notas: null },
  { id: 'a2cc19e7',       producto: 'RBIW',           contacto: 'Hospital San Francisco de Asís',     precio: 31450.28, notas: null },
  { id: 'f55db960',       producto: 'RIC11',          contacto: 'Hospital San Francisco de Asís',     precio: 18500,    notas: null },
  { id: '42337b0d',       producto: '58-1028-1208K',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326001',  producto: '58-1028-1210K',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326002',  producto: '58-1228-0708D',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326003',  producto: '58-1228-0708P',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326004',  producto: '58-1228-0710D',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326005',  producto: '58-1228-0710P',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326006',  producto: '58-1228-0813D',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326007',  producto: '58-1228-0813P',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326008',  producto: '58-1228-1016P',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326009',  producto: '58-1228-1208D',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326010',  producto: '58-1228-1208K',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326011',  producto: '58-1228-1208P',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326012',  producto: '58-1228-1210D',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326013',  producto: '58-1228-1210K',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326014',  producto: '58-1228-1210P',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326015',  producto: '58-1228-1508K',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326016',  producto: '58-1228-1508P',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
  { id: 'iaeb020326017',  producto: '58-1228-1510P',  contacto: 'Orthomaster',                        precio: 39850,    notas: null },
];

function norm(name: string): string {
  return name.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT PRECIOS ESPECIALES');
  console.log('═'.repeat(60));
  console.log(`\n📂 ${PRECIOS_ESPECIALES.length} registros declarados en el script`);

  // ── [1/2] Precargar catálogos ─────────────────────────────────────────────
  console.log('\n[1/2] Precargando catálogos...');

  const productosSet = new Set(
    (await prisma.producto.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${productosSet.size} productos`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto);
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  // ── [2/2] Truncar + Importar ───────────────────────────────────────────────
  console.log('\n[2/2] Truncando precios_especiales...');
  await prisma.precioEspecial.deleteMany();
  console.log('  ✓ Tabla limpia');

  console.log('\nImportando precios especiales...');

  let importados = 0;
  const productosNR: string[] = [];
  const contactosNR: string[] = [];
  const errores: string[] = [];

  for (const row of PRECIOS_ESPECIALES) {
    const productoId = productosSet.has(row.producto) ? row.producto : null;
    if (!productoId) productosNR.push(`${row.id}: "${row.producto}"`);

    const contactoId = tercerosByNombre.get(norm(row.contacto)) ?? null;
    if (!contactoId) contactosNR.push(`${row.id}: "${row.contacto}"`);

    try {
      await prisma.precioEspecial.create({
        data: {
          id: row.id,
          productoId,
          contactoId,
          precio: row.precio,
          notas: row.notas,
        },
      });
      importados++;
    } catch (err: any) {
      errores.push(`${row.id}: ${err.message}`);
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados           : ${importados}`);
  console.log(`  ⚠ Producto s/resolver  : ${productosNR.length}`);
  productosNR.forEach(p => console.log(`    - ${p}`));
  console.log(`  ⚠ Contacto s/resolver  : ${contactosNR.length}`);
  contactosNR.forEach(c => console.log(`    - ${c}`));
  console.log(`  ❌ Errores              : ${errores.length}`);
  errores.forEach(e => console.log(`    - ${e}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
