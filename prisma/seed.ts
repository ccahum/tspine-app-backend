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

  const adminExiste = await prisma.tercero.findFirst({ where: { correo: 'admin@tecnologiaspine.com' } });
  if (!adminExiste) {
    await prisma.tercero.create({
      data: { nombreCompleto: 'Admin TSpine', correo: 'admin@tecnologiaspine.com', passwordHash, perfilId: 'SA' },
    });
  }

  const qaPasswordHash = await bcrypt.hash('Admin1234', 10);
  const qaExiste = await prisma.tercero.findFirst({ where: { correo: 'qatester@tecnologiaspine.com' } });
  if (!qaExiste) {
    await prisma.tercero.create({
      data: { nombreCompleto: 'QA Tester', correo: 'qatester@tecnologiaspine.com', passwordHash: qaPasswordHash, perfilId: 'SA' },
    });
  }

  console.log('Seed ejecutado correctamente');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
