import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
export declare const DbNull: any;
export declare const JsonNull: any;
export declare const AnyNull: any;
export declare const ModelName: {
    readonly Sede: "Sede";
    readonly Perfil: "Perfil";
    readonly Tercero: "Tercero";
    readonly MenuItem: "MenuItem";
    readonly PerfilVista: "PerfilVista";
    readonly AccesoDato: "AccesoDato";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const SedeScalarFieldEnum: {
    readonly id: "id";
    readonly nombre: "nombre";
};
export type SedeScalarFieldEnum = (typeof SedeScalarFieldEnum)[keyof typeof SedeScalarFieldEnum];
export declare const PerfilScalarFieldEnum: {
    readonly id: "id";
    readonly nombre: "nombre";
    readonly reglas: "reglas";
    readonly vistaInicial: "vistaInicial";
};
export type PerfilScalarFieldEnum = (typeof PerfilScalarFieldEnum)[keyof typeof PerfilScalarFieldEnum];
export declare const TerceroScalarFieldEnum: {
    readonly id: "id";
    readonly nombreCompleto: "nombreCompleto";
    readonly correo: "correo";
    readonly passwordHash: "passwordHash";
    readonly perfilId: "perfilId";
    readonly sedeId: "sedeId";
};
export type TerceroScalarFieldEnum = (typeof TerceroScalarFieldEnum)[keyof typeof TerceroScalarFieldEnum];
export declare const MenuItemScalarFieldEnum: {
    readonly id: "id";
    readonly nombre: "nombre";
    readonly etiqueta: "etiqueta";
    readonly modulo: "modulo";
    readonly orden: "orden";
    readonly imagen: "imagen";
};
export type MenuItemScalarFieldEnum = (typeof MenuItemScalarFieldEnum)[keyof typeof MenuItemScalarFieldEnum];
export declare const PerfilVistaScalarFieldEnum: {
    readonly perfilId: "perfilId";
    readonly vistaNombre: "vistaNombre";
};
export type PerfilVistaScalarFieldEnum = (typeof PerfilVistaScalarFieldEnum)[keyof typeof PerfilVistaScalarFieldEnum];
export declare const AccesoDatoScalarFieldEnum: {
    readonly terceroId: "terceroId";
    readonly tabla: "tabla";
    readonly sedeId: "sedeId";
};
export type AccesoDatoScalarFieldEnum = (typeof AccesoDatoScalarFieldEnum)[keyof typeof AccesoDatoScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
