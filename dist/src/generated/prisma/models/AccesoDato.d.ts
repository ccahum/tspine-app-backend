import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type AccesoDatoModel = runtime.Types.Result.DefaultSelection<Prisma.$AccesoDatoPayload>;
export type AggregateAccesoDato = {
    _count: AccesoDatoCountAggregateOutputType | null;
    _min: AccesoDatoMinAggregateOutputType | null;
    _max: AccesoDatoMaxAggregateOutputType | null;
};
export type AccesoDatoMinAggregateOutputType = {
    terceroId: string | null;
    tabla: $Enums.TablaProtegida | null;
    sedeId: string | null;
};
export type AccesoDatoMaxAggregateOutputType = {
    terceroId: string | null;
    tabla: $Enums.TablaProtegida | null;
    sedeId: string | null;
};
export type AccesoDatoCountAggregateOutputType = {
    terceroId: number;
    tabla: number;
    sedeId: number;
    _all: number;
};
export type AccesoDatoMinAggregateInputType = {
    terceroId?: true;
    tabla?: true;
    sedeId?: true;
};
export type AccesoDatoMaxAggregateInputType = {
    terceroId?: true;
    tabla?: true;
    sedeId?: true;
};
export type AccesoDatoCountAggregateInputType = {
    terceroId?: true;
    tabla?: true;
    sedeId?: true;
    _all?: true;
};
export type AccesoDatoAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AccesoDatoWhereInput;
    orderBy?: Prisma.AccesoDatoOrderByWithRelationInput | Prisma.AccesoDatoOrderByWithRelationInput[];
    cursor?: Prisma.AccesoDatoWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AccesoDatoCountAggregateInputType;
    _min?: AccesoDatoMinAggregateInputType;
    _max?: AccesoDatoMaxAggregateInputType;
};
export type GetAccesoDatoAggregateType<T extends AccesoDatoAggregateArgs> = {
    [P in keyof T & keyof AggregateAccesoDato]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAccesoDato[P]> : Prisma.GetScalarType<T[P], AggregateAccesoDato[P]>;
};
export type AccesoDatoGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AccesoDatoWhereInput;
    orderBy?: Prisma.AccesoDatoOrderByWithAggregationInput | Prisma.AccesoDatoOrderByWithAggregationInput[];
    by: Prisma.AccesoDatoScalarFieldEnum[] | Prisma.AccesoDatoScalarFieldEnum;
    having?: Prisma.AccesoDatoScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AccesoDatoCountAggregateInputType | true;
    _min?: AccesoDatoMinAggregateInputType;
    _max?: AccesoDatoMaxAggregateInputType;
};
export type AccesoDatoGroupByOutputType = {
    terceroId: string;
    tabla: $Enums.TablaProtegida;
    sedeId: string;
    _count: AccesoDatoCountAggregateOutputType | null;
    _min: AccesoDatoMinAggregateOutputType | null;
    _max: AccesoDatoMaxAggregateOutputType | null;
};
export type GetAccesoDatoGroupByPayload<T extends AccesoDatoGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AccesoDatoGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AccesoDatoGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AccesoDatoGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AccesoDatoGroupByOutputType[P]>;
}>>;
export type AccesoDatoWhereInput = {
    AND?: Prisma.AccesoDatoWhereInput | Prisma.AccesoDatoWhereInput[];
    OR?: Prisma.AccesoDatoWhereInput[];
    NOT?: Prisma.AccesoDatoWhereInput | Prisma.AccesoDatoWhereInput[];
    terceroId?: Prisma.StringFilter<"AccesoDato"> | string;
    tabla?: Prisma.EnumTablaProtegidaFilter<"AccesoDato"> | $Enums.TablaProtegida;
    sedeId?: Prisma.StringFilter<"AccesoDato"> | string;
    tercero?: Prisma.XOR<Prisma.TerceroScalarRelationFilter, Prisma.TerceroWhereInput>;
    sede?: Prisma.XOR<Prisma.SedeScalarRelationFilter, Prisma.SedeWhereInput>;
};
export type AccesoDatoOrderByWithRelationInput = {
    terceroId?: Prisma.SortOrder;
    tabla?: Prisma.SortOrder;
    sedeId?: Prisma.SortOrder;
    tercero?: Prisma.TerceroOrderByWithRelationInput;
    sede?: Prisma.SedeOrderByWithRelationInput;
};
export type AccesoDatoWhereUniqueInput = Prisma.AtLeast<{
    terceroId_tabla_sedeId?: Prisma.AccesoDatoTerceroIdTablaSedeIdCompoundUniqueInput;
    AND?: Prisma.AccesoDatoWhereInput | Prisma.AccesoDatoWhereInput[];
    OR?: Prisma.AccesoDatoWhereInput[];
    NOT?: Prisma.AccesoDatoWhereInput | Prisma.AccesoDatoWhereInput[];
    terceroId?: Prisma.StringFilter<"AccesoDato"> | string;
    tabla?: Prisma.EnumTablaProtegidaFilter<"AccesoDato"> | $Enums.TablaProtegida;
    sedeId?: Prisma.StringFilter<"AccesoDato"> | string;
    tercero?: Prisma.XOR<Prisma.TerceroScalarRelationFilter, Prisma.TerceroWhereInput>;
    sede?: Prisma.XOR<Prisma.SedeScalarRelationFilter, Prisma.SedeWhereInput>;
}, "terceroId_tabla_sedeId">;
export type AccesoDatoOrderByWithAggregationInput = {
    terceroId?: Prisma.SortOrder;
    tabla?: Prisma.SortOrder;
    sedeId?: Prisma.SortOrder;
    _count?: Prisma.AccesoDatoCountOrderByAggregateInput;
    _max?: Prisma.AccesoDatoMaxOrderByAggregateInput;
    _min?: Prisma.AccesoDatoMinOrderByAggregateInput;
};
export type AccesoDatoScalarWhereWithAggregatesInput = {
    AND?: Prisma.AccesoDatoScalarWhereWithAggregatesInput | Prisma.AccesoDatoScalarWhereWithAggregatesInput[];
    OR?: Prisma.AccesoDatoScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AccesoDatoScalarWhereWithAggregatesInput | Prisma.AccesoDatoScalarWhereWithAggregatesInput[];
    terceroId?: Prisma.StringWithAggregatesFilter<"AccesoDato"> | string;
    tabla?: Prisma.EnumTablaProtegidaWithAggregatesFilter<"AccesoDato"> | $Enums.TablaProtegida;
    sedeId?: Prisma.StringWithAggregatesFilter<"AccesoDato"> | string;
};
export type AccesoDatoCreateInput = {
    tabla: $Enums.TablaProtegida;
    tercero: Prisma.TerceroCreateNestedOneWithoutAccesoDatosInput;
    sede: Prisma.SedeCreateNestedOneWithoutAccesoDatosInput;
};
export type AccesoDatoUncheckedCreateInput = {
    terceroId: string;
    tabla: $Enums.TablaProtegida;
    sedeId: string;
};
export type AccesoDatoUpdateInput = {
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
    tercero?: Prisma.TerceroUpdateOneRequiredWithoutAccesoDatosNestedInput;
    sede?: Prisma.SedeUpdateOneRequiredWithoutAccesoDatosNestedInput;
};
export type AccesoDatoUncheckedUpdateInput = {
    terceroId?: Prisma.StringFieldUpdateOperationsInput | string;
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
    sedeId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type AccesoDatoCreateManyInput = {
    terceroId: string;
    tabla: $Enums.TablaProtegida;
    sedeId: string;
};
export type AccesoDatoUpdateManyMutationInput = {
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
};
export type AccesoDatoUncheckedUpdateManyInput = {
    terceroId?: Prisma.StringFieldUpdateOperationsInput | string;
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
    sedeId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type AccesoDatoListRelationFilter = {
    every?: Prisma.AccesoDatoWhereInput;
    some?: Prisma.AccesoDatoWhereInput;
    none?: Prisma.AccesoDatoWhereInput;
};
export type AccesoDatoOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AccesoDatoTerceroIdTablaSedeIdCompoundUniqueInput = {
    terceroId: string;
    tabla: $Enums.TablaProtegida;
    sedeId: string;
};
export type AccesoDatoCountOrderByAggregateInput = {
    terceroId?: Prisma.SortOrder;
    tabla?: Prisma.SortOrder;
    sedeId?: Prisma.SortOrder;
};
export type AccesoDatoMaxOrderByAggregateInput = {
    terceroId?: Prisma.SortOrder;
    tabla?: Prisma.SortOrder;
    sedeId?: Prisma.SortOrder;
};
export type AccesoDatoMinOrderByAggregateInput = {
    terceroId?: Prisma.SortOrder;
    tabla?: Prisma.SortOrder;
    sedeId?: Prisma.SortOrder;
};
export type AccesoDatoCreateNestedManyWithoutSedeInput = {
    create?: Prisma.XOR<Prisma.AccesoDatoCreateWithoutSedeInput, Prisma.AccesoDatoUncheckedCreateWithoutSedeInput> | Prisma.AccesoDatoCreateWithoutSedeInput[] | Prisma.AccesoDatoUncheckedCreateWithoutSedeInput[];
    connectOrCreate?: Prisma.AccesoDatoCreateOrConnectWithoutSedeInput | Prisma.AccesoDatoCreateOrConnectWithoutSedeInput[];
    createMany?: Prisma.AccesoDatoCreateManySedeInputEnvelope;
    connect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
};
export type AccesoDatoUncheckedCreateNestedManyWithoutSedeInput = {
    create?: Prisma.XOR<Prisma.AccesoDatoCreateWithoutSedeInput, Prisma.AccesoDatoUncheckedCreateWithoutSedeInput> | Prisma.AccesoDatoCreateWithoutSedeInput[] | Prisma.AccesoDatoUncheckedCreateWithoutSedeInput[];
    connectOrCreate?: Prisma.AccesoDatoCreateOrConnectWithoutSedeInput | Prisma.AccesoDatoCreateOrConnectWithoutSedeInput[];
    createMany?: Prisma.AccesoDatoCreateManySedeInputEnvelope;
    connect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
};
export type AccesoDatoUpdateManyWithoutSedeNestedInput = {
    create?: Prisma.XOR<Prisma.AccesoDatoCreateWithoutSedeInput, Prisma.AccesoDatoUncheckedCreateWithoutSedeInput> | Prisma.AccesoDatoCreateWithoutSedeInput[] | Prisma.AccesoDatoUncheckedCreateWithoutSedeInput[];
    connectOrCreate?: Prisma.AccesoDatoCreateOrConnectWithoutSedeInput | Prisma.AccesoDatoCreateOrConnectWithoutSedeInput[];
    upsert?: Prisma.AccesoDatoUpsertWithWhereUniqueWithoutSedeInput | Prisma.AccesoDatoUpsertWithWhereUniqueWithoutSedeInput[];
    createMany?: Prisma.AccesoDatoCreateManySedeInputEnvelope;
    set?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    disconnect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    delete?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    connect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    update?: Prisma.AccesoDatoUpdateWithWhereUniqueWithoutSedeInput | Prisma.AccesoDatoUpdateWithWhereUniqueWithoutSedeInput[];
    updateMany?: Prisma.AccesoDatoUpdateManyWithWhereWithoutSedeInput | Prisma.AccesoDatoUpdateManyWithWhereWithoutSedeInput[];
    deleteMany?: Prisma.AccesoDatoScalarWhereInput | Prisma.AccesoDatoScalarWhereInput[];
};
export type AccesoDatoUncheckedUpdateManyWithoutSedeNestedInput = {
    create?: Prisma.XOR<Prisma.AccesoDatoCreateWithoutSedeInput, Prisma.AccesoDatoUncheckedCreateWithoutSedeInput> | Prisma.AccesoDatoCreateWithoutSedeInput[] | Prisma.AccesoDatoUncheckedCreateWithoutSedeInput[];
    connectOrCreate?: Prisma.AccesoDatoCreateOrConnectWithoutSedeInput | Prisma.AccesoDatoCreateOrConnectWithoutSedeInput[];
    upsert?: Prisma.AccesoDatoUpsertWithWhereUniqueWithoutSedeInput | Prisma.AccesoDatoUpsertWithWhereUniqueWithoutSedeInput[];
    createMany?: Prisma.AccesoDatoCreateManySedeInputEnvelope;
    set?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    disconnect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    delete?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    connect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    update?: Prisma.AccesoDatoUpdateWithWhereUniqueWithoutSedeInput | Prisma.AccesoDatoUpdateWithWhereUniqueWithoutSedeInput[];
    updateMany?: Prisma.AccesoDatoUpdateManyWithWhereWithoutSedeInput | Prisma.AccesoDatoUpdateManyWithWhereWithoutSedeInput[];
    deleteMany?: Prisma.AccesoDatoScalarWhereInput | Prisma.AccesoDatoScalarWhereInput[];
};
export type AccesoDatoCreateNestedManyWithoutTerceroInput = {
    create?: Prisma.XOR<Prisma.AccesoDatoCreateWithoutTerceroInput, Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput> | Prisma.AccesoDatoCreateWithoutTerceroInput[] | Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput[];
    connectOrCreate?: Prisma.AccesoDatoCreateOrConnectWithoutTerceroInput | Prisma.AccesoDatoCreateOrConnectWithoutTerceroInput[];
    createMany?: Prisma.AccesoDatoCreateManyTerceroInputEnvelope;
    connect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
};
export type AccesoDatoUncheckedCreateNestedManyWithoutTerceroInput = {
    create?: Prisma.XOR<Prisma.AccesoDatoCreateWithoutTerceroInput, Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput> | Prisma.AccesoDatoCreateWithoutTerceroInput[] | Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput[];
    connectOrCreate?: Prisma.AccesoDatoCreateOrConnectWithoutTerceroInput | Prisma.AccesoDatoCreateOrConnectWithoutTerceroInput[];
    createMany?: Prisma.AccesoDatoCreateManyTerceroInputEnvelope;
    connect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
};
export type AccesoDatoUpdateManyWithoutTerceroNestedInput = {
    create?: Prisma.XOR<Prisma.AccesoDatoCreateWithoutTerceroInput, Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput> | Prisma.AccesoDatoCreateWithoutTerceroInput[] | Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput[];
    connectOrCreate?: Prisma.AccesoDatoCreateOrConnectWithoutTerceroInput | Prisma.AccesoDatoCreateOrConnectWithoutTerceroInput[];
    upsert?: Prisma.AccesoDatoUpsertWithWhereUniqueWithoutTerceroInput | Prisma.AccesoDatoUpsertWithWhereUniqueWithoutTerceroInput[];
    createMany?: Prisma.AccesoDatoCreateManyTerceroInputEnvelope;
    set?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    disconnect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    delete?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    connect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    update?: Prisma.AccesoDatoUpdateWithWhereUniqueWithoutTerceroInput | Prisma.AccesoDatoUpdateWithWhereUniqueWithoutTerceroInput[];
    updateMany?: Prisma.AccesoDatoUpdateManyWithWhereWithoutTerceroInput | Prisma.AccesoDatoUpdateManyWithWhereWithoutTerceroInput[];
    deleteMany?: Prisma.AccesoDatoScalarWhereInput | Prisma.AccesoDatoScalarWhereInput[];
};
export type AccesoDatoUncheckedUpdateManyWithoutTerceroNestedInput = {
    create?: Prisma.XOR<Prisma.AccesoDatoCreateWithoutTerceroInput, Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput> | Prisma.AccesoDatoCreateWithoutTerceroInput[] | Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput[];
    connectOrCreate?: Prisma.AccesoDatoCreateOrConnectWithoutTerceroInput | Prisma.AccesoDatoCreateOrConnectWithoutTerceroInput[];
    upsert?: Prisma.AccesoDatoUpsertWithWhereUniqueWithoutTerceroInput | Prisma.AccesoDatoUpsertWithWhereUniqueWithoutTerceroInput[];
    createMany?: Prisma.AccesoDatoCreateManyTerceroInputEnvelope;
    set?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    disconnect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    delete?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    connect?: Prisma.AccesoDatoWhereUniqueInput | Prisma.AccesoDatoWhereUniqueInput[];
    update?: Prisma.AccesoDatoUpdateWithWhereUniqueWithoutTerceroInput | Prisma.AccesoDatoUpdateWithWhereUniqueWithoutTerceroInput[];
    updateMany?: Prisma.AccesoDatoUpdateManyWithWhereWithoutTerceroInput | Prisma.AccesoDatoUpdateManyWithWhereWithoutTerceroInput[];
    deleteMany?: Prisma.AccesoDatoScalarWhereInput | Prisma.AccesoDatoScalarWhereInput[];
};
export type EnumTablaProtegidaFieldUpdateOperationsInput = {
    set?: $Enums.TablaProtegida;
};
export type AccesoDatoCreateWithoutSedeInput = {
    tabla: $Enums.TablaProtegida;
    tercero: Prisma.TerceroCreateNestedOneWithoutAccesoDatosInput;
};
export type AccesoDatoUncheckedCreateWithoutSedeInput = {
    terceroId: string;
    tabla: $Enums.TablaProtegida;
};
export type AccesoDatoCreateOrConnectWithoutSedeInput = {
    where: Prisma.AccesoDatoWhereUniqueInput;
    create: Prisma.XOR<Prisma.AccesoDatoCreateWithoutSedeInput, Prisma.AccesoDatoUncheckedCreateWithoutSedeInput>;
};
export type AccesoDatoCreateManySedeInputEnvelope = {
    data: Prisma.AccesoDatoCreateManySedeInput | Prisma.AccesoDatoCreateManySedeInput[];
    skipDuplicates?: boolean;
};
export type AccesoDatoUpsertWithWhereUniqueWithoutSedeInput = {
    where: Prisma.AccesoDatoWhereUniqueInput;
    update: Prisma.XOR<Prisma.AccesoDatoUpdateWithoutSedeInput, Prisma.AccesoDatoUncheckedUpdateWithoutSedeInput>;
    create: Prisma.XOR<Prisma.AccesoDatoCreateWithoutSedeInput, Prisma.AccesoDatoUncheckedCreateWithoutSedeInput>;
};
export type AccesoDatoUpdateWithWhereUniqueWithoutSedeInput = {
    where: Prisma.AccesoDatoWhereUniqueInput;
    data: Prisma.XOR<Prisma.AccesoDatoUpdateWithoutSedeInput, Prisma.AccesoDatoUncheckedUpdateWithoutSedeInput>;
};
export type AccesoDatoUpdateManyWithWhereWithoutSedeInput = {
    where: Prisma.AccesoDatoScalarWhereInput;
    data: Prisma.XOR<Prisma.AccesoDatoUpdateManyMutationInput, Prisma.AccesoDatoUncheckedUpdateManyWithoutSedeInput>;
};
export type AccesoDatoScalarWhereInput = {
    AND?: Prisma.AccesoDatoScalarWhereInput | Prisma.AccesoDatoScalarWhereInput[];
    OR?: Prisma.AccesoDatoScalarWhereInput[];
    NOT?: Prisma.AccesoDatoScalarWhereInput | Prisma.AccesoDatoScalarWhereInput[];
    terceroId?: Prisma.StringFilter<"AccesoDato"> | string;
    tabla?: Prisma.EnumTablaProtegidaFilter<"AccesoDato"> | $Enums.TablaProtegida;
    sedeId?: Prisma.StringFilter<"AccesoDato"> | string;
};
export type AccesoDatoCreateWithoutTerceroInput = {
    tabla: $Enums.TablaProtegida;
    sede: Prisma.SedeCreateNestedOneWithoutAccesoDatosInput;
};
export type AccesoDatoUncheckedCreateWithoutTerceroInput = {
    tabla: $Enums.TablaProtegida;
    sedeId: string;
};
export type AccesoDatoCreateOrConnectWithoutTerceroInput = {
    where: Prisma.AccesoDatoWhereUniqueInput;
    create: Prisma.XOR<Prisma.AccesoDatoCreateWithoutTerceroInput, Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput>;
};
export type AccesoDatoCreateManyTerceroInputEnvelope = {
    data: Prisma.AccesoDatoCreateManyTerceroInput | Prisma.AccesoDatoCreateManyTerceroInput[];
    skipDuplicates?: boolean;
};
export type AccesoDatoUpsertWithWhereUniqueWithoutTerceroInput = {
    where: Prisma.AccesoDatoWhereUniqueInput;
    update: Prisma.XOR<Prisma.AccesoDatoUpdateWithoutTerceroInput, Prisma.AccesoDatoUncheckedUpdateWithoutTerceroInput>;
    create: Prisma.XOR<Prisma.AccesoDatoCreateWithoutTerceroInput, Prisma.AccesoDatoUncheckedCreateWithoutTerceroInput>;
};
export type AccesoDatoUpdateWithWhereUniqueWithoutTerceroInput = {
    where: Prisma.AccesoDatoWhereUniqueInput;
    data: Prisma.XOR<Prisma.AccesoDatoUpdateWithoutTerceroInput, Prisma.AccesoDatoUncheckedUpdateWithoutTerceroInput>;
};
export type AccesoDatoUpdateManyWithWhereWithoutTerceroInput = {
    where: Prisma.AccesoDatoScalarWhereInput;
    data: Prisma.XOR<Prisma.AccesoDatoUpdateManyMutationInput, Prisma.AccesoDatoUncheckedUpdateManyWithoutTerceroInput>;
};
export type AccesoDatoCreateManySedeInput = {
    terceroId: string;
    tabla: $Enums.TablaProtegida;
};
export type AccesoDatoUpdateWithoutSedeInput = {
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
    tercero?: Prisma.TerceroUpdateOneRequiredWithoutAccesoDatosNestedInput;
};
export type AccesoDatoUncheckedUpdateWithoutSedeInput = {
    terceroId?: Prisma.StringFieldUpdateOperationsInput | string;
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
};
export type AccesoDatoUncheckedUpdateManyWithoutSedeInput = {
    terceroId?: Prisma.StringFieldUpdateOperationsInput | string;
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
};
export type AccesoDatoCreateManyTerceroInput = {
    tabla: $Enums.TablaProtegida;
    sedeId: string;
};
export type AccesoDatoUpdateWithoutTerceroInput = {
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
    sede?: Prisma.SedeUpdateOneRequiredWithoutAccesoDatosNestedInput;
};
export type AccesoDatoUncheckedUpdateWithoutTerceroInput = {
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
    sedeId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type AccesoDatoUncheckedUpdateManyWithoutTerceroInput = {
    tabla?: Prisma.EnumTablaProtegidaFieldUpdateOperationsInput | $Enums.TablaProtegida;
    sedeId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type AccesoDatoSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    terceroId?: boolean;
    tabla?: boolean;
    sedeId?: boolean;
    tercero?: boolean | Prisma.TerceroDefaultArgs<ExtArgs>;
    sede?: boolean | Prisma.SedeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["accesoDato"]>;
export type AccesoDatoSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    terceroId?: boolean;
    tabla?: boolean;
    sedeId?: boolean;
    tercero?: boolean | Prisma.TerceroDefaultArgs<ExtArgs>;
    sede?: boolean | Prisma.SedeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["accesoDato"]>;
export type AccesoDatoSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    terceroId?: boolean;
    tabla?: boolean;
    sedeId?: boolean;
    tercero?: boolean | Prisma.TerceroDefaultArgs<ExtArgs>;
    sede?: boolean | Prisma.SedeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["accesoDato"]>;
export type AccesoDatoSelectScalar = {
    terceroId?: boolean;
    tabla?: boolean;
    sedeId?: boolean;
};
export type AccesoDatoOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"terceroId" | "tabla" | "sedeId", ExtArgs["result"]["accesoDato"]>;
export type AccesoDatoInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tercero?: boolean | Prisma.TerceroDefaultArgs<ExtArgs>;
    sede?: boolean | Prisma.SedeDefaultArgs<ExtArgs>;
};
export type AccesoDatoIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tercero?: boolean | Prisma.TerceroDefaultArgs<ExtArgs>;
    sede?: boolean | Prisma.SedeDefaultArgs<ExtArgs>;
};
export type AccesoDatoIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tercero?: boolean | Prisma.TerceroDefaultArgs<ExtArgs>;
    sede?: boolean | Prisma.SedeDefaultArgs<ExtArgs>;
};
export type $AccesoDatoPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AccesoDato";
    objects: {
        tercero: Prisma.$TerceroPayload<ExtArgs>;
        sede: Prisma.$SedePayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        terceroId: string;
        tabla: $Enums.TablaProtegida;
        sedeId: string;
    }, ExtArgs["result"]["accesoDato"]>;
    composites: {};
};
export type AccesoDatoGetPayload<S extends boolean | null | undefined | AccesoDatoDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload, S>;
export type AccesoDatoCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AccesoDatoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AccesoDatoCountAggregateInputType | true;
};
export interface AccesoDatoDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['AccesoDato'];
        meta: {
            name: 'AccesoDato';
        };
    };
    findUnique<T extends AccesoDatoFindUniqueArgs>(args: Prisma.SelectSubset<T, AccesoDatoFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AccesoDatoClient<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends AccesoDatoFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AccesoDatoFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AccesoDatoClient<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends AccesoDatoFindFirstArgs>(args?: Prisma.SelectSubset<T, AccesoDatoFindFirstArgs<ExtArgs>>): Prisma.Prisma__AccesoDatoClient<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends AccesoDatoFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AccesoDatoFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AccesoDatoClient<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends AccesoDatoFindManyArgs>(args?: Prisma.SelectSubset<T, AccesoDatoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends AccesoDatoCreateArgs>(args: Prisma.SelectSubset<T, AccesoDatoCreateArgs<ExtArgs>>): Prisma.Prisma__AccesoDatoClient<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends AccesoDatoCreateManyArgs>(args?: Prisma.SelectSubset<T, AccesoDatoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends AccesoDatoCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AccesoDatoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends AccesoDatoDeleteArgs>(args: Prisma.SelectSubset<T, AccesoDatoDeleteArgs<ExtArgs>>): Prisma.Prisma__AccesoDatoClient<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends AccesoDatoUpdateArgs>(args: Prisma.SelectSubset<T, AccesoDatoUpdateArgs<ExtArgs>>): Prisma.Prisma__AccesoDatoClient<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends AccesoDatoDeleteManyArgs>(args?: Prisma.SelectSubset<T, AccesoDatoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends AccesoDatoUpdateManyArgs>(args: Prisma.SelectSubset<T, AccesoDatoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends AccesoDatoUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AccesoDatoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends AccesoDatoUpsertArgs>(args: Prisma.SelectSubset<T, AccesoDatoUpsertArgs<ExtArgs>>): Prisma.Prisma__AccesoDatoClient<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends AccesoDatoCountArgs>(args?: Prisma.Subset<T, AccesoDatoCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AccesoDatoCountAggregateOutputType> : number>;
    aggregate<T extends AccesoDatoAggregateArgs>(args: Prisma.Subset<T, AccesoDatoAggregateArgs>): Prisma.PrismaPromise<GetAccesoDatoAggregateType<T>>;
    groupBy<T extends AccesoDatoGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AccesoDatoGroupByArgs['orderBy'];
    } : {
        orderBy?: AccesoDatoGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AccesoDatoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAccesoDatoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: AccesoDatoFieldRefs;
}
export interface Prisma__AccesoDatoClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    tercero<T extends Prisma.TerceroDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TerceroDefaultArgs<ExtArgs>>): Prisma.Prisma__TerceroClient<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    sede<T extends Prisma.SedeDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SedeDefaultArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface AccesoDatoFieldRefs {
    readonly terceroId: Prisma.FieldRef<"AccesoDato", 'String'>;
    readonly tabla: Prisma.FieldRef<"AccesoDato", 'TablaProtegida'>;
    readonly sedeId: Prisma.FieldRef<"AccesoDato", 'String'>;
}
export type AccesoDatoFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelect<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    include?: Prisma.AccesoDatoInclude<ExtArgs> | null;
    where: Prisma.AccesoDatoWhereUniqueInput;
};
export type AccesoDatoFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelect<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    include?: Prisma.AccesoDatoInclude<ExtArgs> | null;
    where: Prisma.AccesoDatoWhereUniqueInput;
};
export type AccesoDatoFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AccesoDatoFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AccesoDatoFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AccesoDatoCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelect<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    include?: Prisma.AccesoDatoInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AccesoDatoCreateInput, Prisma.AccesoDatoUncheckedCreateInput>;
};
export type AccesoDatoCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.AccesoDatoCreateManyInput | Prisma.AccesoDatoCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AccesoDatoCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    data: Prisma.AccesoDatoCreateManyInput | Prisma.AccesoDatoCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.AccesoDatoIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type AccesoDatoUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelect<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    include?: Prisma.AccesoDatoInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AccesoDatoUpdateInput, Prisma.AccesoDatoUncheckedUpdateInput>;
    where: Prisma.AccesoDatoWhereUniqueInput;
};
export type AccesoDatoUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.AccesoDatoUpdateManyMutationInput, Prisma.AccesoDatoUncheckedUpdateManyInput>;
    where?: Prisma.AccesoDatoWhereInput;
    limit?: number;
};
export type AccesoDatoUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AccesoDatoUpdateManyMutationInput, Prisma.AccesoDatoUncheckedUpdateManyInput>;
    where?: Prisma.AccesoDatoWhereInput;
    limit?: number;
    include?: Prisma.AccesoDatoIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type AccesoDatoUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelect<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    include?: Prisma.AccesoDatoInclude<ExtArgs> | null;
    where: Prisma.AccesoDatoWhereUniqueInput;
    create: Prisma.XOR<Prisma.AccesoDatoCreateInput, Prisma.AccesoDatoUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.AccesoDatoUpdateInput, Prisma.AccesoDatoUncheckedUpdateInput>;
};
export type AccesoDatoDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelect<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    include?: Prisma.AccesoDatoInclude<ExtArgs> | null;
    where: Prisma.AccesoDatoWhereUniqueInput;
};
export type AccesoDatoDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AccesoDatoWhereInput;
    limit?: number;
};
export type AccesoDatoDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AccesoDatoSelect<ExtArgs> | null;
    omit?: Prisma.AccesoDatoOmit<ExtArgs> | null;
    include?: Prisma.AccesoDatoInclude<ExtArgs> | null;
};
