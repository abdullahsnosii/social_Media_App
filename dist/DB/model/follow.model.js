"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const follow_enum_js_1 = require("../../common/enum/follow.enum.js");
const followSchema = new mongoose_1.default.Schema({
    follower: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: Number, enum: follow_enum_js_1.FollowStatusEnum, default: follow_enum_js_1.FollowStatusEnum.ACCEPTED }
}, { timestamps: true, strict: true, strictQuery: true });
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1, status: 1 });
exports.FollowModel = mongoose_1.default.models.Follow || mongoose_1.default.model("Follow", followSchema);
