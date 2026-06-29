import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type PerfilVistaModel = runtime.Types.Result.DefaultSelection<Prisma.$PerfilVistaPayload>;
export type AggregatePerfilVista = {
    _count: PerfilVistaCountAggregateOutputType | null;
    _min: PerfilVistaMinAggregateOutputType | null;
    _max: PerfilVistaMaxAggregateOutputType | null;
};
export type PerfilVistaMinAggregateOutputType = {
    perfilId: string | null;
    vistaNombre: string | null;
};
export type PerfilVistaMaxAggregateOutputType = {
    perfilId: string | null;
    vistaNombre: string | null;
};
export type PerfilVistaCountAggregateOutputType = {
    perfilId: number;
    vistaNombre: number;
    _all: number;
};
export type PerfilVistaMinAggregateInputType = {
    perfilId?: true;
    vistaNombre?: true;
};
export type PerfilVistaMaxAggregateInputType = {
    perfilId?: true;
    vistaNombre?: true;
};
export type PerfilVistaCountAggregateInputType = {
    perfilId?: true;
    vistaNombre?: true;
    _all?: true;
};
export type PerfilVistaAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PerfilVistaWhereInput;
    orderBy?: Prisma.PerfilVistaOrderByWithRelationInput | Prisma.PerfilVistaOrderByWithRelationInput[];
    cursor?: Prisma.PerfilVistaWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PerfilVistaCountAggregateInputType;
    _min?: PerfilVistaMinAggregateInputType;
    _max?: PerfilVistaMaxAggregateInputType;
};
export type GetPerfilVistaAggregateType<T extends PerfilVistaAggregateArgs> = {
    [P in keyof T & keyof AggregatePerfilVista]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePerfilVista[P]> : Prisma.GetScalarType<T[P], AggregatePerfilVista[P]>;
};
export type PerfilVistaGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PerfilVistaWhereInput;
    orderBy?: Prisma.PerfilVistaOrderByWithAggregationInput | Prisma.PerfilVistaOrderByWithAggregationInput[];
    by: Prisma.PerfilVistaScalarFieldEnum[] | Prisma.PerfilVistaScalarFieldEnum;
    having?: Prisma.PerfilVistaScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PerfilVistaCountAggregateInputType | true;
    _min?: PerfilVistaMinAggregateInputType;
    _max?: PerfilVistaMaxAggregateInputType;
};
export type PerfilVistaGroupByOutputType = {
    perfilId: string;
    vistaNombre: string;
    _count: PerfilVistaCountAggregateOutputType | null;
    _min: PerfilVistaMinAggregateOutputType | null;
    _max: PerfilVistaMaxAggregateOutputType | null;
};
export type GetPerfilVistaGroupByPayload<T extends PerfilVistaGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PerfilVistaGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PerfilVistaGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PerfilVistaGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PerfilVistaGroupByOutputType[P]>;
}>>;
export type PerfilVistaWhereInput = {
    AND?: Prisma.PerfilVistaWhereInput | Prisma.PerfilVistaWhereInput[];
    OR?: Prisma.PerfilVistaWhereInput[];
    NOT?: Prisma.PerfilVistaWhereInput | Prisma.PerfilVistaWhereInput[];
    perfilId?: Prisma.StringFilter<"PerfilVista"> | string;
    vistaNombre?: Prisma.StringFilter<"PerfilVista"> | string;
    perfil?: Prisma.XOR<Prisma.PerfilScalarRelationFilter, Prisma.PerfilWhereInput>;
};
export type PerfilVistaOrderByWithRelationInput = {
    perfilId?: Prisma.SortOrder;
    vistaNombre?: Prisma.SortOrder;
    perfil?: Prisma.PerfilOrderByWithRelationInput;
};
export type PerfilVistaWhereUniqueInput = Prisma.AtLeast<{
    perfilId_vistaNombre?: Prisma.PerfilVistaPerfilIdVistaNombreCompoundUniqueInput;
    AND?: Prisma.PerfilVistaWhereInput | Prisma.PerfilVistaWhereInput[];
    OR?: Prisma.PerfilVistaWhereInput[];
    NOT?: Prisma.PerfilVistaWhereInput | Prisma.PerfilVistaWhereInput[];
    perfilId?: Prisma.StringFilter<"PerfilVista"> | string;
    vistaNombre?: Prisma.StringFilter<"PerfilVista"> | string;
    perfil?: Prisma.XOR<Prisma.PerfilScalarRelationFilter, Prisma.PerfilWhereInput>;
}, "perfilId_vistaNombre">;
export type PerfilVistaOrderByWithAggregationInput = {
    perfilId?: Prisma.SortOrder;
    vistaNombre?: Prisma.SortOrder;
    _count?: Prisma.PerfilVistaCountOrderByAggregateInput;
    _max?: Prisma.PerfilVistaMaxOrderByAggregateInput;
    _min?: Prisma.PerfilVistaMinOrderByAggregateInput;
};
export type PerfilVistaScalarWhereWithAggregatesInput = {
    AND?: Prisma.PerfilVistaScalarWhereWithAggregatesInput | Prisma.PerfilVistaScalarWhereWithAggregatesInput[];
    OR?: Prisma.PerfilVistaScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PerfilVistaScalarWhereWithAggregatesInput | Prisma.PerfilVistaScalarWhereWithAggregatesInput[];
    perfilId?: Prisma.StringWithAggregatesFilter<"PerfilVista"> | string;
    vistaNombre?: Prisma.StringWithAggregatesFilter<"PerfilVista"> | string;
};
export type PerfilVistaCreateInput = {
    vistaNombre: string;
    perfil: Prisma.PerfilCreateNestedOneWithoutVistasInput;
};
export type PerfilVistaUncheckedCreateInput = {
    perfilId: string;
    vistaNombre: string;
};
export type PerfilVistaUpdateInput = {
    vistaNombre?: Prisma.StringFieldUpdateOperationsInput | string;
    perfil?: Prisma.PerfilUpdateOneRequiredWithoutVistasNestedInput;
};
export type PerfilVistaUncheckedUpdateInput = {
    perfilId?: Prisma.StringFieldUpdateOperationsInput | string;
    vistaNombre?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PerfilVistaCreateManyInput = {
    perfilId: string;
    vistaNombre: string;
};
export type PerfilVistaUpdateManyMutationInput = {
    vistaNombre?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PerfilVistaUncheckedUpdateManyInput = {
    perfilId?: Prisma.StringFieldUpdateOperationsInput | string;
    vistaNombre?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PerfilVistaListRelationFilter = {
    every?: Prisma.PerfilVistaWhereInput;
    some?: Prisma.PerfilVistaWhereInput;
    none?: Prisma.PerfilVistaWhereInput;
};
export type PerfilVistaOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PerfilVistaPerfilIdVistaNombreCompoundUniqueInput = {
    perfilId: string;
    vistaNombre: string;
};
export type PerfilVistaCountOrderByAggregateInput = {
    perfilId?: Prisma.SortOrder;
    vistaNombre?: Prisma.SortOrder;
};
export type PerfilVistaMaxOrderByAggregateInput = {
    perfilId?: Prisma.SortOrder;
    vistaNombre?: Prisma.SortOrder;
};
export type PerfilVistaMinOrderByAggregateInput = {
    perfilId?: Prisma.SortOrder;
    vistaNombre?: Prisma.SortOrder;
};
export type PerfilVistaCreateNestedManyWithoutPerfilInput = {
    create?: Prisma.XOR<Prisma.PerfilVistaCreateWithoutPerfilInput, Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput> | Prisma.PerfilVistaCreateWithoutPerfilInput[] | Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput[];
    connectOrCreate?: Prisma.PerfilVistaCreateOrConnectWithoutPerfilInput | Prisma.PerfilVistaCreateOrConnectWithoutPerfilInput[];
    createMany?: Prisma.PerfilVistaCreateManyPerfilInputEnvelope;
    connect?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
};
export type PerfilVistaUncheckedCreateNestedManyWithoutPerfilInput = {
    create?: Prisma.XOR<Prisma.PerfilVistaCreateWithoutPerfilInput, Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput> | Prisma.PerfilVistaCreateWithoutPerfilInput[] | Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput[];
    connectOrCreate?: Prisma.PerfilVistaCreateOrConnectWithoutPerfilInput | Prisma.PerfilVistaCreateOrConnectWithoutPerfilInput[];
    createMany?: Prisma.PerfilVistaCreateManyPerfilInputEnvelope;
    connect?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
};
export type PerfilVistaUpdateManyWithoutPerfilNestedInput = {
    create?: Prisma.XOR<Prisma.PerfilVistaCreateWithoutPerfilInput, Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput> | Prisma.PerfilVistaCreateWithoutPerfilInput[] | Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput[];
    connectOrCreate?: Prisma.PerfilVistaCreateOrConnectWithoutPerfilInput | Prisma.PerfilVistaCreateOrConnectWithoutPerfilInput[];
    upsert?: Prisma.PerfilVistaUpsertWithWhereUniqueWithoutPerfilInput | Prisma.PerfilVistaUpsertWithWhereUniqueWithoutPerfilInput[];
    createMany?: Prisma.PerfilVistaCreateManyPerfilInputEnvelope;
    set?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
    disconnect?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
    delete?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
    connect?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
    update?: Prisma.PerfilVistaUpdateWithWhereUniqueWithoutPerfilInput | Prisma.PerfilVistaUpdateWithWhereUniqueWithoutPerfilInput[];
    updateMany?: Prisma.PerfilVistaUpdateManyWithWhereWithoutPerfilInput | Prisma.PerfilVistaUpdateManyWithWhereWithoutPerfilInput[];
    deleteMany?: Prisma.PerfilVistaScalarWhereInput | Prisma.PerfilVistaScalarWhereInput[];
};
export type PerfilVistaUncheckedUpdateManyWithoutPerfilNestedInput = {
    create?: Prisma.XOR<Prisma.PerfilVistaCreateWithoutPerfilInput, Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput> | Prisma.PerfilVistaCreateWithoutPerfilInput[] | Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput[];
    connectOrCreate?: Prisma.PerfilVistaCreateOrConnectWithoutPerfilInput | Prisma.PerfilVistaCreateOrConnectWithoutPerfilInput[];
    upsert?: Prisma.PerfilVistaUpsertWithWhereUniqueWithoutPerfilInput | Prisma.PerfilVistaUpsertWithWhereUniqueWithoutPerfilInput[];
    createMany?: Prisma.PerfilVistaCreateManyPerfilInputEnvelope;
    set?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
    disconnect?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
    delete?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
    connect?: Prisma.PerfilVistaWhereUniqueInput | Prisma.PerfilVistaWhereUniqueInput[];
    update?: Prisma.PerfilVistaUpdateWithWhereUniqueWithoutPerfilInput | Prisma.PerfilVistaUpdateWithWhereUniqueWithoutPerfilInput[];
    updateMany?: Prisma.PerfilVistaUpdateManyWithWhereWithoutPerfilInput | Prisma.PerfilVistaUpdateManyWithWhereWithoutPerfilInput[];
    deleteMany?: Prisma.PerfilVistaScalarWhereInput | Prisma.PerfilVistaScalarWhereInput[];
};
export type PerfilVistaCreateWithoutPerfilInput = {
    vistaNombre: string;
};
export type PerfilVistaUncheckedCreateWithoutPerfilInput = {
    vistaNombre: string;
};
export type PerfilVistaCreateOrConnectWithoutPerfilInput = {
    where: Prisma.PerfilVistaWhereUniqueInput;
    create: Prisma.XOR<Prisma.PerfilVistaCreateWithoutPerfilInput, Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput>;
};
export type PerfilVistaCreateManyPerfilInputEnvelope = {
    data: Prisma.PerfilVistaCreateManyPerfilInput | Prisma.PerfilVistaCreateManyPerfilInput[];
    skipDuplicates?: boolean;
};
export type PerfilVistaUpsertWithWhereUniqueWithoutPerfilInput = {
    where: Prisma.PerfilVistaWhereUniqueInput;
    update: Prisma.XOR<Prisma.PerfilVistaUpdateWithoutPerfilInput, Prisma.PerfilVistaUncheckedUpdateWithoutPerfilInput>;
    create: Prisma.XOR<Prisma.PerfilVistaCreateWithoutPerfilInput, Prisma.PerfilVistaUncheckedCreateWithoutPerfilInput>;
};
export type PerfilVistaUpdateWithWhereUniqueWithoutPerfilInput = {
    where: Prisma.PerfilVistaWhereUniqueInput;
    data: Prisma.XOR<Prisma.PerfilVistaUpdateWithoutPerfilInput, Prisma.PerfilVistaUncheckedUpdateWithoutPerfilInput>;
};
export type PerfilVistaUpdateManyWithWhereWithoutPerfilInput = {
    where: Prisma.PerfilVistaScalarWhereInput;
    data: Prisma.XOR<Prisma.PerfilVistaUpdateManyMutationInput, Prisma.PerfilVistaUncheckedUpdateManyWithoutPerfilInput>;
};
export type PerfilVistaScalarWhereInput = {
    AND?: Prisma.PerfilVistaScalarWhereInput | Prisma.PerfilVistaScalarWhereInput[];
    OR?: Prisma.PerfilVistaScalarWhereInput[];
    NOT?: Prisma.PerfilVistaScalarWhereInput | Prisma.PerfilVistaScalarWhereInput[];
    perfilId?: Prisma.StringFilter<"PerfilVista"> | string;
    vistaNombre?: Prisma.StringFilter<"PerfilVista"> | string;
};
export type PerfilVistaCreateManyPerfilInput = {
    vistaNombre: string;
};
export type PerfilVistaUpdateWithoutPerfilInput = {
    vistaNombre?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PerfilVistaUncheckedUpdateWithoutPerfilInput = {
    vistaNombre?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PerfilVistaUncheckedUpdateManyWithoutPerfilInput = {
    vistaNombre?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PerfilVistaSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    perfilId?: boolean;
    vistaNombre?: boolean;
    perfil?: boolean | Prisma.PerfilDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["perfilVista"]>;
export type PerfilVistaSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    perfilId?: boolean;
    vistaNombre?: boolean;
    perfil?: boolean | Prisma.PerfilDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["perfilVista"]>;
export type PerfilVistaSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    perfilId?: boolean;
    vistaNombre?: boolean;
    perfil?: boolean | Prisma.PerfilDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["perfilVista"]>;
export type PerfilVistaSelectScalar = {
    perfilId?: boolean;
    vistaNombre?: boolean;
};
export type PerfilVistaOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"perfilId" | "vistaNombre", ExtArgs["result"]["perfilVista"]>;
export type PerfilVistaInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    perfil?: boolean | Prisma.PerfilDefaultArgs<ExtArgs>;
};
export type PerfilVistaIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    perfil?: boolean | Prisma.PerfilDefaultArgs<ExtArgs>;
};
export type PerfilVistaIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    perfil?: boolean | Prisma.PerfilDefaultArgs<ExtArgs>;
};
export type $PerfilVistaPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PerfilVista";
    objects: {
        perfil: Prisma.$PerfilPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        perfilId: string;
        vistaNombre: string;
    }, ExtArgs["result"]["perfilVista"]>;
    composites: {};
};
export type PerfilVistaGetPayload<S extends boolean | null | undefined | PerfilVistaDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload, S>;
export type PerfilVistaCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PerfilVistaFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PerfilVistaCountAggregateInputType | true;
};
export interface PerfilVistaDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PerfilVista'];
        meta: {
            name: 'PerfilVista';
        };
    };
    findUnique<T extends PerfilVistaFindUniqueArgs>(args: Prisma.SelectSubset<T, PerfilVistaFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PerfilVistaClient<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PerfilVistaFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PerfilVistaFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PerfilVistaClient<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PerfilVistaFindFirstArgs>(args?: Prisma.SelectSubset<T, PerfilVistaFindFirstArgs<ExtArgs>>): Prisma.Prisma__PerfilVistaClient<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PerfilVistaFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PerfilVistaFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PerfilVistaClient<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PerfilVistaFindManyArgs>(args?: Prisma.SelectSubset<T, PerfilVistaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PerfilVistaCreateArgs>(args: Prisma.SelectSubset<T, PerfilVistaCreateArgs<ExtArgs>>): Prisma.Prisma__PerfilVistaClient<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PerfilVistaCreateManyArgs>(args?: Prisma.SelectSubset<T, PerfilVistaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PerfilVistaCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PerfilVistaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PerfilVistaDeleteArgs>(args: Prisma.SelectSubset<T, PerfilVistaDeleteArgs<ExtArgs>>): Prisma.Prisma__PerfilVistaClient<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PerfilVistaUpdateArgs>(args: Prisma.SelectSubset<T, PerfilVistaUpdateArgs<ExtArgs>>): Prisma.Prisma__PerfilVistaClient<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PerfilVistaDeleteManyArgs>(args?: Prisma.SelectSubset<T, PerfilVistaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PerfilVistaUpdateManyArgs>(args: Prisma.SelectSubset<T, PerfilVistaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PerfilVistaUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PerfilVistaUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PerfilVistaUpsertArgs>(args: Prisma.SelectSubset<T, PerfilVistaUpsertArgs<ExtArgs>>): Prisma.Prisma__PerfilVistaClient<runtime.Types.Result.GetResult<Prisma.$PerfilVistaPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PerfilVistaCountArgs>(args?: Prisma.Subset<T, PerfilVistaCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PerfilVistaCountAggregateOutputType> : number>;
    aggregate<T extends PerfilVistaAggregateArgs>(args: Prisma.Subset<T, PerfilVistaAggregateArgs>): Prisma.PrismaPromise<GetPerfilVistaAggregateType<T>>;
    groupBy<T extends PerfilVistaGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PerfilVistaGroupByArgs['orderBy'];
    } : {
        orderBy?: PerfilVistaGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PerfilVistaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPerfilVistaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PerfilVistaFieldRefs;
}
export interface Prisma__PerfilVistaClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    perfil<T extends Prisma.PerfilDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PerfilDefaultArgs<ExtArgs>>): Prisma.Prisma__PerfilClient<runtime.Types.Result.GetResult<Prisma.$PerfilPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PerfilVistaFieldRefs {
    readonly perfilId: Prisma.FieldRef<"PerfilVista", 'String'>;
    readonly vistaNombre: Prisma.FieldRef<"PerfilVista", 'String'>;
}
export type PerfilVistaFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelect<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    include?: Prisma.PerfilVistaInclude<ExtArgs> | null;
    where: Prisma.PerfilVistaWhereUniqueInput;
};
export type PerfilVistaFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelect<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    include?: Prisma.PerfilVistaInclude<ExtArgs> | null;
    where: Prisma.PerfilVistaWhereUniqueInput;
};
export type PerfilVistaFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PerfilVistaFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PerfilVistaFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PerfilVistaCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelect<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    include?: Prisma.PerfilVistaInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PerfilVistaCreateInput, Prisma.PerfilVistaUncheckedCreateInput>;
};
export type PerfilVistaCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PerfilVistaCreateManyInput | Prisma.PerfilVistaCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PerfilVistaCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    data: Prisma.PerfilVistaCreateManyInput | Prisma.PerfilVistaCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PerfilVistaIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PerfilVistaUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelect<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    include?: Prisma.PerfilVistaInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PerfilVistaUpdateInput, Prisma.PerfilVistaUncheckedUpdateInput>;
    where: Prisma.PerfilVistaWhereUniqueInput;
};
export type PerfilVistaUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PerfilVistaUpdateManyMutationInput, Prisma.PerfilVistaUncheckedUpdateManyInput>;
    where?: Prisma.PerfilVistaWhereInput;
    limit?: number;
};
export type PerfilVistaUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PerfilVistaUpdateManyMutationInput, Prisma.PerfilVistaUncheckedUpdateManyInput>;
    where?: Prisma.PerfilVistaWhereInput;
    limit?: number;
    include?: Prisma.PerfilVistaIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PerfilVistaUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelect<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    include?: Prisma.PerfilVistaInclude<ExtArgs> | null;
    where: Prisma.PerfilVistaWhereUniqueInput;
    create: Prisma.XOR<Prisma.PerfilVistaCreateInput, Prisma.PerfilVistaUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PerfilVistaUpdateInput, Prisma.PerfilVistaUncheckedUpdateInput>;
};
export type PerfilVistaDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelect<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    include?: Prisma.PerfilVistaInclude<ExtArgs> | null;
    where: Prisma.PerfilVistaWhereUniqueInput;
};
export type PerfilVistaDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PerfilVistaWhereInput;
    limit?: number;
};
export type PerfilVistaDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PerfilVistaSelect<ExtArgs> | null;
    omit?: Prisma.PerfilVistaOmit<ExtArgs> | null;
    include?: Prisma.PerfilVistaInclude<ExtArgs> | null;
};
