"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineExtension = exports.NullsOrder = exports.QueryMode = exports.SortOrder = exports.AccesoDatoScalarFieldEnum = exports.PerfilVistaScalarFieldEnum = exports.MenuItemScalarFieldEnum = exports.TerceroScalarFieldEnum = exports.PerfilScalarFieldEnum = exports.SedeScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
const runtime = require("@prisma/client/runtime/client");
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
exports.prismaVersion = {
    client: "7.8.0",
    engine: "3c6e192761c0362d496ed980de936e2f3cebcd3a"
};
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    Sede: 'Sede',
    Perfil: 'Perfil',
    Tercero: 'Tercero',
    MenuItem: 'MenuItem',
    PerfilVista: 'PerfilVista',
    AccesoDato: 'AccesoDato'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.SedeScalarFieldEnum = {
    id: 'id',
    nombre: 'nombre'
};
exports.PerfilScalarFieldEnum = {
    id: 'id',
    nombre: 'nombre',
    reglas: 'reglas',
    vistaInicial: 'vistaInicial'
};
exports.TerceroScalarFieldEnum = {
    id: 'id',
    nombreCompleto: 'nombreCompleto',
    correo: 'correo',
    passwordHash: 'passwordHash',
    perfilId: 'perfilId',
    sedeId: 'sedeId'
};
exports.MenuItemScalarFieldEnum = {
    id: 'id',
    nombre: 'nombre',
    etiqueta: 'etiqueta',
    modulo: 'modulo',
    orden: 'orden',
    imagen: 'imagen'
};
exports.PerfilVistaScalarFieldEnum = {
    perfilId: 'perfilId',
    vistaNombre: 'vistaNombre'
};
exports.AccesoDatoScalarFieldEnum = {
    terceroId: 'terceroId',
    tabla: 'tabla',
    sedeId: 'sedeId'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map