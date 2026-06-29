import { ProgramacionesService } from './programaciones.service';
import { ProgramacionQueryDto } from './dto/programacion-query.dto';
import { ProgramacionListItemDto, ProgramacionListResponseDto } from './dto/programacion-response.dto';
import { ProgramacionStatsDto } from './dto/programacion-stats.dto';
import { UpdateFlagsDto } from './dto/update-flags.dto';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { ProgramacionComparisonResponseDto } from './dto/programacion-comparison.dto';
export declare class ProgramacionesController {
    private readonly service;
    constructor(service: ProgramacionesService);
    getStats(query: ProgramacionQueryDto): Promise<ProgramacionStatsDto>;
    getMonthComparison(): Promise<ProgramacionComparisonResponseDto>;
    getSedeDistributionByMonth(year: string, month: string): Promise<{
        data: {
            sede: string;
            total: any;
        }[];
    }>;
    findAll(query: ProgramacionQueryDto): Promise<ProgramacionListResponseDto>;
    create(dto: CreateProgramacionDto): Promise<ProgramacionListItemDto>;
    getById(id: string): Promise<({
        sede: {
            id: string;
            nombre: string;
        } | null;
        hospital: {
            id: string;
            nombre: string;
            ciudad: string | null;
        } | null;
        medicos: ({
            medico: {
                id: string;
                nombreCompleto: string;
            };
        } & {
            programacionId: string;
            medicoId: string;
        })[];
        tecnicos: ({
            tecnico: {
                id: string;
                nombreCompleto: string;
            };
        } & {
            programacionId: string;
            tecnicoId: string;
        })[];
    } & {
        id: string;
        idLegacy: string | null;
        creadoPor: string | null;
        createdAt: Date;
        fechaQx: Date | null;
        horaQx: string | null;
        sedeId: string | null;
        hospitalId: string | null;
        consumo: string | null;
        observaciones: string | null;
        numProgram: string | null;
        folioRequisicion: string | null;
        avance: import("@prisma/client/runtime/library").Decimal | null;
        switch: boolean | null;
        enviarProgramacion: boolean | null;
        adjuntarDocumento: string | null;
        cotizacionUrl: string | null;
        sinRemision: boolean;
        consumoNoValidado: boolean;
        sinComision: boolean;
        cerrada: boolean;
        montoTecnicos: import("@prisma/client/runtime/library").Decimal | null;
        montoInversionistas: import("@prisma/client/runtime/library").Decimal | null;
        montoPlus: import("@prisma/client/runtime/library").Decimal | null;
    }) | null>;
    updateFlags(id: string, dto: UpdateFlagsDto): Promise<ProgramacionListItemDto>;
}
