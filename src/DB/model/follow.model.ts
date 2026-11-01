import mongoose, { type HydratedDocument } from "mongoose";
import { FollowStatusEnum } from "../../common/enum/follow.enum.js";
import type { IFollow } from "../../common/interface/follow.interface.js";

const followSchema = new mongoose.Schema<IFollow>(
    {
        follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: Number, enum: FollowStatusEnum, default: FollowStatusEnum.ACCEPTED }
    },
    { timestamps: true, strict: true, strictQuery: true }
)

followSchema.index({ follower: 1, following: 1 }, { unique: true })
followSchema.index({ following: 1, status: 1 })

export const FollowModel = mongoose.models.Follow || mongoose.model<IFollow>("Follow", followSchema)
export type HFollow = HydratedDocument<IFollow>