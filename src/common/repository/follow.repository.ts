import type { PipelineStage } from "mongoose";
import type { IFollow } from "../interface/follow.interface.js";
import { DatabaseRepository } from "./bace.repository.js";
import { FollowModel } from "../../DB/model/follow.model.js";

export class FollowRepository extends DatabaseRepository<IFollow> {
    constructor() {
        super(FollowModel)
    }

    async aggregate({ pipeline }: { pipeline: PipelineStage[] }) {
        return await this.model.aggregate(pipeline)
    }
}