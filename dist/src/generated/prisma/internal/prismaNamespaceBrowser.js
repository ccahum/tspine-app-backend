"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullsOrder = exports.QueryMode = exports.SortOrder = exports.AccesoDatoScalarFieldEnum = exports.PerfilVistaScalarFieldEnum = exports.MenuItemScalarFieldEnum = exports.TerceroScalarFieldEnum = exports.PerfilScalarFieldEnum = exports.SedeScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.Decimal = void 0;
const runtime = require("@prisma/client/runtime/index-browser");
exports.Decimal = runtime.Decimal;
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
//# sourceMappingURL=prismaNamespaceBrowser.js.map