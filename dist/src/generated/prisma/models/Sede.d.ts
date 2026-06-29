import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type SedeModel = runtime.Types.Result.DefaultSelection<Prisma.$SedePayload>;
export type AggregateSede = {
    _count: SedeCountAggregateOutputType | null;
    _min: SedeMinAggregateOutputType | null;
    _max: SedeMaxAggregateOutputType | null;
};
export type SedeMinAggregateOutputType = {
    id: string | null;
    nombre: string | null;
};
export type SedeMaxAggregateOutputType = {
    id: string | null;
    nombre: string | null;
};
export type SedeCountAggregateOutputType = {
    id: number;
    nombre: number;
    _all: number;
};
export type SedeMinAggregateInputType = {
    id?: true;
    nombre?: true;
};
export type SedeMaxAggregateInputType = {
    id?: true;
    nombre?: true;
};
export type SedeCountAggregateInputType = {
    id?: true;
    nombre?: true;
    _all?: true;
};
export type SedeAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SedeWhereInput;
    orderBy?: Prisma.SedeOrderByWithRelationInput | Prisma.SedeOrderByWithRelationInput[];
    cursor?: Prisma.SedeWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SedeCountAggregateInputType;
    _min?: SedeMinAggregateInputType;
    _max?: SedeMaxAggregateInputType;
};
export type GetSedeAggregateType<T extends SedeAggregateArgs> = {
    [P in keyof T & keyof AggregateSede]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSede[P]> : Prisma.GetScalarType<T[P], AggregateSede[P]>;
};
export type SedeGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SedeWhereInput;
    orderBy?: Prisma.SedeOrderByWithAggregationInput | Prisma.SedeOrderByWithAggregationInput[];
    by: Prisma.SedeScalarFieldEnum[] | Prisma.SedeScalarFieldEnum;
    having?: Prisma.SedeScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SedeCountAggregateInputType | true;
    _min?: SedeMinAggregateInputType;
    _max?: SedeMaxAggregateInputType;
};
export type SedeGroupByOutputType = {
    id: string;
    nombre: string;
    _count: SedeCountAggregateOutputType | null;
    _min: SedeMinAggregateOutputType | null;
    _max: SedeMaxAggregateOutputType | null;
};
export type GetSedeGroupByPayload<T extends SedeGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SedeGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SedeGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SedeGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SedeGroupByOutputType[P]>;
}>>;
export type SedeWhereInput = {
    AND?: Prisma.SedeWhereInput | Prisma.SedeWhereInput[];
    OR?: Prisma.SedeWhereInput[];
    NOT?: Prisma.SedeWhereInput | Prisma.SedeWhereInput[];
    id?: Prisma.StringFilter<"Sede"> | string;
    nombre?: Prisma.StringFilter<"Sede"> | string;
    terceros?: Prisma.TerceroListRelationFilter;
    accesoDatos?: Prisma.AccesoDatoListRelationFilter;
};
export type SedeOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
    terceros?: Prisma.TerceroOrderByRelationAggregateInput;
    accesoDatos?: Prisma.AccesoDatoOrderByRelationAggregateInput;
};
export type SedeWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.SedeWhereInput | Prisma.SedeWhereInput[];
    OR?: Prisma.SedeWhereInput[];
    NOT?: Prisma.SedeWhereInput | Prisma.SedeWhereInput[];
    nombre?: Prisma.StringFilter<"Sede"> | string;
    terceros?: Prisma.TerceroListRelationFilter;
    accesoDatos?: Prisma.AccesoDatoListRelationFilter;
}, "id">;
export type SedeOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
    _count?: Prisma.SedeCountOrderByAggregateInput;
    _max?: Prisma.SedeMaxOrderByAggregateInput;
    _min?: Prisma.SedeMinOrderByAggregateInput;
};
export type SedeScalarWhereWithAggregatesInput = {
    AND?: Prisma.SedeScalarWhereWithAggregatesInput | Prisma.SedeScalarWhereWithAggregatesInput[];
    OR?: Prisma.SedeScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SedeScalarWhereWithAggregatesInput | Prisma.SedeScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Sede"> | string;
    nombre?: Prisma.StringWithAggregatesFilter<"Sede"> | string;
};
export type SedeCreateInput = {
    id: string;
    nombre: string;
    terceros?: Prisma.TerceroCreateNestedManyWithoutSedeInput;
    accesoDatos?: Prisma.AccesoDatoCreateNestedManyWithoutSedeInput;
};
export type SedeUncheckedCreateInput = {
    id: string;
    nombre: string;
    terceros?: Prisma.TerceroUncheckedCreateNestedManyWithoutSedeInput;
    accesoDatos?: Prisma.AccesoDatoUncheckedCreateNestedManyWithoutSedeInput;
};
export type SedeUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    terceros?: Prisma.TerceroUpdateManyWithoutSedeNestedInput;
    accesoDatos?: Prisma.AccesoDatoUpdateManyWithoutSedeNestedInput;
};
export type SedeUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    terceros?: Prisma.TerceroUncheckedUpdateManyWithoutSedeNestedInput;
    accesoDatos?: Prisma.AccesoDatoUncheckedUpdateManyWithoutSedeNestedInput;
};
export type SedeCreateManyInput = {
    id: string;
    nombre: string;
};
export type SedeUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type SedeUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type SedeCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
};
export type SedeMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
};
export type SedeMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    nombre?: Prisma.SortOrder;
};
export type SedeNullableScalarRelationFilter = {
    is?: Prisma.SedeWhereInput | null;
    isNot?: Prisma.SedeWhereInput | null;
};
export type SedeScalarRelationFilter = {
    is?: Prisma.SedeWhereInput;
    isNot?: Prisma.SedeWhereInput;
};
export type StringFieldUpdateOperationsInput = {
    set?: string;
};
export type SedeCreateNestedOneWithoutTercerosInput = {
    create?: Prisma.XOR<Prisma.SedeCreateWithoutTercerosInput, Prisma.SedeUncheckedCreateWithoutTercerosInput>;
    connectOrCreate?: Prisma.SedeCreateOrConnectWithoutTercerosInput;
    connect?: Prisma.SedeWhereUniqueInput;
};
export type SedeUpdateOneWithoutTercerosNestedInput = {
    create?: Prisma.XOR<Prisma.SedeCreateWithoutTercerosInput, Prisma.SedeUncheckedCreateWithoutTercerosInput>;
    connectOrCreate?: Prisma.SedeCreateOrConnectWithoutTercerosInput;
    upsert?: Prisma.SedeUpsertWithoutTercerosInput;
    disconnect?: Prisma.SedeWhereInput | boolean;
    delete?: Prisma.SedeWhereInput | boolean;
    connect?: Prisma.SedeWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SedeUpdateToOneWithWhereWithoutTercerosInput, Prisma.SedeUpdateWithoutTercerosInput>, Prisma.SedeUncheckedUpdateWithoutTercerosInput>;
};
export type SedeCreateNestedOneWithoutAccesoDatosInput = {
    create?: Prisma.XOR<Prisma.SedeCreateWithoutAccesoDatosInput, Prisma.SedeUncheckedCreateWithoutAccesoDatosInput>;
    connectOrCreate?: Prisma.SedeCreateOrConnectWithoutAccesoDatosInput;
    connect?: Prisma.SedeWhereUniqueInput;
};
export type SedeUpdateOneRequiredWithoutAccesoDatosNestedInput = {
    create?: Prisma.XOR<Prisma.SedeCreateWithoutAccesoDatosInput, Prisma.SedeUncheckedCreateWithoutAccesoDatosInput>;
    connectOrCreate?: Prisma.SedeCreateOrConnectWithoutAccesoDatosInput;
    upsert?: Prisma.SedeUpsertWithoutAccesoDatosInput;
    connect?: Prisma.SedeWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SedeUpdateToOneWithWhereWithoutAccesoDatosInput, Prisma.SedeUpdateWithoutAccesoDatosInput>, Prisma.SedeUncheckedUpdateWithoutAccesoDatosInput>;
};
export type SedeCreateWithoutTercerosInput = {
    id: string;
    nombre: string;
    accesoDatos?: Prisma.AccesoDatoCreateNestedManyWithoutSedeInput;
};
export type SedeUncheckedCreateWithoutTercerosInput = {
    id: string;
    nombre: string;
    accesoDatos?: Prisma.AccesoDatoUncheckedCreateNestedManyWithoutSedeInput;
};
export type SedeCreateOrConnectWithoutTercerosInput = {
    where: Prisma.SedeWhereUniqueInput;
    create: Prisma.XOR<Prisma.SedeCreateWithoutTercerosInput, Prisma.SedeUncheckedCreateWithoutTercerosInput>;
};
export type SedeUpsertWithoutTercerosInput = {
    update: Prisma.XOR<Prisma.SedeUpdateWithoutTercerosInput, Prisma.SedeUncheckedUpdateWithoutTercerosInput>;
    create: Prisma.XOR<Prisma.SedeCreateWithoutTercerosInput, Prisma.SedeUncheckedCreateWithoutTercerosInput>;
    where?: Prisma.SedeWhereInput;
};
export type SedeUpdateToOneWithWhereWithoutTercerosInput = {
    where?: Prisma.SedeWhereInput;
    data: Prisma.XOR<Prisma.SedeUpdateWithoutTercerosInput, Prisma.SedeUncheckedUpdateWithoutTercerosInput>;
};
export type SedeUpdateWithoutTercerosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    accesoDatos?: Prisma.AccesoDatoUpdateManyWithoutSedeNestedInput;
};
export type SedeUncheckedUpdateWithoutTercerosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    accesoDatos?: Prisma.AccesoDatoUncheckedUpdateManyWithoutSedeNestedInput;
};
export type SedeCreateWithoutAccesoDatosInput = {
    id: string;
    nombre: string;
    terceros?: Prisma.TerceroCreateNestedManyWithoutSedeInput;
};
export type SedeUncheckedCreateWithoutAccesoDatosInput = {
    id: string;
    nombre: string;
    terceros?: Prisma.TerceroUncheckedCreateNestedManyWithoutSedeInput;
};
export type SedeCreateOrConnectWithoutAccesoDatosInput = {
    where: Prisma.SedeWhereUniqueInput;
    create: Prisma.XOR<Prisma.SedeCreateWithoutAccesoDatosInput, Prisma.SedeUncheckedCreateWithoutAccesoDatosInput>;
};
export type SedeUpsertWithoutAccesoDatosInput = {
    update: Prisma.XOR<Prisma.SedeUpdateWithoutAccesoDatosInput, Prisma.SedeUncheckedUpdateWithoutAccesoDatosInput>;
    create: Prisma.XOR<Prisma.SedeCreateWithoutAccesoDatosInput, Prisma.SedeUncheckedCreateWithoutAccesoDatosInput>;
    where?: Prisma.SedeWhereInput;
};
export type SedeUpdateToOneWithWhereWithoutAccesoDatosInput = {
    where?: Prisma.SedeWhereInput;
    data: Prisma.XOR<Prisma.SedeUpdateWithoutAccesoDatosInput, Prisma.SedeUncheckedUpdateWithoutAccesoDatosInput>;
};
export type SedeUpdateWithoutAccesoDatosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    terceros?: Prisma.TerceroUpdateManyWithoutSedeNestedInput;
};
export type SedeUncheckedUpdateWithoutAccesoDatosInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    nombre?: Prisma.StringFieldUpdateOperationsInput | string;
    terceros?: Prisma.TerceroUncheckedUpdateManyWithoutSedeNestedInput;
};
export type SedeCountOutputType = {
    terceros: number;
    accesoDatos: number;
};
export type SedeCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    terceros?: boolean | SedeCountOutputTypeCountTercerosArgs;
    accesoDatos?: boolean | SedeCountOutputTypeCountAccesoDatosArgs;
};
export type SedeCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeCountOutputTypeSelect<ExtArgs> | null;
};
export type SedeCountOutputTypeCountTercerosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TerceroWhereInput;
};
export type SedeCountOutputTypeCountAccesoDatosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AccesoDatoWhereInput;
};
export type SedeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombre?: boolean;
    terceros?: boolean | Prisma.Sede$tercerosArgs<ExtArgs>;
    accesoDatos?: boolean | Prisma.Sede$accesoDatosArgs<ExtArgs>;
    _count?: boolean | Prisma.SedeCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["sede"]>;
export type SedeSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombre?: boolean;
}, ExtArgs["result"]["sede"]>;
export type SedeSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    nombre?: boolean;
}, ExtArgs["result"]["sede"]>;
export type SedeSelectScalar = {
    id?: boolean;
    nombre?: boolean;
};
export type SedeOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "nombre", ExtArgs["result"]["sede"]>;
export type SedeInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    terceros?: boolean | Prisma.Sede$tercerosArgs<ExtArgs>;
    accesoDatos?: boolean | Prisma.Sede$accesoDatosArgs<ExtArgs>;
    _count?: boolean | Prisma.SedeCountOutputTypeDefaultArgs<ExtArgs>;
};
export type SedeIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type SedeIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $SedePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Sede";
    objects: {
        terceros: Prisma.$TerceroPayload<ExtArgs>[];
        accesoDatos: Prisma.$AccesoDatoPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        nombre: string;
    }, ExtArgs["result"]["sede"]>;
    composites: {};
};
export type SedeGetPayload<S extends boolean | null | undefined | SedeDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SedePayload, S>;
export type SedeCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SedeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SedeCountAggregateInputType | true;
};
export interface SedeDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Sede'];
        meta: {
            name: 'Sede';
        };
    };
    findUnique<T extends SedeFindUniqueArgs>(args: Prisma.SelectSubset<T, SedeFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SedeFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SedeFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SedeFindFirstArgs>(args?: Prisma.SelectSubset<T, SedeFindFirstArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SedeFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SedeFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SedeFindManyArgs>(args?: Prisma.SelectSubset<T, SedeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SedeCreateArgs>(args: Prisma.SelectSubset<T, SedeCreateArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SedeCreateManyArgs>(args?: Prisma.SelectSubset<T, SedeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SedeCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SedeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SedeDeleteArgs>(args: Prisma.SelectSubset<T, SedeDeleteArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SedeUpdateArgs>(args: Prisma.SelectSubset<T, SedeUpdateArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SedeDeleteManyArgs>(args?: Prisma.SelectSubset<T, SedeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SedeUpdateManyArgs>(args: Prisma.SelectSubset<T, SedeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SedeUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SedeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SedeUpsertArgs>(args: Prisma.SelectSubset<T, SedeUpsertArgs<ExtArgs>>): Prisma.Prisma__SedeClient<runtime.Types.Result.GetResult<Prisma.$SedePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SedeCountArgs>(args?: Prisma.Subset<T, SedeCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SedeCountAggregateOutputType> : number>;
    aggregate<T extends SedeAggregateArgs>(args: Prisma.Subset<T, SedeAggregateArgs>): Prisma.PrismaPromise<GetSedeAggregateType<T>>;
    groupBy<T extends SedeGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SedeGroupByArgs['orderBy'];
    } : {
        orderBy?: SedeGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SedeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSedeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SedeFieldRefs;
}
export interface Prisma__SedeClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    terceros<T extends Prisma.Sede$tercerosArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Sede$tercerosArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TerceroPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    accesoDatos<T extends Prisma.Sede$accesoDatosArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Sede$accesoDatosArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AccesoDatoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SedeFieldRefs {
    readonly id: Prisma.FieldRef<"Sede", 'String'>;
    readonly nombre: Prisma.FieldRef<"Sede", 'String'>;
}
export type SedeFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    where: Prisma.SedeWhereUniqueInput;
};
export type SedeFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    where: Prisma.SedeWhereUniqueInput;
};
export type SedeFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    where?: Prisma.SedeWhereInput;
    orderBy?: Prisma.SedeOrderByWithRelationInput | Prisma.SedeOrderByWithRelationInput[];
    cursor?: Prisma.SedeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SedeScalarFieldEnum | Prisma.SedeScalarFieldEnum[];
};
export type SedeFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    where?: Prisma.SedeWhereInput;
    orderBy?: Prisma.SedeOrderByWithRelationInput | Prisma.SedeOrderByWithRelationInput[];
    cursor?: Prisma.SedeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SedeScalarFieldEnum | Prisma.SedeScalarFieldEnum[];
};
export type SedeFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    where?: Prisma.SedeWhereInput;
    orderBy?: Prisma.SedeOrderByWithRelationInput | Prisma.SedeOrderByWithRelationInput[];
    cursor?: Prisma.SedeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SedeScalarFieldEnum | Prisma.SedeScalarFieldEnum[];
};
export type SedeCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SedeCreateInput, Prisma.SedeUncheckedCreateInput>;
};
export type SedeCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SedeCreateManyInput | Prisma.SedeCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SedeCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    data: Prisma.SedeCreateManyInput | Prisma.SedeCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SedeUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SedeUpdateInput, Prisma.SedeUncheckedUpdateInput>;
    where: Prisma.SedeWhereUniqueInput;
};
export type SedeUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SedeUpdateManyMutationInput, Prisma.SedeUncheckedUpdateManyInput>;
    where?: Prisma.SedeWhereInput;
    limit?: number;
};
export type SedeUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SedeUpdateManyMutationInput, Prisma.SedeUncheckedUpdateManyInput>;
    where?: Prisma.SedeWhereInput;
    limit?: number;
};
export type SedeUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    where: Prisma.SedeWhereUniqueInput;
    create: Prisma.XOR<Prisma.SedeCreateInput, Prisma.SedeUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SedeUpdateInput, Prisma.SedeUncheckedUpdateInput>;
};
export type SedeDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
    where: Prisma.SedeWhereUniqueInput;
};
export type SedeDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SedeWhereInput;
    limit?: number;
};
export type Sede$tercerosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Sede$accesoDatosArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type SedeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SedeSelect<ExtArgs> | null;
    omit?: Prisma.SedeOmit<ExtArgs> | null;
    include?: Prisma.SedeInclude<ExtArgs> | null;
};
