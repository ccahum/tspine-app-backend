export declare const ReglaCrud: {
    readonly READ_ONLY: "READ_ONLY";
    readonly ADDS_AND_UPDATES: "ADDS_AND_UPDATES";
    readonly ALL_CHANGES: "ALL_CHANGES";
};
export type ReglaCrud = (typeof ReglaCrud)[keyof typeof ReglaCrud];
export declare const TablaProtegida: {
    readonly Cotizacion: "Cotizacion";
    readonly Gastos: "Gastos";
    readonly ProgramacionPagos: "ProgramacionPagos";
    readonly PagosEjecucion: "PagosEjecucion";
};
export type TablaProtegida = (typeof TablaProtegida)[keyof typeof TablaProtegida];
