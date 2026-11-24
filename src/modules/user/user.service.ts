import mongoose from "mongoose"
import { LogoutEnum } from "../../common/enum/security.enum.js"
import type { IFollow } from "../../common/interface/follow.interface.js"
import type { IUser } from "../../common/interface/user.interface.js"
import { followRepository, FollowRepository } from "../../common/repository/follow.repository.js"
import { friendRequestRepository, type FriendRequestRepository } from "../../common/repository/friendRequest.repository.js"
import { UserRepository } from "../../common/repository/user.repository.js"
import { tokenSecurity, type JwtPayloadType, type TokenSecurity } from "../../common/security/token.security.js"
import { cacheService, type CacheService } from "../../common/service/cache.service.js"
import { cloudService, type CloudService } from "../../common/service/cloud.service.js"
import type { IFile } from "../../common/types/multer.types.js"
import type { HUser } from "../../DB/model/user.model.js"
import type { ILoginResponse } from "../authentication/entities/authentication.entites.js"
import { BadRequestExciption, ConfilectRrquestExciption, NotFoundExciption } from "../../common/exciption/Domain.exciption.js"
import type { IFriendRequest } from "../../common/interface/friendRequest.interface.js"
import type { AcceptFriendRequestDto, BlockFriendRequestDto, SendFriendRequestDto, UnFriendRequestDto } from "./dto/user.dto.js"
import { ToObjectId } from "../../common/utils/objectId.js"
import { FriendRequestEnum } from "../../common/enum/friendRequest.enum.js"
import { decryption, encryption } from "../../common/security/encryption.security.js"
import type { GenderEnum } from "../../common/enum/user.enum.js"
import { ACCESS_TOKEN_EXPIRES_IN } from "../../config.js"

export class UserService {
  private readonly cloudService: CloudService
  private userRepository: UserRepository
  private cacheService: CacheService
  private tokenSecurity: TokenSecurity
  private readonly followRepository: FollowRepository
  private readonly friendRequestRepository: FriendRequestRepository
  constructor() {
    this.cloudService = cloudService
    this.cacheService = cacheService
    this.tokenSecurity = tokenSecurity
    this.userRepository = new UserRepository()
     this.friendRequestRepository = friendRequestRepository
      this.followRepository = followRepository

  }


  async profileImage(file: IFile, user: HUser): Promise<IUser> {
    const oldImage = user.image
    const { Key } = await this.cloudService.uploadLargeAsset({ file, path: `User/${user._id.toString()}/profile` })
    user.image = Key as string
    await user.save()

    if (oldImage?.length) {
      await this.cloudService.deleteAsset({ Key: oldImage })
    }
    return user.toJSON()
  }


  async profileCoverImages(files: IFile[], user: HUser): Promise<IUser> {
    const oldCover = user.coverImage || []
    user.coverImage = await this.cloudService.uploadAssets({ files, path: `User/${user._id.toString()}/profile/cover` })
    await user.save()

    if (oldCover?.length) {
      await this.cloudService.deleteAssets({ Keys: oldCover })
    }
    return user.toJSON()
  }


  async profile(user: HUser) {
    const { password, ...safeUser } = user.toObject()
    if (user.phone) safeUser.phone = await decryption(user.phone as string)
    return { user: safeUser }
  }

async updateProfile(
  data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
    DOB?: Date;
    gender?: GenderEnum;
    image?: string;
    coverImage?: string[];
  },
  user: IUser
) {

  if (data.phone) {
    data.phone = await encryption(data.phone);
  }

  const updatedUser = await this.userRepository.updateOne({
    filter: { _id: user._id },
    update: { $set: data }
  });

  return updatedUser;
}


  async rotateToken(payload: JwtPayloadType, user: HUser, issuer: string): Promise<ILoginResponse> {
    const accessExpiresIn = (payload.iat! + ACCESS_TOKEN_EXPIRES_IN) * 1000
    const currentTime = Date.now() + (5 * 6000)

    if (currentTime < accessExpiresIn) {
      throw new ConfilectRrquestExciption("sorry we cannot create new login credintials while current access token still within valid time range")
    }

    const data = await this.tokenSecurity.createLoginCredentials({ user, issuer })
    await this.tokenSecurity.createRevokeToken({ payload })
    return data
  }



  async logout(payload: JwtPayloadType, user: HUser, { action = LogoutEnum.DEVICE }: { action?: LogoutEnum } = {}): Promise<void> {
    console.log({ user });

    switch (action) {
      case LogoutEnum.ALL:
        user.changeCredentialsTime = new Date()
        await user.save()
        console.log({ kk: await this.cacheService.keys({ prefix: await this.tokenSecurity.userBaseRevokeTokenKey({ userId: payload.sub as string }) }) });

        await this.cacheService.del({ key: await this.cacheService.keys({ prefix: await this.tokenSecurity.userBaseRevokeTokenKey({ userId: payload.sub as string }) }) })
        break;

      default:
        await this.tokenSecurity.createRevokeToken({ payload })
        break;
    }
    return
  }

  async followUser({ userId }: { userId: string }, user: HUser): Promise<IFollow> {

    const targetUser = await this.userRepository.findbyId({
      id: new mongoose.Types.ObjectId(userId)
    });

    if (!targetUser) {
      throw new NotFoundExciption("User not found");
    }

    if (user._id.toString() === userId) {
      throw new BadRequestExciption("You cannot follow yourself");
    }

    const existFollow = await this.followRepository.findOne({
      filter: {
        follower: user._id,
        following: targetUser._id
      }
    });

    if (existFollow) {
      throw new ConfilectRrquestExciption("You are already following this user");
    }

    const follow = await this.followRepository.create({
      data: {
        follower: user._id,
        following: targetUser._id
      }
    });

    return follow;
  }



  async UnFollowUser({ userId }: { userId: string }, user: HUser): Promise<void> {

    const targetUser = await this.userRepository.findbyId({
      id: new mongoose.Types.ObjectId(userId)
    });

    if (!targetUser) {
      throw new NotFoundExciption("User not found");
    }

    if (user._id.toString() === userId) {
      throw new BadRequestExciption("You cannot Unfollow yourself");
    }

    const existFollow = await this.followRepository.findOne({
      filter: {
        follower: user._id,
        following: targetUser._id
      }
    });

    if (!existFollow) {
      throw new NotFoundExciption("Follow not found");
    }

    await this.followRepository.deleteOne({
      filter: {
        follower: user._id,
        following: targetUser._id
      }
    });

  }

  async searchUsers({ keyword }: { keyword: string }, user: IUser): Promise<IUser[]> {

    if (!keyword?.trim()) {
      throw new BadRequestExciption("Search keyword is required");
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




  async getUserSuggestions(user: IUser) {

    const followingUsers = await this.followRepository.find({
      filter: {
        follower: user._id
      }
    });

    const followingIds = followingUsers.map(
      follow => follow.following
    );

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




  async updatePrivacySettings(
    { isPrivate }: { isPrivate: boolean },
    user: IUser
  ) {
    await this.userRepository.updateOne({
      filter: { _id: user._id },
      update: {
        $set: { isPrivate }
      }
    });

    return { message: "Privacy settings updated successfully" };
  }









  async deleteAccount(user: IUser) {

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

    await this.cloudService.deleteFolderByPrefix({ Prefix: `User/${user._id.toString()}` })
    return { message: "Account deleted successfully" };
  }



  async sendFriendRequest({ receiverId, note }: SendFriendRequestDto, user: HUser): Promise<IFriendRequest> {

    const receiver = await this.userRepository.findbyId({ id: ToObjectId(receiverId) })
    if (!receiver) throw new NotFoundExciption("Invalid receiver account")

    if (user._id.toString() === receiver._id.toString()) {
      throw new ConfilectRrquestExciption("You cannot send a friend request to yourself");
    }
    const checkResquestDuplicate = await this.friendRequestRepository.findOne({
      filter: {
        senderId: { $in: [user._id, receiverId] },
        receiverId: { $in: [user._id, receiverId] }
      }
    })
    if (checkResquestDuplicate) throw new ConfilectRrquestExciption("Request already exist")

    const request = await this.friendRequestRepository.create({
      data: {
        senderId: user._id,
        receiverId: receiver._id,
        note
      }
    })


    return request.toJSON()
  }

  async acceptFriendRequest({ friendRequestId }: AcceptFriendRequestDto, user: HUser): Promise<IFriendRequest> {
    const request = await this.friendRequestRepository.findOneAndUpdate({
      filter: {
        _id: friendRequestId,
        status: FriendRequestEnum.PENDING,
        receiverId: user._id
      },
      update: {
        status: FriendRequestEnum.ACCEPTED
      }
    })
    if (!request) throw new NotFoundExciption("Invalid request")

    await Promise.all([
      this.userRepository.updateOne({
        filter: { _id: request.senderId as mongoose.Types.ObjectId },
        update: {
          $addToSet: { friends: request.receiverId }
        }
      }),

      this.userRepository.updateOne({
        filter: { _id: request.receiverId as mongoose.Types.ObjectId },
        update: {
          $addToSet: { friends: request.senderId }
        }
      })
    ])

    return request.toJSON()

  }

  async cancelFriendRequest({ friendRequestId }: AcceptFriendRequestDto, user: HUser): Promise<IFriendRequest> {
    const request = await this.friendRequestRepository.findOneAndDelete({
      filter: {
        _id: friendRequestId,
        status: FriendRequestEnum.PENDING,
        $or: [{ senderId: user._id }, { receiverId: user._id }]
      }
    })
    if (!request) throw new NotFoundExciption("Invalid request")

    return request.toJSON()

  }


  async unFriend({ friendId }: UnFriendRequestDto, user: HUser): Promise<void> {

    const friend = await this.userRepository.findbyId({
      id: ToObjectId(friendId)
    });

    if (!friend)
      throw new NotFoundExciption("Friend account not found");

    if (user._id.equals(friend._id))
      throw new BadRequestExciption("You cannot unfriend yourself");

    const isFriend = await this.userRepository.findOne({
      filter: {
        _id: user._id,
        friends: friend._id
      }
    });

    if (!isFriend)
      throw new BadRequestExciption("This user is not your friend");

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




  async blockFriend({ friendId }: BlockFriendRequestDto, user: HUser): Promise<void> {

    const friend = await this.userRepository.findbyId({
      id: ToObjectId(friendId)
    });

    if (!friend)
      throw new NotFoundExciption("User not found");

    if (user._id.equals(friend._id))
      throw new BadRequestExciption("You cannot block yourself");

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

export default new UserService()