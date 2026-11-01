"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSocialService = void 0;
const user_repository_js_1 = require("../../common/repository/user.repository.js");
const follow_repository_js_1 = require("../../common/repository/follow.repository.js");
const follow_enum_js_1 = require("../../common/enum/follow.enum.js");
const Domain_exciption_js_1 = require("../../common/exciption/Domain.exciption.js");
const PUBLIC_FIELDS = "firstName lastName image coverImage gender isPrivate createdAt";
const LIST_FIELDS = "firstName lastName image isPrivate";
class UserSocialService {
    userRepository = new user_repository_js_1.UserRepository();
    followRepository = new follow_repository_js_1.FollowRepository();
    async findActiveUser(id, projection) {
        return await this.userRepository.findOne({
            filter: { _id: id, confirmEmail: { $exists: true } },
            projection
        });
    }
    async relation(followerId, followingId) {
        return await this.followRepository.findOne({ filter: { follower: followerId, following: followingId } });
    }
    async getUserProfile(viewer, id) {
        const target = await this.findActiveUser(id, PUBLIC_FIELDS);
        if (!target)
            throw new Domain_exciption_js_1.NotFoundExciption("User not found");
        const [followersCount, followingCount, rel] = await Promise.all([
            this.followRepository.countDocuments({ filter: { following: target._id, status: follow_enum_js_1.FollowStatusEnum.ACCEPTED } }),
            this.followRepository.countDocuments({ filter: { follower: target._id, status: follow_enum_js_1.FollowStatusEnum.ACCEPTED } }),
            this.relation(viewer._id, target._id)
        ]);
        const isOwner = viewer._id.equals(target._id);
        const locked = !isOwner && !!target.isPrivate && rel?.status !== follow_enum_js_1.FollowStatusEnum.ACCEPTED;
        const user = locked
            ? { _id: target._id, firstName: target.firstName, lastName: target.lastName, image: target.image, isPrivate: true }
            : target;
        return {
            user,
            followersCount,
            followingCount,
            locked,
            followStatus: isOwner ? "self" : !rel ? "none" : rel.status === follow_enum_js_1.FollowStatusEnum.ACCEPTED ? "following" : "requested"
        };
    }
    async follow(user, targetId) {
        if (user._id.equals(targetId))
            throw new Domain_exciption_js_1.BadRequestExciption("You cannot follow yourself");
        const target = await this.findActiveUser(targetId, "isPrivate");
        if (!target)
            throw new Domain_exciption_js_1.NotFoundExciption("User not found");
        const exist = await this.relation(user._id, targetId);
        if (exist) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption(exist.status === follow_enum_js_1.FollowStatusEnum.ACCEPTED ? "Already following" : "Follow request already sent");
        }
        const status = target.isPrivate ? follow_enum_js_1.FollowStatusEnum.PENDING : follow_enum_js_1.FollowStatusEnum.ACCEPTED;
        await this.followRepository.createone({ data: { follower: user._id, following: targetId, status } });
        return { status: status === follow_enum_js_1.FollowStatusEnum.PENDING ? "requested" : "following" };
    }
    async unfollow(user, targetId) {
        const result = await this.followRepository.deleteOne({ filter: { follower: user._id, following: targetId } });
        if (!result.deletedCount)
            throw new Domain_exciption_js_1.NotFoundExciption("You are not following this user");
    }
    async search(user, { q, page, limit }) {
        const tokens = q.trim().split(/\s+/).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        const filter = {
            _id: { $ne: user._id },
            confirmEmail: { $exists: true },
            $and: tokens.map(t => ({
                $or: [
                    { firstName: { $regex: t, $options: "i" } },
                    { lastName: { $regex: t, $options: "i" } }
                ]
            }))
        };
        return await this.userRepository.paginate({
            filter,
            options: { select: LIST_FIELDS, sort: { firstName: 1 } },
            page, limit
        });
    }
    async suggestions(user, limit) {
        const mine = await this.followRepository.find({ filter: { follower: user._id }, options: { select: "following status" } });
        const acceptedIds = mine.filter(f => f.status === follow_enum_js_1.FollowStatusEnum.ACCEPTED).map(f => f.following);
        const excludeIds = [user._id, ...mine.map(f => f.following)];
        const mutual = acceptedIds.length
            ? await this.followRepository.aggregate({
                pipeline: [
                    { $match: { follower: { $in: acceptedIds }, following: { $nin: excludeIds }, status: follow_enum_js_1.FollowStatusEnum.ACCEPTED } },
                    { $group: { _id: "$following", mutualFollowers: { $sum: 1 } } },
                    { $sort: { mutualFollowers: -1 } },
                    { $limit: limit }
                ]
            })
            : [];
        const mutualUsers = mutual.length
            ? await this.userRepository.find({
                filter: { _id: { $in: mutual.map(m => m._id) }, confirmEmail: { $exists: true } },
                options: { select: LIST_FIELDS }
            })
            : [];
        const byId = new Map(mutualUsers.map(u => [String(u._id), u]));
        const result = mutual
            .filter(m => byId.has(String(m._id)))
            .map(m => ({ user: byId.get(String(m._id)), mutualFollowers: m.mutualFollowers }));
        if (result.length < limit) {
            const taken = [...excludeIds, ...result.map(r => r.user._id)];
            const fill = await this.userRepository.find({
                filter: { _id: { $nin: taken }, confirmEmail: { $exists: true } },
                options: { select: LIST_FIELDS, sort: { createdAt: -1 }, limit: limit - result.length }
            });
            fill.slice(0, limit - result.length).forEach(u => result.push({ user: u, mutualFollowers: 0 }));
        }
        return result;
    }
    async updatePrivacy(user, isPrivate) {
        user.isPrivate = isPrivate;
        await user.save();
        if (!isPrivate) {
            await this.followRepository.updateMany({
                filter: { following: user._id, status: follow_enum_js_1.FollowStatusEnum.PENDING },
                update: { status: follow_enum_js_1.FollowStatusEnum.ACCEPTED }
            });
        }
        return { isPrivate };
    }
}
exports.UserSocialService = UserSocialService;
exports.default = new UserSocialService();
