import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { Tercero } from '@prisma/client';

@Injectable()
export class UsuariosRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCorreo(correo: string): Promise<Tercero | null> {
    return this.prisma.tercero.findFirst({
      where: { correo },
      include: { perfil: true, sede: true },
    });
  }

  async findById(id: string): Promise<Tercero | null> {
    return this.prisma.tercero.findUnique({
      where: { id },
      include: { perfil: true, sede: true },
    });
  }
}
