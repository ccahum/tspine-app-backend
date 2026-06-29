import { PrismaService } from "../../../prisma/prisma.service";
import { ProgramacionQueryDto } from "../../../api/operacion/programaciones/dto/programacion-query.dto";
export declare class ProgramacionesStatsRepositoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(query: ProgramacionQueryDto): Promise<{
        total: number;
        sinRemision: number;
        consumoNoValidado: number;
        sinComision: number;
        cerradas: number;
        programacionesAño: number;
        programacionesMes: number;
        porSede: {
            sede: string;
            total: any;
        }[];
    }>;
}
