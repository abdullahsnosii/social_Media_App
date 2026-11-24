"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const security_enum_js_1 = require("../../common/enum/security.enum.js");
const follow_repository_js_1 = require("../../common/repository/follow.repository.js");
const friendRequest_repository_js_1 = require("../../common/repository/friendRequest.repository.js");
const user_repository_js_1 = require("../../common/repository/user.repository.js");
const token_security_js_1 = require("../../common/security/token.security.js");
const cache_service_js_1 = require("../../common/service/cache.service.js");
const cloud_service_js_1 = require("../../common/service/cloud.service.js");
const Domain_exciption_js_1 = require("../../common/exciption/Domain.exciption.js");
const objectId_js_1 = require("../../common/utils/objectId.js");
const friendRequest_enum_js_1 = require("../../common/enum/friendRequest.enum.js");
const encryption_security_js_1 = require("../../common/security/encryption.security.js");
const config_js_1 = require("../../config.js");
class UserService {
    cloudService;
    userRepository;
    cacheService;
    tokenSecurity;
    followRepository;
    friendRequestRepository;
    constructor() {
        this.cloudService = cloud_service_js_1.cloudService;
        this.cacheService = cache_service_js_1.cacheService;
        this.tokenSecurity = token_security_js_1.tokenSecurity;
        this.userRepository = new user_repository_js_1.UserRepository();
        this.friendRequestRepository = friendRequest_repository_js_1.friendRequestRepository;
        this.followRepository = follow_repository_js_1.followRepository;
    }
    async profileImage(file, user) {
        const oldImage = user.image;
        const { Key } = await this.cloudService.uploadLargeAsset({ file, path: `User/${user._id.toString()}/profile` });
        user.image = Key;
        await user.save();
        if (oldImage?.length) {
            await this.cloudService.deleteAsset({ Key: oldImage });
        }
        return user.toJSON();
    }
    async profileCoverImages(files, user) {
        const oldCover = user.coverImage || [];
        user.coverImage = await this.cloudService.uploadAssets({ files, path: `User/${user._id.toString()}/profile/cover` });
        await user.save();
        if (oldCover?.length) {
            await this.cloudService.deleteAssets({ Keys: oldCover });
        }
        return user.toJSON();
    }
    async profile(user) {
        const { password, ...safeUser } = user.toObject();
        if (user.phone)
            safeUser.phone = await (0, encryption_security_js_1.decryption)(user.phone);
        return { user: safeUser };
    }
    async updateProfile(data, user) {
        if (data.phone) {
            data.phone = await (0, encryption_security_js_1.encryption)(data.phone);
        }
        const updatedUser = await this.userRepository.updateOne({
            filter: { _id: user._id },
            update: { $set: data }
        });
        return updatedUser;
    }
    async rotateToken(payload, user, issuer) {
        const accessExpiresIn = (payload.iat + config_js_1.ACCESS_TOKEN_EXPIRES_IN) * 1000;
        const currentTime = Date.now() + (5 * 6000);
        if (currentTime < accessExpiresIn) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("sorry we cannot create new login credintials while current access token still within valid time range");
        }
        const data = await this.tokenSecurity.createLoginCredentials({ user, issuer });
        await this.tokenSecurity.createRevokeToken({ payload });
        return data;
    }
    async logout(payload, user, { action = security_enum_js_1.LogoutEnum.DEVICE } = {}) {
        console.log({ user });
        switch (action) {
            case security_enum_js_1.LogoutEnum.ALL:
                user.changeCredentialsTime = new Date();
                await user.save();
                console.log({ kk: await this.cacheService.keys({ prefix: await this.tokenSecurity.userBaseRevokeTokenKey({ userId: payload.sub }) }) });
                await this.cacheService.del({ key: await this.cacheService.keys({ prefix: await this.tokenSecurity.userBaseRevokeTokenKey({ userId: payload.sub }) }) });
                break;
            default:
                await this.tokenSecurity.createRevokeToken({ payload });
                break;
        }
        return;
    }
    async followUser({ userId }, user) {
        const targetUser = await this.userRepository.findbyId({
            id: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!targetUser) {
            throw new Domain_exciption_js_1.NotFoundExciption("User not found");
        }
        if (user._id.toString() === userId) {
            throw new Domain_exciption_js_1.BadRequestExciption("You cannot follow yourself");
        }
        const existFollow = await this.followRepository.findOne({
            filter: {
                follower: user._id,
                following: targetUser._id
            }
        });
        if (existFollow) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("You are already following this user");
        }
        const follow = await this.followRepository.create({
            data: {
                follower: user._id,
                following: targetUser._id
            }
        });
        return follow;
    }
    async UnFollowUser({ userId }, user) {
        const targetUser = await this.userRepository.findbyId({
            id: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!targetUser) {
            throw new Domain_exciption_js_1.NotFoundExciption("User not found");
        }
        if (user._id.toString() === userId) {
            throw new Domain_exciption_js_1.BadRequestExciption("You cannot Unfollow yourself");
        }
        const existFollow = await this.followRepository.findOne({
            filter: {
                follower: user._id,
                following: targetUser._id
            }
        });
        if (!existFollow) {
            throw new Domain_exciption_js_1.NotFoundExciption("Follow not found");
        }
        await this.followRepository.deleteOne({
            filter: {
                follower: user._id,
                following: targetUser._id
            }
        });
    }
    async searchUsers({ keyword }, user) {
        if (!keyword?.trim()) {
            throw new Domain_exciption_js_1.BadRequestExciption("Search keyword is required");
        }
        const users = await this.userRepository.find({
            filter: {
                _id: { $ne: user._id },
                $or: [
                    { firstName: { $regex: keyword.trim(), $options: "i" } },
                    { lastName: { $regex: keyword.trim(), $options: "i" } },
                    { username: { $regex: keyword.trim(), $options: "i" } }
                ]
            }
        });
        return users;
    }
    async getUserSuggestions(user) {
        const followingUsers = await this.followRepository.find({
            filter: {
                follower: user._id
            }
        });
        const followingIds = followingUsers.map(follow => follow.following);
        if (!followingIds.length) {
            return [];
        }
        const suggestions = await this.followRepository.find({
            filter: {
                follower: { $in: followingIds },
                following: {
                    $nin: [user._id, ...followingIds]
                }
            }
        });
        const users = await this.userRepository.find({
            filter: {
                _id: {
                    $in: suggestions.map(follow => follow.following)
                }
            }
        });
        return users;
    }
    async updatePrivacySettings({ isPrivate }, user) {
        await this.userRepository.updateOne({
            filter: { _id: user._id },
            update: {
                $set: { isPrivate }
            }
        });
        return { message: "Privacy settings updated successfully" };
    }
    async deleteAccount(user) {
        await this.followRepository.deleteMany({
            filter: {
                $or: [
                    { follower: user._id },
                    { following: user._id }
                ]
            }
        });
        await this.userRepository.deleteOne({
            filter: { _id: user._id }
        });
        await this.cloudService.deleteFolderByPrefix({ Prefix: `User/${user._id.toString()}` });
        return { message: "Account deleted successfully" };
    }
    async sendFriendRequest({ receiverId, note }, user) {
        const receiver = await this.userRepository.findbyId({ id: (0, objectId_js_1.ToObjectId)(receiverId) });
        if (!receiver)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid receiver account");
        if (user._id.toString() === receiver._id.toString()) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("You cannot send a friend request to yourself");
        }
        const checkResquestDuplicate = await this.friendRequestRepository.findOne({
            filter: {
                senderId: { $in: [user._id, receiverId] },
                receiverId: { $in: [user._id, receiverId] }
            }
        });
        if (checkResquestDuplicate)
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("Request already exist");
        const request = await this.friendRequestRepository.create({
            data: {
                senderId: user._id,
                receiverId: receiver._id,
                note
            }
        });
        return request.toJSON();
    }
    async acceptFriendRequest({ friendRequestId }, user) {
        const request = await this.friendRequestRepository.findOneAndUpdate({
            filter: {
                _id: friendRequestId,
                status: friendRequest_enum_js_1.FriendRequestEnum.PENDING,
                receiverId: user._id
            },
            update: {
                status: friendRequest_enum_js_1.FriendRequestEnum.ACCEPTED
            }
        });
        if (!request)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid request");
        await Promise.all([
            this.userRepository.updateOne({
                filter: { _id: request.senderId },
                update: {
                    $addToSet: { friends: request.receiverId }
                }
            }),
            this.userRepository.updateOne({
                filter: { _id: request.receiverId },
                update: {
                    $addToSet: { friends: request.senderId }
                }
            })
        ]);
        return request.toJSON();
    }
    async cancelFriendRequest({ friendRequestId }, user) {
        const request = await this.friendRequestRepository.findOneAndDelete({
            filter: {
                _id: friendRequestId,
                status: friendRequest_enum_js_1.FriendRequestEnum.PENDING,
                $or: [{ senderId: user._id }, { receiverId: user._id }]
            }
        });
        if (!request)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid request");
        return request.toJSON();
    }
    async unFriend({ friendId }, user) {
        const friend = await this.userRepository.findbyId({
            id: (0, objectId_js_1.ToObjectId)(friendId)
        });
        if (!friend)
            throw new Domain_exciption_js_1.NotFoundExciption("Friend account not found");
        if (user._id.equals(friend._id))
            throw new Domain_exciption_js_1.BadRequestExciption("You cannot unfriend yourself");
        const isFriend = await this.userRepository.findOne({
            filter: {
                _id: user._id,
                friends: friend._id
            }
        });
        if (!isFriend)
            throw new Domain_exciption_js_1.BadRequestExciption("This user is not your friend");
        await Promise.all([
            this.userRepository.updateOne({
                filter: { _id: user._id },
                update: {
                    $pull: { friends: friend._id }
                }
            }),
            this.userRepository.updateOne({
                filter: { _id: friend._id },
                update: {
                    $pull: { friends: user._id }
                }
            })
        ]);
    }
    async blockFriend({ friendId }, user) {
        const friend = await this.userRepository.findbyId({
            id: (0, objectId_js_1.ToObjectId)(friendId)
        });
        if (!friend)
            throw new Domain_exciption_js_1.NotFoundExciption("User not found");
        if (user._id.equals(friend._id))
            throw new Domain_exciption_js_1.BadRequestExciption("You cannot block yourself");
        await Promise.all([
            this.userRepository.updateOne({
                filter: { _id: user._id },
                update: {
                    $addToSet: {
                        blockedUsers: friend._id
                    },
                    $pull: {
                        friends: friend._id
                    }
                }
            }),
            this.userRepository.updateOne({
                filter: { _id: friend._id },
                update: {
                    $pull: {
                        friends: user._id
                    }
                }
            })
        ]);
    }
}
exports.UserService = UserService;
exports.default = new UserService();
