import { PrismaService } from "../../../prisma/prisma.service";
import { Tercero } from '@prisma/client';
export declare class UsuariosRepositoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByCorreo(correo: string): Promise<Tercero | null>;
    findById(id: string): Promise<Tercero | null>;
}
