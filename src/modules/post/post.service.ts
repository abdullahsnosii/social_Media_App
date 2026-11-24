
import { BadRequestExciption, NotFoundExciption } from "../../common/exciption/Domain.exciption.js"
import { IPost, IUser } from "../../common/interface"

import { friendRequestRepository, type FriendRequestRepository } from "../../common/repository/friendRequest.repository.js"
import { postRepository, PostRepository } from "../../common/repository/post.repository.js"
import { UserRepository } from "../../common/repository/user.repository.js"
import { cloudService, type CloudService } from "../../common/service/cloud.service.js"



import { IFile } from "../../common/types"
import { createOtp } from "../../common/utils/multer/otp.js"
import { ToObjectId } from "../../common/utils/objectId.js"

import { CreatePostDto, updatePostDto } from "./dto/post.dto"


class PostService {
  private readonly cloudService: CloudService
  private readonly postRepository: PostRepository
  private readonly userRepository: UserRepository
  private readonly friendRequestRepository: FriendRequestRepository


  constructor() {
    this.postRepository = postRepository
    this.userRepository = new UserRepository()
    this.cloudService = cloudService
    this.friendRequestRepository = friendRequestRepository


  }


  async create({ allowShare, privacy, content, mentions }: CreatePostDto['body'], user: IUser, files: IFile[] = []) {

    const folderId = createOtp()
    let attachments: string[] = []
    if (mentions?.length && (await this.userRepository.find({ filter: { _id: { $in: mentions } } })).length != mentions?.length) {
      throw new NotFoundExciption("Some of mentioned account not exist")
    }

    if (files?.length) {
      attachments = await this.cloudService.uploadAssets({ files, path: `Post/${folderId}` })
    }
    const post = await this.postRepository.createone({
      data: {
        folderId,
        content,
        attachments,
        allowShare,
        createdBy: user._id,
        mentions,
        privacy
      }
    })
    return post


  }


  async update({ postId }: updatePostDto['params'], {
    removeAttachments = [],
    removeMentions = [],
    allowShare,
    privacy,
    content,
    mentions = []
  }: updatePostDto['body'], user: IUser, files: IFile[] = []): Promise<IPost> {

    if (mentions?.length && (await this.userRepository.find({ filter: { _id: { $in: mentions } } })).length != mentions?.length) {
      throw new NotFoundExciption("Some of mentioned account not exist")
    }

    const post = await this.postRepository.findOne({
      filter: { _id: postId, createdBy: user._id }
    })

    if (!post) {
      throw new NotFoundExciption("Invalid postId")
    }

    removeAttachments = removeAttachments.filter(ele => post.attachments.includes(ele))
    const postAttachmentsLength = post.attachments.length + files.length - removeAttachments.length
    if (postAttachmentsLength > 3) {
      throw new BadRequestExciption("post connot hold more than 3 files")
    }

    const postContent = content ?? post.content
    if (!postContent && postAttachmentsLength < 1) {
      throw new BadRequestExciption("post cannot be empty")
    }


    let newAttachments: string[] = [];
    if (files.length) {
      newAttachments = await this.cloudService.uploadAssets({ files, path: `Post/${post.folderId}` })
    }

    const uPost = await this.postRepository.findOneAndUpdate({
      filter: {
        _id: postId, createdBy: user._id
      },
      update: [
        {

          $set: {
            content: postContent,
            allowShare: allowShare ?? post.allowShare,
            privacy: privacy ?? post.privacy,
            mentions: {
              $setUnion: [
                {
                  $setDifference: [
                    "$mentions",
                    removeMentions.map(ele => ToObjectId(ele))
                  ]
                },
                mentions.map(ele => ToObjectId(ele))
              ]
            },

            attachments: {
              $setUnion: [
                {
                  $setDifference: [
                    "$attachments",
                    removeAttachments
                  ]
                },
                newAttachments
              ]
            }



          }

        }
      ]
    })

    if (!uPost) {

      if (newAttachments?.length) {
        await this.cloudService.deleteAssets({ Keys: newAttachments })
      }

      if (removeAttachments?.length) {
        await this.cloudService.deleteAssets({ Keys: newAttachments })
      }

      throw new NotFoundExciption("Invalid post")
    }
    return uPost


  }



}

export default new PostService()