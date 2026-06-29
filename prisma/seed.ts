import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
