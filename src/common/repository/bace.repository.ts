import type mongoose from "mongoose";
import type { DeleteResult, FlattenMaps, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, UpdateQuery, UpdateWithAggregationPipeline, UpdateWriteOpResult } from "mongoose";
import type { AnyKeys, CreateOptions, HydratedDocument, Model, QueryFilter } from "mongoose";
import id from "zod/v4/locales/id.js";
import type { IPaginate } from "../interface/paginate.interface.js";




export abstract class DatabaseRepository<TRawDocType> {
    constructor(protected model: Model<TRawDocType>) {  //  model مختلف وانا بعمل ممكن اختار 
    }

    // over loading method تطبيق

    // CREATE  
    async create({ data }: { data: AnyKeys<TRawDocType> }): Promise<HydratedDocument<TRawDocType>>; // without options
    async create({ data, options }: { data: AnyKeys<TRawDocType>[]; options?: CreateOptions }): Promise<HydratedDocument<TRawDocType>[]>; // with option and data[]

    async create({ data, options }: { data: AnyKeys<TRawDocType> | AnyKeys<TRawDocType>[]; options?: CreateOptions }): Promise<HydratedDocument<TRawDocType> | HydratedDocument<TRawDocType>[]> {
        return await this.model.create(data as any, options) // انا غلب حماري ف لازم any
    }
    async createone({ data, options = {} }: { data: AnyKeys<TRawDocType> | AnyKeys<TRawDocType>[]; options?: CreateOptions }): Promise<HydratedDocument<TRawDocType>> {
        const [doc] = await this.create({ data: [data], options })
        return doc as HydratedDocument<TRawDocType>
    }

    //FINDERS




    async findOne({            // without lean
        filter,
        projection,
        options
    }: {
        filter: QueryFilter<TRawDocType>,
        projection?: ProjectionType<TRawDocType> | null | undefined,
        options?: QueryOptions<TRawDocType> & { lean?: false } | null | undefined
    }): Promise<HydratedDocument<TRawDocType> | undefined | null>



    async findOne({   // with lean
        filter,
        projection,
        options
    }: {
        filter: QueryFilter<TRawDocType>,
        projection?: ProjectionType<TRawDocType> | null | undefined,
        options?: QueryOptions<TRawDocType> & { lean: true } | null | undefined
    }): Promise<FlattenMaps<TRawDocType> | undefined | null>

    async findOne({
        filter = {},
        projection,
        options
    }: {
        filter: QueryFilter<TRawDocType>,
        projection?: ProjectionType<TRawDocType> | null | undefined,
        options?: QueryOptions<TRawDocType> & { lean?: boolean } | null | undefined
    }): Promise<HydratedDocument<TRawDocType> | FlattenMaps<TRawDocType> | undefined | null> {
        const doc = this.model.findOne(filter, projection)
        if (options?.populate) {   // علاقات
            doc.populate(options.populate as PopulateOptions[])
        }
        if (options?.lean) {   // ذي اخفي id
            doc.lean(options.lean)
        }

        return await doc.exec()
    }

    // find by id
    async findbyId({            // without lean
        id,
        projection,
        options
    }: {
        id: mongoose.Types.ObjectId,
        projection?: ProjectionType<TRawDocType> | null | undefined,
        options?: QueryOptions<TRawDocType> & { lean?: false } | null | undefined
    }): Promise<HydratedDocument<TRawDocType> | undefined | null>



    async findbyId({   // with lean
        id,
        projection,
        options
    }: {
        id: mongoose.Types.ObjectId,
        projection?: ProjectionType<TRawDocType> | null | undefined,
        options?: QueryOptions<TRawDocType> & { lean: true } | null | undefined
    }): Promise<FlattenMaps<TRawDocType> | undefined | null>

    async findbyId({
        id,
        projection,
        options
    }: {
        id: mongoose.Types.ObjectId,
        projection?: ProjectionType<TRawDocType> | null | undefined,
        options?: QueryOptions<TRawDocType> & { lean?: boolean } | null | undefined
    }): Promise<HydratedDocument<TRawDocType> | FlattenMaps<TRawDocType> | undefined | null> {
        const doc = this.model.findById(id, projection)
        if (options?.populate) {   // علاقات
            doc.populate(options.populate as PopulateOptions[])
        }
        if (options?.lean) {   // ذي اخفي id
            doc.lean(options.lean)
        }

        return await doc.exec()
    }


// FIND
async find({
    filter = {},
    options = {},
}: {
    filter?: QueryFilter<TRawDocType>,
    projection?: ProjectionType<TRawDocType> | null | undefined,
    options?: QueryOptions<TRawDocType>
}) {
    const doc = this.model.find(filter);
    if (options.select) {
        doc.select(options.select)
    }
    if (options.sort) {
        doc.sort(options.sort)
    }
    if (options.populate) {
        doc.populate(options.populate as PopulateOptions[]);
    }
    if (options.skip) {
        doc.skip(options.skip);
    }
    if (options.limit) {
    doc.limit(options.limit);
}
   
    return await doc.exec();
}


async countDocuments({
    filter = {},
}: {
    filter?: QueryFilter<TRawDocType>,
}): Promise<number> {
    return await this.model.countDocuments(filter)
}


async paginate({
    filter = {},
    options = {},
    page = 1,
    limit = 5,
}: {
    filter?: QueryFilter<TRawDocType>,
    projection?: ProjectionType<TRawDocType> | null | undefined,
    options?: QueryOptions<TRawDocType>,
    page: number,
    limit: number,
}): Promise<IPaginate<HydratedDocument<TRawDocType>>> {
    const skip = (page - 1) * limit;
    const count = await this.countDocuments({ filter })
    const pages = Math.ceil(count / limit)

    const docs = await this.find({
        filter,
        options: {
            skip,
            limit,
            ...options
        }
    })
        return { count ,limit ,pages,currentpage : page , docs}

}



// UPDATE
async updateOne(
    {
        filter = {},
        update,
        options
    }: {
        filter: QueryFilter<TRawDocType>,
        update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline,
        options?: MongooseUpdateQueryOptions<TRawDocType> | null
    }
): Promise<UpdateWriteOpResult> {
    return await this.model.updateOne(filter, update, options)
}



async updateMany(
    {
        filter = {},
        update,
        options
    }: {
        filter: QueryFilter<TRawDocType>,
        update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline,
        options?: MongooseUpdateQueryOptions<TRawDocType> | null
    }
): Promise<UpdateWriteOpResult> {
    return await this.model.updateMany(filter, update, options)
}


async findOneAndUpdate(
    {
        filter = {},
        update,
        options
    }: {
        filter?: QueryFilter<TRawDocType>,
        update?: UpdateQuery<TRawDocType>,
        options?: QueryOptions<TRawDocType> | null
    }
): Promise<HydratedDocument<TRawDocType> | null> {
    return await this.model.findOneAndUpdate(filter, update, {
        returnDocument: 'after',
        ...options
    })
}


async findbyIdAndUpdate(
    {
        id,
        update,
        options
    }: {
        id: mongoose.Types.ObjectId,
        update?: UpdateQuery<TRawDocType>,
        options?: QueryOptions<TRawDocType> | null
    }
): Promise<HydratedDocument<TRawDocType> | null> {
    return await this.model.findByIdAndUpdate(id, update, {
        returnDocument: 'after',
        ...options
    })
}



// DELETE
async deleteOne(
    {
        filter = {},
    }: {
        filter: QueryFilter<TRawDocType>,
    }
): Promise<DeleteResult> {
    return await this.model.deleteOne(filter)
}


async deleteMany(
    {
        filter = {},
    }: {
        filter: QueryFilter<TRawDocType>,
    }
): Promise<DeleteResult> {
    return await this.model.deleteMany(filter)
}


async findOneAndDelete(
    {
        filter = {}
    }: {
        filter?: QueryFilter<TRawDocType>,
    }
): Promise<HydratedDocument<TRawDocType> | null> {
    return await this.model.findOneAndDelete(filter)
}


async findbyIdAndDelete(
    {
        id
    }: {
        id: mongoose.Types.ObjectId,
    }
): Promise<HydratedDocument<TRawDocType> | null> {
    return await this.model.findByIdAndDelete(id)
}


}