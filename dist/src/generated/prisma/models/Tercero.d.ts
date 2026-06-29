import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type TerceroModel = runtime.Types.Result.DefaultSelection<Prisma.$TerceroPayload>;
export type AggregateTercero = {
    _count: TerceroCountAggregateOutputType | null;
    _min: TerceroMinAggregateOutputType | null;
    _max: TerceroMaxAggregateOutputType | null;
};
export type TerceroMinAggregateOutputType = {
    id: string | null;
    nombreCompleto: string | null;
    correo: string | null;
    passwordHash: string | null;
    perfilId: string | null;
    sedeId: string | null;
};
export type TerceroMaxAggregateOutputType = {
    id: string | null;
    nombreCompleto: string | null;
    correo: string | null;
    passwordHash: string | null;
    perfilId: string | null;
    sedeId: string | null;
};
export type TerceroCountAggregateOutputType = {
    id: number;
    nombreCompleto: number;
    correo: number;
    passwordHash: number;
    perfilId: number;
    sedeId: number;
    _all: number;
};
export type TerceroMinAggregateInputType = {
    id?: true;
    nombreCompleto?: true;
    correo?: true;
    passwordHash?: true;
    perfilId?: true;
    sedeId?: true;
};
export type TerceroMaxAggregateInputType = {
    id?: true;
    nombreCompleto?: true;
    correo?: true;
    passwordHash?: true;
    perfilId?: true;
    sedeId?: true;
};
export type TerceroCountAggregateInputType = {
    id?: true;
    nombreCompleto?: true;
    correo?: true;
    passwordHash?: true;
    perfilId?: true;
    sedeId?: true;
    _all?: true;
};
export type TerceroAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TerceroWhereInput;
    orderBy?: Prisma.TerceroOrderByWithRelationInput | Prisma.TerceroOrderByWithRelationInput[];
    cursor?: Prisma.TerceroWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TerceroCountAggregateInputType;
    _min?: TerceroMinAggregateInputType;
    _max?: TerceroMaxAggregateInputType;
};
export type GetTerceroAggregateType<T extends TerceroAggregateArgs> = {
    [P in keyof T & keyof AggregateTercero]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTercero[P]> : Prisma.GetScalarType<T[P], AggregateTercero[P]>;
};
export type TerceroGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TerceroWhereInput;
    orderBy?: Prisma.TerceroOrderByWithAggregationInput | Prisma.TerceroOrderByWithAggregationInput[];
    by: Prisma.TerceroScalarFieldEnum[] | Prisma.TerceroScalarFieldEnum;
    having?: Prisma.TerceroScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TerceroCountAggregateInputType | true;
    _min?: TerceroMinAggregateInputType;
    _max?: TerceroMaxAggregateInputType;
};
export type TerceroGroupByOutputType = {
    id: string;
    nombreCompleto: string;
    correo: string | null;
    passwordHash: string | null;
    perfilId: string | null;
    sedeId: string | null;
    _count: TerceroCountAggregateOutputType | null;
    _min: TerceroMinAggregateOutputType | null;
    _max: TerceroMaxAggregateOutputType | null;
};
export type GetTerceroGroupByPayload<T extends TerceroGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TerceroGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TerceroGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TerceroGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TerceroGroupByOutputType[P]>;
}>>;
export type TerceroWhereInput = {
    AND?: Prisma.TerceroWhereInput | Prisma.TerceroWhereInput[];
    OR?: Prisma.TerceroWhereInput[];
    NOT?: Prisma.TerceroWhereInput | Prisma.TerceroWhereInput[];
    id?: Prisma.StringFilter<"Tercero"> | string;
    nombreCompleto?: Prisma.StringFilter<"Tercero"> | string;
    correo?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    passwordHash?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    perfilId?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    sedeId?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    perfil?: Prisma.XOR<Prisma.PerfilNullableScalarRelationFilter, Prisma.PerfilWhereInput> | null;
    sede?: Prisma.XOR<Prisma.SedeNullableScalarRelationFilter, Prisma.SedeWhereInput> | null;
    accesoDatos?: Prisma.AccesoDatoListRelationFilter;
};
export type TerceroOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    nombreCompleto?: Prisma.SortOrder;
    correo?: Prisma.SortOrderInput | Prisma.SortOrder;
    passwordHash?: Prisma.SortOrderInput | Prisma.SortOrder;
    perfilId?: Prisma.SortOrderInput | Prisma.SortOrder;
    sedeId?: Prisma.SortOrderInput | Prisma.SortOrder;
    perfil?: Prisma.PerfilOrderByWithRelationInput;
    sede?: Prisma.SedeOrderByWithRelationInput;
    accesoDatos?: Prisma.AccesoDatoOrderByRelationAggregateInput;
};
export type TerceroWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    correo?: string;
    AND?: Prisma.TerceroWhereInput | Prisma.TerceroWhereInput[];
    OR?: Prisma.TerceroWhereInput[];
    NOT?: Prisma.TerceroWhereInput | Prisma.TerceroWhereInput[];
    nombreCompleto?: Prisma.StringFilter<"Tercero"> | string;
    passwordHash?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    perfilId?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    sedeId?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    perfil?: Prisma.XOR<Prisma.PerfilNullableScalarRelationFilter, Prisma.PerfilWhereInput> | null;
    sede?: Prisma.XOR<Prisma.SedeNullableScalarRelationFilter, Prisma.SedeWhereInput> | null;
    accesoDatos?: Prisma.AccesoDatoListRelationFilter;
}, "id" | "correo">;
export type TerceroOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    nombreCompleto?: Prisma.SortOrder;
    correo?: Prisma.SortOrderInput | Prisma.SortOrder;
    passwordHash?: Prisma.SortOrderInput | Prisma.SortOrder;
    perfilId?: Prisma.SortOrderInput | Prisma.SortOrder;
    sedeId?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.TerceroCountOrderByAggregateInput;
    _max?: Prisma.TerceroMaxOrderByAggregateInput;
    _min?: Prisma.TerceroMinOrderByAggregateInput;
};
export type TerceroScalarWhereWithAggregatesInput = {
    AND?: Prisma.TerceroScalarWhereWithAggregatesInput | Prisma.TerceroScalarWhereWithAggregatesInput[];
    OR?: Prisma.TerceroScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TerceroScalarWhereWithAggregatesInput | Prisma.TerceroScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Tercero"> | string;
    nombreCompleto?: Prisma.StringWithAggregatesFilter<"Tercero"> | string;
    correo?: Prisma.StringNullableWithAggregatesFilter<"Tercero"> | string | null;
    passwordHash?: Prisma.StringNullableWithAggregatesFilter<"Tercero"> | string | null;
    perfilId?: Prisma.StringNullableWithAggregatesFilter<"Tercero"> | string | null;
    sedeId?: Prisma.StringNullableWithAggregatesFilter<"Tercero"> | string | null;
};
export type TerceroCreateInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    perfil?: Prisma.PerfilCreateNestedOneWithoutTercerosInput;
    sede?: Prisma.SedeCreateNestedOneWithoutTercerosInput;
    accesoDatos?: Prisma.AccesoDatoCreateNestedManyWithoutTerceroInput;
};
export type TerceroUncheckedCreateInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    perfilId?: string | null;
    sedeId?: string | null;
    accesoDatos?: Prisma.AccesoDatoUncheckedCreateNestedManyWithoutTerceroInput;
};
export type TerceroUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    perfil?: Prisma.PerfilUpdateOneWithoutTercerosNestedInput;
    sede?: Prisma.SedeUpdateOneWithoutTercerosNestedInput;
    accesoDatos?: Prisma.AccesoDatoUpdateManyWithoutTerceroNestedInput;
};
export type TerceroUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    perfilId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sedeId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accesoDatos?: Prisma.AccesoDatoUncheckedUpdateManyWithoutTerceroNestedInput;
};
export type TerceroCreateManyInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    perfilId?: string | null;
    sedeId?: string | null;
};
export type TerceroUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type TerceroUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    perfilId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sedeId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type TerceroListRelationFilter = {
    every?: Prisma.TerceroWhereInput;
    some?: Prisma.TerceroWhereInput;
    none?: Prisma.TerceroWhereInput;
};
export type TerceroOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type TerceroCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombreCompleto?: Prisma.SortOrder;
    correo?: Prisma.SortOrder;
    passwordHash?: Prisma.SortOrder;
    perfilId?: Prisma.SortOrder;
    sedeId?: Prisma.SortOrder;
};
export type TerceroMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombreCompleto?: Prisma.SortOrder;
    correo?: Prisma.SortOrder;
    passwordHash?: Prisma.SortOrder;
    perfilId?: Prisma.SortOrder;
    sedeId?: Prisma.SortOrder;
};
export type TerceroMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombreCompleto?: Prisma.SortOrder;
    correo?: Prisma.SortOrder;
    passwordHash?: Prisma.SortOrder;
    perfilId?: Prisma.SortOrder;
    sedeId?: Prisma.SortOrder;
};
export type TerceroScalarRelationFilter = {
    is?: Prisma.TerceroWhereInput;
    isNot?: Prisma.TerceroWhereInput;
};
export type TerceroCreateNestedManyWithoutSedeInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutSedeInput, Prisma.TerceroUncheckedCreateWithoutSedeInput> | Prisma.TerceroCreateWithoutSedeInput[] | Prisma.TerceroUncheckedCreateWithoutSedeInput[];
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutSedeInput | Prisma.TerceroCreateOrConnectWithoutSedeInput[];
    createMany?: Prisma.TerceroCreateManySedeInputEnvelope;
    connect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
};
export type TerceroUncheckedCreateNestedManyWithoutSedeInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutSedeInput, Prisma.TerceroUncheckedCreateWithoutSedeInput> | Prisma.TerceroCreateWithoutSedeInput[] | Prisma.TerceroUncheckedCreateWithoutSedeInput[];
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutSedeInput | Prisma.TerceroCreateOrConnectWithoutSedeInput[];
    createMany?: Prisma.TerceroCreateManySedeInputEnvelope;
    connect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
};
export type TerceroUpdateManyWithoutSedeNestedInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutSedeInput, Prisma.TerceroUncheckedCreateWithoutSedeInput> | Prisma.TerceroCreateWithoutSedeInput[] | Prisma.TerceroUncheckedCreateWithoutSedeInput[];
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutSedeInput | Prisma.TerceroCreateOrConnectWithoutSedeInput[];
    upsert?: Prisma.TerceroUpsertWithWhereUniqueWithoutSedeInput | Prisma.TerceroUpsertWithWhereUniqueWithoutSedeInput[];
    createMany?: Prisma.TerceroCreateManySedeInputEnvelope;
    set?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    disconnect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    delete?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    connect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    update?: Prisma.TerceroUpdateWithWhereUniqueWithoutSedeInput | Prisma.TerceroUpdateWithWhereUniqueWithoutSedeInput[];
    updateMany?: Prisma.TerceroUpdateManyWithWhereWithoutSedeInput | Prisma.TerceroUpdateManyWithWhereWithoutSedeInput[];
    deleteMany?: Prisma.TerceroScalarWhereInput | Prisma.TerceroScalarWhereInput[];
};
export type TerceroUncheckedUpdateManyWithoutSedeNestedInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutSedeInput, Prisma.TerceroUncheckedCreateWithoutSedeInput> | Prisma.TerceroCreateWithoutSedeInput[] | Prisma.TerceroUncheckedCreateWithoutSedeInput[];
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutSedeInput | Prisma.TerceroCreateOrConnectWithoutSedeInput[];
    upsert?: Prisma.TerceroUpsertWithWhereUniqueWithoutSedeInput | Prisma.TerceroUpsertWithWhereUniqueWithoutSedeInput[];
    createMany?: Prisma.TerceroCreateManySedeInputEnvelope;
    set?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    disconnect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    delete?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    connect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    update?: Prisma.TerceroUpdateWithWhereUniqueWithoutSedeInput | Prisma.TerceroUpdateWithWhereUniqueWithoutSedeInput[];
    updateMany?: Prisma.TerceroUpdateManyWithWhereWithoutSedeInput | Prisma.TerceroUpdateManyWithWhereWithoutSedeInput[];
    deleteMany?: Prisma.TerceroScalarWhereInput | Prisma.TerceroScalarWhereInput[];
};
export type TerceroCreateNestedManyWithoutPerfilInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutPerfilInput, Prisma.TerceroUncheckedCreateWithoutPerfilInput> | Prisma.TerceroCreateWithoutPerfilInput[] | Prisma.TerceroUncheckedCreateWithoutPerfilInput[];
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutPerfilInput | Prisma.TerceroCreateOrConnectWithoutPerfilInput[];
    createMany?: Prisma.TerceroCreateManyPerfilInputEnvelope;
    connect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
};
export type TerceroUncheckedCreateNestedManyWithoutPerfilInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutPerfilInput, Prisma.TerceroUncheckedCreateWithoutPerfilInput> | Prisma.TerceroCreateWithoutPerfilInput[] | Prisma.TerceroUncheckedCreateWithoutPerfilInput[];
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutPerfilInput | Prisma.TerceroCreateOrConnectWithoutPerfilInput[];
    createMany?: Prisma.TerceroCreateManyPerfilInputEnvelope;
    connect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
};
export type TerceroUpdateManyWithoutPerfilNestedInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutPerfilInput, Prisma.TerceroUncheckedCreateWithoutPerfilInput> | Prisma.TerceroCreateWithoutPerfilInput[] | Prisma.TerceroUncheckedCreateWithoutPerfilInput[];
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutPerfilInput | Prisma.TerceroCreateOrConnectWithoutPerfilInput[];
    upsert?: Prisma.TerceroUpsertWithWhereUniqueWithoutPerfilInput | Prisma.TerceroUpsertWithWhereUniqueWithoutPerfilInput[];
    createMany?: Prisma.TerceroCreateManyPerfilInputEnvelope;
    set?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    disconnect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    delete?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    connect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    update?: Prisma.TerceroUpdateWithWhereUniqueWithoutPerfilInput | Prisma.TerceroUpdateWithWhereUniqueWithoutPerfilInput[];
    updateMany?: Prisma.TerceroUpdateManyWithWhereWithoutPerfilInput | Prisma.TerceroUpdateManyWithWhereWithoutPerfilInput[];
    deleteMany?: Prisma.TerceroScalarWhereInput | Prisma.TerceroScalarWhereInput[];
};
export type TerceroUncheckedUpdateManyWithoutPerfilNestedInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutPerfilInput, Prisma.TerceroUncheckedCreateWithoutPerfilInput> | Prisma.TerceroCreateWithoutPerfilInput[] | Prisma.TerceroUncheckedCreateWithoutPerfilInput[];
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutPerfilInput | Prisma.TerceroCreateOrConnectWithoutPerfilInput[];
    upsert?: Prisma.TerceroUpsertWithWhereUniqueWithoutPerfilInput | Prisma.TerceroUpsertWithWhereUniqueWithoutPerfilInput[];
    createMany?: Prisma.TerceroCreateManyPerfilInputEnvelope;
    set?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    disconnect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    delete?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    connect?: Prisma.TerceroWhereUniqueInput | Prisma.TerceroWhereUniqueInput[];
    update?: Prisma.TerceroUpdateWithWhereUniqueWithoutPerfilInput | Prisma.TerceroUpdateWithWhereUniqueWithoutPerfilInput[];
    updateMany?: Prisma.TerceroUpdateManyWithWhereWithoutPerfilInput | Prisma.TerceroUpdateManyWithWhereWithoutPerfilInput[];
    deleteMany?: Prisma.TerceroScalarWhereInput | Prisma.TerceroScalarWhereInput[];
};
export type TerceroCreateNestedOneWithoutAccesoDatosInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutAccesoDatosInput, Prisma.TerceroUncheckedCreateWithoutAccesoDatosInput>;
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutAccesoDatosInput;
    connect?: Prisma.TerceroWhereUniqueInput;
};
export type TerceroUpdateOneRequiredWithoutAccesoDatosNestedInput = {
    create?: Prisma.XOR<Prisma.TerceroCreateWithoutAccesoDatosInput, Prisma.TerceroUncheckedCreateWithoutAccesoDatosInput>;
    connectOrCreate?: Prisma.TerceroCreateOrConnectWithoutAccesoDatosInput;
    upsert?: Prisma.TerceroUpsertWithoutAccesoDatosInput;
    connect?: Prisma.TerceroWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.TerceroUpdateToOneWithWhereWithoutAccesoDatosInput, Prisma.TerceroUpdateWithoutAccesoDatosInput>, Prisma.TerceroUncheckedUpdateWithoutAccesoDatosInput>;
};
export type TerceroCreateWithoutSedeInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    perfil?: Prisma.PerfilCreateNestedOneWithoutTercerosInput;
    accesoDatos?: Prisma.AccesoDatoCreateNestedManyWithoutTerceroInput;
};
export type TerceroUncheckedCreateWithoutSedeInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    perfilId?: string | null;
    accesoDatos?: Prisma.AccesoDatoUncheckedCreateNestedManyWithoutTerceroInput;
};
export type TerceroCreateOrConnectWithoutSedeInput = {
    where: Prisma.TerceroWhereUniqueInput;
    create: Prisma.XOR<Prisma.TerceroCreateWithoutSedeInput, Prisma.TerceroUncheckedCreateWithoutSedeInput>;
};
export type TerceroCreateManySedeInputEnvelope = {
    data: Prisma.TerceroCreateManySedeInput | Prisma.TerceroCreateManySedeInput[];
    skipDuplicates?: boolean;
};
export type TerceroUpsertWithWhereUniqueWithoutSedeInput = {
    where: Prisma.TerceroWhereUniqueInput;
    update: Prisma.XOR<Prisma.TerceroUpdateWithoutSedeInput, Prisma.TerceroUncheckedUpdateWithoutSedeInput>;
    create: Prisma.XOR<Prisma.TerceroCreateWithoutSedeInput, Prisma.TerceroUncheckedCreateWithoutSedeInput>;
};
export type TerceroUpdateWithWhereUniqueWithoutSedeInput = {
    where: Prisma.TerceroWhereUniqueInput;
    data: Prisma.XOR<Prisma.TerceroUpdateWithoutSedeInput, Prisma.TerceroUncheckedUpdateWithoutSedeInput>;
};
export type TerceroUpdateManyWithWhereWithoutSedeInput = {
    where: Prisma.TerceroScalarWhereInput;
    data: Prisma.XOR<Prisma.TerceroUpdateManyMutationInput, Prisma.TerceroUncheckedUpdateManyWithoutSedeInput>;
};
export type TerceroScalarWhereInput = {
    AND?: Prisma.TerceroScalarWhereInput | Prisma.TerceroScalarWhereInput[];
    OR?: Prisma.TerceroScalarWhereInput[];
    NOT?: Prisma.TerceroScalarWhereInput | Prisma.TerceroScalarWhereInput[];
    id?: Prisma.StringFilter<"Tercero"> | string;
    nombreCompleto?: Prisma.StringFilter<"Tercero"> | string;
    correo?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    passwordHash?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    perfilId?: Prisma.StringNullableFilter<"Tercero"> | string | null;
    sedeId?: Prisma.StringNullableFilter<"Tercero"> | string | null;
};
export type TerceroCreateWithoutPerfilInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    sede?: Prisma.SedeCreateNestedOneWithoutTercerosInput;
    accesoDatos?: Prisma.AccesoDatoCreateNestedManyWithoutTerceroInput;
};
export type TerceroUncheckedCreateWithoutPerfilInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    sedeId?: string | null;
    accesoDatos?: Prisma.AccesoDatoUncheckedCreateNestedManyWithoutTerceroInput;
};
export type TerceroCreateOrConnectWithoutPerfilInput = {
    where: Prisma.TerceroWhereUniqueInput;
    create: Prisma.XOR<Prisma.TerceroCreateWithoutPerfilInput, Prisma.TerceroUncheckedCreateWithoutPerfilInput>;
};
export type TerceroCreateManyPerfilInputEnvelope = {
    data: Prisma.TerceroCreateManyPerfilInput | Prisma.TerceroCreateManyPerfilInput[];
    skipDuplicates?: boolean;
};
export type TerceroUpsertWithWhereUniqueWithoutPerfilInput = {
    where: Prisma.TerceroWhereUniqueInput;
    update: Prisma.XOR<Prisma.TerceroUpdateWithoutPerfilInput, Prisma.TerceroUncheckedUpdateWithoutPerfilInput>;
    create: Prisma.XOR<Prisma.TerceroCreateWithoutPerfilInput, Prisma.TerceroUncheckedCreateWithoutPerfilInput>;
};
export type TerceroUpdateWithWhereUniqueWithoutPerfilInput = {
    where: Prisma.TerceroWhereUniqueInput;
    data: Prisma.XOR<Prisma.TerceroUpdateWithoutPerfilInput, Prisma.TerceroUncheckedUpdateWithoutPerfilInput>;
};
export type TerceroUpdateManyWithWhereWithoutPerfilInput = {
    where: Prisma.TerceroScalarWhereInput;
    data: Prisma.XOR<Prisma.TerceroUpdateManyMutationInput, Prisma.TerceroUncheckedUpdateManyWithoutPerfilInput>;
};
export type TerceroCreateWithoutAccesoDatosInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    perfil?: Prisma.PerfilCreateNestedOneWithoutTercerosInput;
    sede?: Prisma.SedeCreateNestedOneWithoutTercerosInput;
};
export type TerceroUncheckedCreateWithoutAccesoDatosInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    perfilId?: string | null;
    sedeId?: string | null;
};
export type TerceroCreateOrConnectWithoutAccesoDatosInput = {
    where: Prisma.TerceroWhereUniqueInput;
    create: Prisma.XOR<Prisma.TerceroCreateWithoutAccesoDatosInput, Prisma.TerceroUncheckedCreateWithoutAccesoDatosInput>;
};
export type TerceroUpsertWithoutAccesoDatosInput = {
    update: Prisma.XOR<Prisma.TerceroUpdateWithoutAccesoDatosInput, Prisma.TerceroUncheckedUpdateWithoutAccesoDatosInput>;
    create: Prisma.XOR<Prisma.TerceroCreateWithoutAccesoDatosInput, Prisma.TerceroUncheckedCreateWithoutAccesoDatosInput>;
    where?: Prisma.TerceroWhereInput;
};
export type TerceroUpdateToOneWithWhereWithoutAccesoDatosInput = {
    where?: Prisma.TerceroWhereInput;
    data: Prisma.XOR<Prisma.TerceroUpdateWithoutAccesoDatosInput, Prisma.TerceroUncheckedUpdateWithoutAccesoDatosInput>;
};
export type TerceroUpdateWithoutAccesoDatosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    perfil?: Prisma.PerfilUpdateOneWithoutTercerosNestedInput;
    sede?: Prisma.SedeUpdateOneWithoutTercerosNestedInput;
};
export type TerceroUncheckedUpdateWithoutAccesoDatosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    perfilId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sedeId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type TerceroCreateManySedeInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    perfilId?: string | null;
};
export type TerceroUpdateWithoutSedeInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    perfil?: Prisma.PerfilUpdateOneWithoutTercerosNestedInput;
    accesoDatos?: Prisma.AccesoDatoUpdateManyWithoutTerceroNestedInput;
};
export type TerceroUncheckedUpdateWithoutSedeInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    perfilId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accesoDatos?: Prisma.AccesoDatoUncheckedUpdateManyWithoutTerceroNestedInput;
};
export type TerceroUncheckedUpdateManyWithoutSedeInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    perfilId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type TerceroCreateManyPerfilInput = {
    id?: string;
    nombreCompleto: string;
    correo?: string | null;
    passwordHash?: string | null;
    sedeId?: string | null;
};
export type TerceroUpdateWithoutPerfilInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sede?: Prisma.SedeUpdateOneWithoutTercerosNestedInput;
    accesoDatos?: Prisma.AccesoDatoUpdateManyWithoutTerceroNestedInput;
};
export type TerceroUncheckedUpdateWithoutPerfilInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sedeId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accesoDatos?: Prisma.AccesoDatoUncheckedUpdateManyWithoutTerceroNestedInput;
};
export type TerceroUncheckedUpdateManyWithoutPerfilInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombreCompleto?: Prisma.StringFieldUpdateOperationsInput | string;
    correo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    passwordHash?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sedeId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type TerceroCountOutputType = {
    accesoDatos: number;
};
export type TerceroCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    accesoDatos?: boolean | TerceroCountOutputTypeCountAccesoDatosArgs;
};
export type TerceroCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroCountOutputTypeSelect<ExtArgs> | null;
};
export type TerceroCountOutputTypeCountAccesoDatosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AccesoDatoWhereInput;
};
export type TerceroSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombreCompleto?: boolean;
    correo?: boolean;
    passwordHash?: boolean;
    perfilId?: boolean;
    sedeId?: boolean;
    perfil?: boolean | Prisma.Tercero$perfilArgs<ExtArgs>;
    sede?: boolean | Prisma.Tercero$sedeArgs<ExtArgs>;
    accesoDatos?: boolean | Prisma.Tercero$accesoDatosArgs<ExtArgs>;
    _count?: boolean | Prisma.TerceroCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tercero"]>;
export type TerceroSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombreCompleto?: boolean;
    correo?: boolean;
    passwordHash?: boolean;
    perfilId?: boolean;
    sedeId?: boolean;
    perfil?: boolean | Prisma.Tercero$perfilArgs<ExtArgs>;
    sede?: boolean | Prisma.Tercero$sedeArgs<ExtArgs>;
}, ExtArgs["result"]["tercero"]>;
export type TerceroSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombreCompleto?: boolean;
    correo?: boolean;
    passwordHash?: boolean;
    perfilId?: boolean;
    sedeId?: boolean;
    perfil?: boolean | Prisma.Tercero$perfilArgs<ExtArgs>;
    sede?: boolean | Prisma.Tercero$sedeArgs<ExtArgs>;
}, ExtArgs["result"]["tercero"]>;
export type TerceroSelectScalar = {
    id?: boolean;
    nombreCompleto?: boolean;
    correo?: boolean;
    passwordHash?: boolean;
    perfilId?: boolean;
    sedeId?: boolean;
};
export type TerceroOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "nombreCompleto" | "correo" | "passwordHash" | "perfilId" | "sedeId", ExtArgs["result"]["tercero"]>;
export type TerceroInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    perfil?: boolean | Prisma.Tercero$perfilArgs<ExtArgs>;
    sede?: boolean | Prisma.Tercero$sedeArgs<ExtArgs>;
    accesoDatos?: boolean | Prisma.Tercero$accesoDatosArgs<ExtArgs>;
    _count?: boolean | Prisma.TerceroCountOutputTypeDefaultArgs<ExtArgs>;
};
export type TerceroIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    perfil?: boolean | Prisma.Tercero$perfilArgs<ExtArgs>;
    sede?: boolean | Prisma.Tercero$sedeArgs<ExtArgs>;
};
export type TerceroIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    perfil?: boolean | Prisma.Tercero$perfilArgs<ExtArgs>;
    sede?: boolean | Prisma.Tercero$sedeArgs<ExtArgs>;
};
export type $TerceroPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Tercero";
    objects: {
        perfil: Prisma.$PerfilPayload<ExtArgs> | null;
        sede: Prisma.$SedePayload<ExtArgs> | null;
        accesoDatos: Prisma.$AccesoDatoPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        nombreCompleto: string;
        correo: string | null;
        passwordHash: string | null;
        perfilId: string | null;
        sedeId: string | null;
    }, ExtArgs["result"]["tercero"]>;
    composites: {};
};
export type TerceroGetPayload<S extends boolean | null | undefined | TerceroDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TerceroPayload, S>;
export type TerceroCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TerceroFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TerceroCountAggregateInputType | true;
};
export interface TerceroDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Tercero'];
        meta: {
            name: 'Tercero';
        };
    };
    findUnique<T extends TerceroFindUniqueArgs>(args: Prisma.SelectSubset<T, TerceroFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TerceroFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TerceroFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TerceroFindFirstArgs>(args?: Prisma.SelectSubset<T, TerceroFindFirstArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TerceroFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TerceroFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TerceroFindManyArgs>(args?: Prisma.SelectSubset<T, TerceroFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TerceroCreateArgs>(args: Prisma.SelectSubset<T, TerceroCreateArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TerceroCreateManyArgs>(args?: Prisma.SelectSubset<T, TerceroCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TerceroCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TerceroCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TerceroDeleteArgs>(args: Prisma.SelectSubset<T, TerceroDeleteArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TerceroUpdateArgs>(args: Prisma.SelectSubset<T, TerceroUpdateArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TerceroDeleteManyArgs>(args?: Prisma.SelectSubset<T, TerceroDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TerceroUpdateManyArgs>(args: Prisma.SelectSubset<T, TerceroUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TerceroUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TerceroUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TerceroUpsertArgs>(args: Prisma.SelectSubset<T, TerceroUpsertArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TerceroCountArgs>(args?: Prisma.Subset<T, TerceroCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TerceroCountAggregateOutputType> : number>;
    aggregate<T extends TerceroAggregateArgs>(args: Prisma.Subset<T, TerceroAggregateArgs>): Prisma.PrismaPromise<GetTerceroAggregateType<T>>;
    groupBy<T extends TerceroGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TerceroGroupByArgs['orderBy'];
    } : {
        orderBy?: TerceroGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TerceroGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTerceroGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TerceroFieldRefs;
}
export interface Prisma__TerceroClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    perfil<T extends Prisma.Tercero$perfilArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Tercero$perfilArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    sede<T extends Prisma.Tercero$sedeArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Tercero$sedeArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    accesoDatos<T extends Prisma.Tercero$accesoDatosArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Tercero$accesoDatosArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TerceroFieldRefs {
    readonly id: Prisma.FieldRef<"Tercero", 'String'>;
    readonly nombreCompleto: Prisma.FieldRef<"Tercero", 'String'>;
    readonly correo: Prisma.FieldRef<"Tercero", 'String'>;
    readonly passwordHash: Prisma.FieldRef<"Tercero", 'String'>;
    readonly perfilId: Prisma.FieldRef<"Tercero", 'String'>;
    readonly sedeId: Prisma.FieldRef<"Tercero", 'String'>;
}
export type TerceroFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    where: Prisma.TerceroWhereUniqueInput;
};
export type TerceroFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    where: Prisma.TerceroWhereUniqueInput;
};
export type TerceroFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    where?: Prisma.TerceroWhereInput;
    orderBy?: Prisma.TerceroOrderByWithRelationInput | Prisma.TerceroOrderByWithRelationInput[];
    cursor?: Prisma.TerceroWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TerceroScalarFieldEnum | Prisma.TerceroScalarFieldEnum[];
};
export type TerceroFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    where?: Prisma.TerceroWhereInput;
    orderBy?: Prisma.TerceroOrderByWithRelationInput | Prisma.TerceroOrderByWithRelationInput[];
    cursor?: Prisma.TerceroWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TerceroScalarFieldEnum | Prisma.TerceroScalarFieldEnum[];
};
export type TerceroFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    where?: Prisma.TerceroWhereInput;
    orderBy?: Prisma.TerceroOrderByWithRelationInput | Prisma.TerceroOrderByWithRelationInput[];
    cursor?: Prisma.TerceroWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TerceroScalarFieldEnum | Prisma.TerceroScalarFieldEnum[];
};
export type TerceroCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TerceroCreateInput, Prisma.TerceroUncheckedCreateInput>;
};
export type TerceroCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TerceroCreateManyInput | Prisma.TerceroCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TerceroCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    data: Prisma.TerceroCreateManyInput | Prisma.TerceroCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.TerceroIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type TerceroUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TerceroUpdateInput, Prisma.TerceroUncheckedUpdateInput>;
    where: Prisma.TerceroWhereUniqueInput;
};
export type TerceroUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TerceroUpdateManyMutationInput, Prisma.TerceroUncheckedUpdateManyInput>;
    where?: Prisma.TerceroWhereInput;
    limit?: number;
};
export type TerceroUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TerceroUpdateManyMutationInput, Prisma.TerceroUncheckedUpdateManyInput>;
    where?: Prisma.TerceroWhereInput;
    limit?: number;
    include?: Prisma.TerceroIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type TerceroUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    where: Prisma.TerceroWhereUniqueInput;
    create: Prisma.XOR<Prisma.TerceroCreateInput, Prisma.TerceroUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TerceroUpdateInput, Prisma.TerceroUncheckedUpdateInput>;
};
export type TerceroDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
    where: Prisma.TerceroWhereUniqueInput;
};
export type TerceroDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TerceroWhereInput;
    limit?: number;
};
export type Tercero$perfilArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    where?: Prisma.PerfilWhereInput;
};
export type Tercero$sedeArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    where?: Prisma.SedeWhereInput;
};
export type Tercero$accesoDatosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelect<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    include?: Prisma.AccesoDatoInclude<ExtArgs> | null;
    where?: Prisma.AccesoDatoWhereInput;
    orderBy?: Prisma.AccesoDatoOrderByWithRelationInput | Prisma.AccesoDatoOrderByWithRelationInput[];
    cursor?: Prisma.AccesoDatoWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AccesoDatoScalarFieldEnum | Prisma.AccesoDatoScalarFieldEnum[];
};
export type TerceroDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TerceroSelect<ExtArgs> | null;
    omit?: Prisma.TerceroOmit<ExtArgs> | null;
    include?: Prisma.TerceroInclude<ExtArgs> | null;
};
