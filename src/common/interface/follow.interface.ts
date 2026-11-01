import type mongoose from "mongoose";
import type { FollowStatusEnum } from "../enum/follow.enum.js";

export interface IFollow {
    follower: mongoose.Types.ObjectId;
    following: mongoose.Types.ObjectId;
    status: FollowStatusEnum;
}