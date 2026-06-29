export declare class ProgramacionListItemDto {
    id: string;
    idLegacy: string | null;
    fechaQx: Date | null;
    horaQx: string | null;
    sede: string | null;
    ciudad: string | null;
    medicos: string[];
    hospital: string | null;
    observaciones: string | null;
    avance: number | null;
    sinRemision: boolean;
    consumoNoValidado: boolean;
    sinComision: boolean;
    cerrada: boolean;
}
export declare class ProgramacionListResponseDto {
    data: ProgramacionListItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
