"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Limpiando datos viejos...');
    await prisma.programacionTecnico.deleteMany({});
    console.log('  ✓ Técnicos asignados eliminados');
    await prisma.programacionMedico.deleteMany({});
    console.log('  ✓ Médicos asignados eliminados');
    await prisma.programacion.deleteMany({});
    console.log('  ✓ Programaciones eliminadas');
    console.log('\n✓ Limpieza completa. Ahora ejecuta:\n');
    console.log('  ts-node prisma/import-programaciones.ts\n');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=clean-and-reimport.js.map