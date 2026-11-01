import type { HydratedDocument, QueryFilter } from "mongoose";
import { UserRepository } from "../../common/repository/user.repository.js";
import { FollowRepository } from "../../common/repository/follow.repository.js";
import { FollowStatusEnum } from "../../common/enum/follow.enum.js";
import type { IUser } from "../../common/interface/user.interface.js";
import { BadRequestExciption, ConfilectRrquestExciption, NotFoundExciption } from "../../common/exciption/Domain.exciption.js";

const PUBLIC_FIELDS = "firstName lastName image coverImage gender isPrivate createdAt"
const LIST_FIELDS = "firstName lastName image isPrivate"

type Viewer = HydratedDocument<IUser>

export class UserSocialService {
    private userRepository = new UserRepository()
    private followRepository = new FollowRepository()

    private async findActiveUser(id: string, projection: string) {
        return await this.userRepository.findOne({
            filter: { _id: id, confirmEmail: { $exists: true } } as any,
            projection
        })
    }

    private async relation(followerId: any, followingId: any) {
        return await this.followRepository.findOne({ filter: { follower: followerId, following: followingId } })
    }

    //  بروفايل يوزر تاني 
    async getUserProfile(viewer: Viewer, id: string) {
        const target = await this.findActiveUser(id, PUBLIC_FIELDS)
        if (!target) throw new NotFoundExciption("User not found")

        const [followersCount, followingCount, rel] = await Promise.all([
            this.followRepository.countDocuments({ filter: { following: target._id, status: FollowStatusEnum.ACCEPTED } }),
            this.followRepository.countDocuments({ filter: { follower: target._id, status: FollowStatusEnum.ACCEPTED } }),
            this.relation(viewer._id, target._id)
        ])

        const isOwner = viewer._id.equals(target._id)
        const locked = !isOwner && !!target.isPrivate && rel?.status !== FollowStatusEnum.ACCEPTED

        // الحساب الـ private بيظهر منه الاسم والصورة بس لحد ما يتقبل
        const user = locked
            ? { _id: target._id, firstName: target.firstName, lastName: target.lastName, image: target.image, isPrivate: true }
            : target

        return {
            user,
            followersCount,
            followingCount,
            locked,
            followStatus: isOwner ? "self" : !rel ? "none" : rel.status === FollowStatusEnum.ACCEPTED ? "following" : "requested"
        }
    }

    //  follow / unfollow 
    async follow(user: Viewer, targetId: string) {
        if (user._id.equals(targetId)) throw new BadRequestExciption("You cannot follow yourself")

        const target = await this.findActiveUser(targetId, "isPrivate")
        if (!target) throw new NotFoundExciption("User not found")

        const exist = await this.relation(user._id, targetId)
        if (exist) {
            throw new ConfilectRrquestExciption(exist.status === FollowStatusEnum.ACCEPTED ? "Already following" : "Follow request already sent")
        }

        const status = target.isPrivate ? FollowStatusEnum.PENDING : FollowStatusEnum.ACCEPTED
        await this.followRepository.createone({ data: { follower: user._id, following: targetId, status } as any })
        return { status: status === FollowStatusEnum.PENDING ? "requested" : "following" }
    }

    // بتلغي الـ follow، أو الطلب لو لسه pending
    async unfollow(user: Viewer, targetId: string) {
        const result = await this.followRepository.deleteOne({ filter: { follower: user._id, following: targetId as any } })
        if (!result.deletedCount) throw new NotFoundExciption("You are not following this user")
    }
 
    //  search 
    async search(user: Viewer, { q, page, limit }: { q: string, page: number, limit: number }) {
        const tokens = q.trim().split(/\s+/).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        const filter = {
            _id: { $ne: user._id },
            confirmEmail: { $exists: true },
            $and: tokens.map(t => ({
                $or: [
                    { firstName: { $regex: t, $options: "i" } },
                    { lastName: { $regex: t, $options: "i" } }
                ]
            }))
        } as QueryFilter<IUser>

        return await this.userRepository.paginate({
            filter,
            options: { select: LIST_FIELDS, sort: { firstName: 1 } },
            page, limit
        })
    }

    //  suggestions: ناس بيتابعهم اللي أنا بتابعهم، وبعدها أحدث اليوزرز 
    async suggestions(user: Viewer, limit: number) {
        const mine = await this.followRepository.find({ filter: { follower: user._id }, options: { select: "following status" } })
        const acceptedIds = mine.filter(f => f.status === FollowStatusEnum.ACCEPTED).map(f => f.following)
        const excludeIds = [user._id, ...mine.map(f => f.following)]

        const mutual = acceptedIds.length
            ? await this.followRepository.aggregate({
                pipeline: [
                    { $match: { follower: { $in: acceptedIds }, following: { $nin: excludeIds }, status: FollowStatusEnum.ACCEPTED } },
                    { $group: { _id: "$following", mutualFollowers: { $sum: 1 } } },
                    { $sort: { mutualFollowers: -1 } },
                    { $limit: limit }
                ]
            })
            : []

        const mutualUsers = mutual.length
            ? await this.userRepository.find({
                filter: { _id: { $in: mutual.map(m => m._id) }, confirmEmail: { $exists: true } },
                options: { select: LIST_FIELDS }
            })
            : []
        const byId = new Map(mutualUsers.map(u => [String(u._id), u]))
        const result: { user: any, mutualFollowers: number }[] = mutual
            .filter(m => byId.has(String(m._id)))
            .map(m => ({ user: byId.get(String(m._id)), mutualFollowers: m.mutualFollowers }))

        if (result.length < limit) {
            const taken = [...excludeIds, ...result.map(r => r.user._id)]
            const fill = await this.userRepository.find({
                filter: { _id: { $nin: taken }, confirmEmail: { $exists: true } },
                options: { select: LIST_FIELDS, sort: { createdAt: -1 }, limit: limit - result.length }
            })
            fill.slice(0, limit - result.length).forEach(u => result.push({ user: u, mutualFollowers: 0 }))
        }
        return result
    }

    //  privacy 
    async updatePrivacy(user: Viewer, isPrivate: boolean) {
        user.isPrivate = isPrivate
        await user.save()
        // لو الحساب بقى public أي طلبات pending تتقبل
        if (!isPrivate) {
            await this.followRepository.updateMany({
                filter: { following: user._id, status: FollowStatusEnum.PENDING },
                update: { status: FollowStatusEnum.ACCEPTED }
            })
        }
        return { isPrivate }
    }
}

export default new UserSocialService()