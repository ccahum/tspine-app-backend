import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type PerfilModel = runtime.Types.Result.DefaultSelection<Prisma.$PerfilPayload>;
export type AggregatePerfil = {
    _count: PerfilCountAggregateOutputType | null;
    _min: PerfilMinAggregateOutputType | null;
    _max: PerfilMaxAggregateOutputType | null;
};
export type PerfilMinAggregateOutputType = {
    id: string | null;
    nombre: string | null;
    reglas: $Enums.ReglaCrud | null;
    vistaInicial: string | null;
};
export type PerfilMaxAggregateOutputType = {
    id: string | null;
    nombre: string | null;
    reglas: $Enums.ReglaCrud | null;
    vistaInicial: string | null;
};
export type PerfilCountAggregateOutputType = {
    id: number;
    nombre: number;
    reglas: number;
    vistaInicial: number;
    _all: number;
};
export type PerfilMinAggregateInputType = {
    id?: true;
    nombre?: true;
    reglas?: true;
    vistaInicial?: true;
};
export type PerfilMaxAggregateInputType = {
    id?: true;
    nombre?: true;
    reglas?: true;
    vistaInicial?: true;
};
export type PerfilCountAggregateInputType = {
    id?: true;
    nombre?: true;
    reglas?: true;
    vistaInicial?: true;
    _all?: true;
};
export type PerfilAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PerfilWhereInput;
    orderBy?: Prisma.PerfilOrderByWithRelationInput | Prisma.PerfilOrderByWithRelationInput[];
    cursor?: Prisma.PerfilWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PerfilCountAggregateInputType;
    _min?: PerfilMinAggregateInputType;
    _max?: PerfilMaxAggregateInputType;
};
export type GetPerfilAggregateType<T extends PerfilAggregateArgs> = {
    [P in keyof T & keyof AggregatePerfil]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePerfil[P]> : Prisma.GetScalarType<T[P], AggregatePerfil[P]>;
};
export type PerfilGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PerfilWhereInput;
    orderBy?: Prisma.PerfilOrderByWithAggregationInput | Prisma.PerfilOrderByWithAggregationInput[];
    by: Prisma.PerfilScalarFieldEnum[] | Prisma.PerfilScalarFieldEnum;
    having?: Prisma.PerfilScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PerfilCountAggregateInputType | true;
    _min?: PerfilMinAggregateInputType;
    _max?: PerfilMaxAggregateInputType;
};
export type PerfilGroupByOutputType = {
    id: string;
    nombre: string;
    reglas: $Enums.ReglaCrud;
    vistaInicial: string | null;
    _count: PerfilCountAggregateOutputType | null;
    _min: PerfilMinAggregateOutputType | null;
    _max: PerfilMaxAggregateOutputType | null;
};
export type GetPerfilGroupByPayload<T extends PerfilGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PerfilGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PerfilGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PerfilGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PerfilGroupByOutputType[P]>;
}>>;
export type PerfilWhereInput = {
    AND?: Prisma.PerfilWhereInput | Prisma.PerfilWhereInput[];
    OR?: Prisma.PerfilWhereInput[];
    NOT?: Prisma.PerfilWhereInput | Prisma.PerfilWhereInput[];
    id?: Prisma.StringFilter<"Perfil"> | string;
    nombre?: Prisma.StringFilter<"Perfil"> | string;
    reglas?: Prisma.EnumReglaCrudFilter<"Perfil"> | $Enums.ReglaCrud;
    vistaInicial?: Prisma.StringNullableFilter<"Perfil"> | string | null;
    terceros?: Prisma.TerceroListRelationFilter;
    vistas?: Prisma.PerfilVistaListRelationFilter;
};
export type PerfilOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
    reglas?: Prisma.SortOrder;
    vistaInicial?: Prisma.SortOrderInput | Prisma.SortOrder;
    terceros?: Prisma.TerceroOrderByRelationAggregateInput;
    vistas?: Prisma.PerfilVistaOrderByRelationAggregateInput;
};
export type PerfilWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.PerfilWhereInput | Prisma.PerfilWhereInput[];
    OR?: Prisma.PerfilWhereInput[];
    NOT?: Prisma.PerfilWhereInput | Prisma.PerfilWhereInput[];
    nombre?: Prisma.StringFilter<"Perfil"> | string;
    reglas?: Prisma.EnumReglaCrudFilter<"Perfil"> | $Enums.ReglaCrud;
    vistaInicial?: Prisma.StringNullableFilter<"Perfil"> | string | null;
    terceros?: Prisma.TerceroListRelationFilter;
    vistas?: Prisma.PerfilVistaListRelationFilter;
}, "id">;
export type PerfilOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
    reglas?: Prisma.SortOrder;
    vistaInicial?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.PerfilCountOrderByAggregateInput;
    _max?: Prisma.PerfilMaxOrderByAggregateInput;
    _min?: Prisma.PerfilMinOrderByAggregateInput;
};
export type PerfilScalarWhereWithAggregatesInput = {
    AND?: Prisma.PerfilScalarWhereWithAggregatesInput | Prisma.PerfilScalarWhereWithAggregatesInput[];
    OR?: Prisma.PerfilScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PerfilScalarWhereWithAggregatesInput | Prisma.PerfilScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Perfil"> | string;
    nombre?: Prisma.StringWithAggregatesFilter<"Perfil"> | string;
    reglas?: Prisma.EnumReglaCrudWithAggregatesFilter<"Perfil"> | $Enums.ReglaCrud;
    vistaInicial?: Prisma.StringNullableWithAggregatesFilter<"Perfil"> | string | null;
};
export type PerfilCreateInput = {
    id: string;
    nombre: string;
    reglas?: $Enums.ReglaCrud;
    vistaInicial?: string | null;
    terceros?: Prisma.TerceroCreateNestedManyWithoutPerfilInput;
    vistas?: Prisma.PerfilVistaCreateNestedManyWithoutPerfilInput;
};
export type PerfilUncheckedCreateInput = {
    id: string;
    nombre: string;
    reglas?: $Enums.ReglaCrud;
    vistaInicial?: string | null;
    terceros?: Prisma.TerceroUncheckedCreateNestedManyWithoutPerfilInput;
    vistas?: Prisma.PerfilVistaUncheckedCreateNestedManyWithoutPerfilInput;
};
export type PerfilUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    reglas?: Prisma.EnumReglaCrudFieldUpdateOperationsInput | $Enums.ReglaCrud;
    vistaInicial?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    terceros?: Prisma.TerceroUpdateManyWithoutPerfilNestedInput;
    vistas?: Prisma.PerfilVistaUpdateManyWithoutPerfilNestedInput;
};
export type PerfilUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    reglas?: Prisma.EnumReglaCrudFieldUpdateOperationsInput | $Enums.ReglaCrud;
    vistaInicial?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    terceros?: Prisma.TerceroUncheckedUpdateManyWithoutPerfilNestedInput;
    vistas?: Prisma.PerfilVistaUncheckedUpdateManyWithoutPerfilNestedInput;
};
export type PerfilCreateManyInput = {
    id: string;
    nombre: string;
    reglas?: $Enums.ReglaCrud;
    vistaInicial?: string | null;
};
export type PerfilUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    reglas?: Prisma.EnumReglaCrudFieldUpdateOperationsInput | $Enums.ReglaCrud;
    vistaInicial?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type PerfilUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    reglas?: Prisma.EnumReglaCrudFieldUpdateOperationsInput | $Enums.ReglaCrud;
    vistaInicial?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type PerfilCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
    reglas?: Prisma.SortOrder;
    vistaInicial?: Prisma.SortOrder;
};
export type PerfilMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
    reglas?: Prisma.SortOrder;
    vistaInicial?: Prisma.SortOrder;
};
export type PerfilMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
    reglas?: Prisma.SortOrder;
    vistaInicial?: Prisma.SortOrder;
};
export type PerfilNullableScalarRelationFilter = {
    is?: Prisma.PerfilWhereInput | null;
    isNot?: Prisma.PerfilWhereInput | null;
};
export type PerfilScalarRelationFilter = {
    is?: Prisma.PerfilWhereInput;
    isNot?: Prisma.PerfilWhereInput;
};
export type EnumReglaCrudFieldUpdateOperationsInput = {
    set?: $Enums.ReglaCrud;
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type PerfilCreateNestedOneWithoutTercerosInput = {
    create?: Prisma.XOR<Prisma.PerfilCreateWithoutTercerosInput, Prisma.PerfilUncheckedCreateWithoutTercerosInput>;
    connectOrCreate?: Prisma.PerfilCreateOrConnectWithoutTercerosInput;
    connect?: Prisma.PerfilWhereUniqueInput;
};
export type PerfilUpdateOneWithoutTercerosNestedInput = {
    create?: Prisma.XOR<Prisma.PerfilCreateWithoutTercerosInput, Prisma.PerfilUncheckedCreateWithoutTercerosInput>;
    connectOrCreate?: Prisma.PerfilCreateOrConnectWithoutTercerosInput;
    upsert?: Prisma.PerfilUpsertWithoutTercerosInput;
    disconnect?: Prisma.PerfilWhereInput | boolean;
    delete?: Prisma.PerfilWhereInput | boolean;
    connect?: Prisma.PerfilWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PerfilUpdateToOneWithWhereWithoutTercerosInput, Prisma.PerfilUpdateWithoutTercerosInput>, Prisma.PerfilUncheckedUpdateWithoutTercerosInput>;
};
export type PerfilCreateNestedOneWithoutVistasInput = {
    create?: Prisma.XOR<Prisma.PerfilCreateWithoutVistasInput, Prisma.PerfilUncheckedCreateWithoutVistasInput>;
    connectOrCreate?: Prisma.PerfilCreateOrConnectWithoutVistasInput;
    connect?: Prisma.PerfilWhereUniqueInput;
};
export type PerfilUpdateOneRequiredWithoutVistasNestedInput = {
    create?: Prisma.XOR<Prisma.PerfilCreateWithoutVistasInput, Prisma.PerfilUncheckedCreateWithoutVistasInput>;
    connectOrCreate?: Prisma.PerfilCreateOrConnectWithoutVistasInput;
    upsert?: Prisma.PerfilUpsertWithoutVistasInput;
    connect?: Prisma.PerfilWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PerfilUpdateToOneWithWhereWithoutVistasInput, Prisma.PerfilUpdateWithoutVistasInput>, Prisma.PerfilUncheckedUpdateWithoutVistasInput>;
};
export type PerfilCreateWithoutTercerosInput = {
    id: string;
    nombre: string;
    reglas?: $Enums.ReglaCrud;
    vistaInicial?: string | null;
    vistas?: Prisma.PerfilVistaCreateNestedManyWithoutPerfilInput;
};
export type PerfilUncheckedCreateWithoutTercerosInput = {
    id: string;
    nombre: string;
    reglas?: $Enums.ReglaCrud;
    vistaInicial?: string | null;
    vistas?: Prisma.PerfilVistaUncheckedCreateNestedManyWithoutPerfilInput;
};
export type PerfilCreateOrConnectWithoutTercerosInput = {
    where: Prisma.PerfilWhereUniqueInput;
    create: Prisma.XOR<Prisma.PerfilCreateWithoutTercerosInput, Prisma.PerfilUncheckedCreateWithoutTercerosInput>;
};
export type PerfilUpsertWithoutTercerosInput = {
    update: Prisma.XOR<Prisma.PerfilUpdateWithoutTercerosInput, Prisma.PerfilUncheckedUpdateWithoutTercerosInput>;
    create: Prisma.XOR<Prisma.PerfilCreateWithoutTercerosInput, Prisma.PerfilUncheckedCreateWithoutTercerosInput>;
    where?: Prisma.PerfilWhereInput;
};
export type PerfilUpdateToOneWithWhereWithoutTercerosInput = {
    where?: Prisma.PerfilWhereInput;
    data: Prisma.XOR<Prisma.PerfilUpdateWithoutTercerosInput, Prisma.PerfilUncheckedUpdateWithoutTercerosInput>;
};
export type PerfilUpdateWithoutTercerosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    reglas?: Prisma.EnumReglaCrudFieldUpdateOperationsInput | $Enums.ReglaCrud;
    vistaInicial?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    vistas?: Prisma.PerfilVistaUpdateManyWithoutPerfilNestedInput;
};
export type PerfilUncheckedUpdateWithoutTercerosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    reglas?: Prisma.EnumReglaCrudFieldUpdateOperationsInput | $Enums.ReglaCrud;
    vistaInicial?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    vistas?: Prisma.PerfilVistaUncheckedUpdateManyWithoutPerfilNestedInput;
};
export type PerfilCreateWithoutVistasInput = {
    id: string;
    nombre: string;
    reglas?: $Enums.ReglaCrud;
    vistaInicial?: string | null;
    terceros?: Prisma.TerceroCreateNestedManyWithoutPerfilInput;
};
export type PerfilUncheckedCreateWithoutVistasInput = {
    id: string;
    nombre: string;
    reglas?: $Enums.ReglaCrud;
    vistaInicial?: string | null;
    terceros?: Prisma.TerceroUncheckedCreateNestedManyWithoutPerfilInput;
};
export type PerfilCreateOrConnectWithoutVistasInput = {
    where: Prisma.PerfilWhereUniqueInput;
    create: Prisma.XOR<Prisma.PerfilCreateWithoutVistasInput, Prisma.PerfilUncheckedCreateWithoutVistasInput>;
};
export type PerfilUpsertWithoutVistasInput = {
    update: Prisma.XOR<Prisma.PerfilUpdateWithoutVistasInput, Prisma.PerfilUncheckedUpdateWithoutVistasInput>;
    create: Prisma.XOR<Prisma.PerfilCreateWithoutVistasInput, Prisma.PerfilUncheckedCreateWithoutVistasInput>;
    where?: Prisma.PerfilWhereInput;
};
export type PerfilUpdateToOneWithWhereWithoutVistasInput = {
    where?: Prisma.PerfilWhereInput;
    data: Prisma.XOR<Prisma.PerfilUpdateWithoutVistasInput, Prisma.PerfilUncheckedUpdateWithoutVistasInput>;
};
export type PerfilUpdateWithoutVistasInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    reglas?: Prisma.EnumReglaCrudFieldUpdateOperationsInput | $Enums.ReglaCrud;
    vistaInicial?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    terceros?: Prisma.TerceroUpdateManyWithoutPerfilNestedInput;
};
export type PerfilUncheckedUpdateWithoutVistasInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    reglas?: Prisma.EnumReglaCrudFieldUpdateOperationsInput | $Enums.ReglaCrud;
    vistaInicial?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    terceros?: Prisma.TerceroUncheckedUpdateManyWithoutPerfilNestedInput;
};
export type PerfilCountOutputType = {
    terceros: number;
    vistas: number;
};
export type PerfilCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    terceros?: boolean | PerfilCountOutputTypeCountTercerosArgs;
    vistas?: boolean | PerfilCountOutputTypeCountVistasArgs;
};
export type PerfilCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilCountOutputTypeSelect<ExtArgs> | null;
};
export type PerfilCountOutputTypeCountTercerosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TerceroWhereInput;
};
export type PerfilCountOutputTypeCountVistasArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PerfilVistaWhereInput;
};
export type PerfilSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombre?: boolean;
    reglas?: boolean;
    vistaInicial?: boolean;
    terceros?: boolean | Prisma.Perfil$tercerosArgs<ExtArgs>;
    vistas?: boolean | Prisma.Perfil$vistasArgs<ExtArgs>;
    _count?: boolean | Prisma.PerfilCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["perfil"]>;
export type PerfilSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombre?: boolean;
    reglas?: boolean;
    vistaInicial?: boolean;
}, ExtArgs["result"]["perfil"]>;
export type PerfilSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombre?: boolean;
    reglas?: boolean;
    vistaInicial?: boolean;
}, ExtArgs["result"]["perfil"]>;
export type PerfilSelectScalar = {
    id?: boolean;
    nombre?: boolean;
    reglas?: boolean;
    vistaInicial?: boolean;
};
export type PerfilOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "nombre" | "reglas" | "vistaInicial", ExtArgs["result"]["perfil"]>;
export type PerfilInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    terceros?: boolean | Prisma.Perfil$tercerosArgs<ExtArgs>;
    vistas?: boolean | Prisma.Perfil$vistasArgs<ExtArgs>;
    _count?: boolean | Prisma.PerfilCountOutputTypeDefaultArgs<ExtArgs>;
};
export type PerfilIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type PerfilIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $PerfilPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Perfil";
    objects: {
        terceros: Prisma.$TerceroPayload<ExtArgs>[];
        vistas: Prisma.$PerfilVistaPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        nombre: string;
        reglas: $Enums.ReglaCrud;
        vistaInicial: string | null;
    }, ExtArgs["result"]["perfil"]>;
    composites: {};
};
export type PerfilGetPayload<S extends boolean | null | undefined | PerfilDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PerfilPayload, S>;
export type PerfilCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PerfilFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PerfilCountAggregateInputType | true;
};
export interface PerfilDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Perfil'];
        meta: {
            name: 'Perfil';
        };
    };
    findUnique<T extends PerfilFindUniqueArgs>(args: Prisma.SelectSubset<T, PerfilFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PerfilFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PerfilFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PerfilFindFirstArgs>(args?: Prisma.SelectSubset<T, PerfilFindFirstArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PerfilFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PerfilFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PerfilFindManyArgs>(args?: Prisma.SelectSubset<T, PerfilFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PerfilCreateArgs>(args: Prisma.SelectSubset<T, PerfilCreateArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PerfilCreateManyArgs>(args?: Prisma.SelectSubset<T, PerfilCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PerfilCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PerfilCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PerfilDeleteArgs>(args: Prisma.SelectSubset<T, PerfilDeleteArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PerfilUpdateArgs>(args: Prisma.SelectSubset<T, PerfilUpdateArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PerfilDeleteManyArgs>(args?: Prisma.SelectSubset<T, PerfilDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PerfilUpdateManyArgs>(args: Prisma.SelectSubset<T, PerfilUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PerfilUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PerfilUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PerfilUpsertArgs>(args: Prisma.SelectSubset<T, PerfilUpsertArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PerfilCountArgs>(args?: Prisma.Subset<T, PerfilCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PerfilCountAggregateOutputType> : number>;
    aggregate<T extends PerfilAggregateArgs>(args: Prisma.Subset<T, PerfilAggregateArgs>): Prisma.PrismaPromise<GetPerfilAggregateType<T>>;
    groupBy<T extends PerfilGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PerfilGroupByArgs['orderBy'];
    } : {
        orderBy?: PerfilGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PerfilGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPerfilGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PerfilFieldRefs;
}
export interface Prisma__PerfilClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    terceros<T extends Prisma.Perfil$tercerosArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Perfil$tercerosArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    vistas<T extends Prisma.Perfil$vistasArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Perfil$vistasArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PerfilFieldRefs {
    readonly id: Prisma.FieldRef<"Perfil", 'String'>;
    readonly nombre: Prisma.FieldRef<"Perfil", 'String'>;
    readonly reglas: Prisma.FieldRef<"Perfil", 'ReglaCrud'>;
    readonly vistaInicial: Prisma.FieldRef<"Perfil", 'String'>;
}
export type PerfilFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    where: Prisma.PerfilWhereUniqueInput;
};
export type PerfilFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    where: Prisma.PerfilWhereUniqueInput;
};
export type PerfilFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    where?: Prisma.PerfilWhereInput;
    orderBy?: Prisma.PerfilOrderByWithRelationInput | Prisma.PerfilOrderByWithRelationInput[];
    cursor?: Prisma.PerfilWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PerfilScalarFieldEnum | Prisma.PerfilScalarFieldEnum[];
};
export type PerfilFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    where?: Prisma.PerfilWhereInput;
    orderBy?: Prisma.PerfilOrderByWithRelationInput | Prisma.PerfilOrderByWithRelationInput[];
    cursor?: Prisma.PerfilWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PerfilScalarFieldEnum | Prisma.PerfilScalarFieldEnum[];
};
export type PerfilFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    where?: Prisma.PerfilWhereInput;
    orderBy?: Prisma.PerfilOrderByWithRelationInput | Prisma.PerfilOrderByWithRelationInput[];
    cursor?: Prisma.PerfilWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PerfilScalarFieldEnum | Prisma.PerfilScalarFieldEnum[];
};
export type PerfilCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PerfilCreateInput, Prisma.PerfilUncheckedCreateInput>;
};
export type PerfilCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PerfilCreateManyInput | Prisma.PerfilCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PerfilCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    data: Prisma.PerfilCreateManyInput | Prisma.PerfilCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PerfilUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PerfilUpdateInput, Prisma.PerfilUncheckedUpdateInput>;
    where: Prisma.PerfilWhereUniqueInput;
};
export type PerfilUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PerfilUpdateManyMutationInput, Prisma.PerfilUncheckedUpdateManyInput>;
    where?: Prisma.PerfilWhereInput;
    limit?: number;
};
export type PerfilUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PerfilUpdateManyMutationInput, Prisma.PerfilUncheckedUpdateManyInput>;
    where?: Prisma.PerfilWhereInput;
    limit?: number;
};
export type PerfilUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    where: Prisma.PerfilWhereUniqueInput;
    create: Prisma.XOR<Prisma.PerfilCreateInput, Prisma.PerfilUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PerfilUpdateInput, Prisma.PerfilUncheckedUpdateInput>;
};
export type PerfilDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
    where: Prisma.PerfilWhereUniqueInput;
};
export type PerfilDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PerfilWhereInput;
    limit?: number;
};
export type Perfil$tercerosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Perfil$vistasArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelect<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    include?: Prisma.PerfilVistaInclude<ExtArgs> | null;
    where?: Prisma.PerfilVistaWhereInput;
    orderBy?: Prisma.PerfilVistaOrderByWithRelationInput | Prisma.PerfilVistaOrderByWithRelationInput[];
    cursor?: Prisma.PerfilVistaWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PerfilVistaScalarFieldEnum | Prisma.PerfilVistaScalarFieldEnum[];
};
export type PerfilDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilSelect<ExtArgs> | null;
    omit?: Prisma.PerfilOmit<ExtArgs> | null;
    include?: Prisma.PerfilInclude<ExtArgs> | null;
};
