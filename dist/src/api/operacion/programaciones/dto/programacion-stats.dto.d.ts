export declare class ProgramacionSedeStatDto {
    sede: string;
    total: number;
}
export declare class ProgramacionStatsDto {
    total: number;
    sinRemision: number;
    consumoNoValidado: number;
    sinComision: number;
    cerradas: number;
    porSede: ProgramacionSedeStatDto[];
    programacionesAño?: number;
    programacionesMes?: number;
}
