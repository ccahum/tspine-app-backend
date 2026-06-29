"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcrypt.hash('Admin1234', 10);
    await prisma.perfil.upsert({
        where: { id: 'SA' },
        update: {},
        create: { id: 'SA', nombre: 'Super Admin', reglas: 'ALL_CHANGES' },
    });
    await prisma.tercero.upsert({
        where: { correo: 'admin@tspine.com' },
        update: {},
        create: {
            nombreCompleto: 'Admin TSpine',
            correo: 'admin@tspine.com',
            passwordHash,
            perfilId: 'SA',
        },
    });
    console.log('Seed ejecutado correctamente');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map