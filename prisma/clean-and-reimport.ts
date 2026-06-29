import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando datos viejos...');

  // Limpiar en orden (respetando foreign keys)
  await prisma.programacionTecnico.deleteMany({});
  console.log('  ✓ Técnicos asignados eliminados');

  await prisma.programacionMedico.deleteMany({});
  console.log('  ✓ Médicos asignados eliminados');

  await prisma.programacion.deleteMany({});
  console.log('  ✓ Programaciones eliminadas');

  // Opcionalmente limpiar terceros, hospitales, sedes (si quieres tabla limpia)
  // await prisma.tercero.deleteMany({});
  // await prisma.hospital.deleteMany({});
  // await prisma.sede.deleteMany({});

  console.log('\n✓ Limpieza completa. Ahora ejecuta:\n');
  console.log('  ts-node prisma/import-programaciones.ts\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
