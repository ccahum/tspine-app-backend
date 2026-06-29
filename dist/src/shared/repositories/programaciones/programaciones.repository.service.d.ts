import { PrismaService } from "../../../prisma/prisma.service";
import { ProgramacionQueryDto } from "../../../api/operacion/programaciones/dto/programacion-query.dto";
export declare class ProgramacionesRepositoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: ProgramacionQueryDto): Promise<{
        data: ({
            sede: {
                nombre: string;
            } | null;
            hospital: {
                nombre: string;
                ciudad: string | null;
            } | null;
            medicos: ({
                medico: {
                    nombreCompleto: string;
                };
            } & {
                programacionId: string;
                medicoId: string;
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
        })[];
        total: number;
    }>;
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
    updateFlags(id: string, flags: Record<string, boolean | undefined>): Promise<{
        sede: {
            nombre: string;
        } | null;
        hospital: {
            nombre: string;
            ciudad: string | null;
        } | null;
        medicos: ({
            medico: {
                nombreCompleto: string;
            };
        } & {
            programacionId: string;
            medicoId: string;
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
    }>;
    create(createData: any): Promise<{
        sede: {
            nombre: string;
        } | null;
        hospital: {
            nombre: string;
            ciudad: string | null;
        } | null;
        medicos: ({
            medico: {
                nombreCompleto: string;
            };
        } & {
            programacionId: string;
            medicoId: string;
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
    }>;
    getMonthComparison(): Promise<{
        year: number;
        months: Record<number, number>;
    }[]>;
    getSedeDistributionByMonth(year: number, month: number): Promise<{
        sede: string;
        total: any;
    }[]>;
}
