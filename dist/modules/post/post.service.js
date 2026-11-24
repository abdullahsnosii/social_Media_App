"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Domain_exciption_js_1 = require("../../common/exciption/Domain.exciption.js");
const friendRequest_repository_js_1 = require("../../common/repository/friendRequest.repository.js");
const post_repository_js_1 = require("../../common/repository/post.repository.js");
const user_repository_js_1 = require("../../common/repository/user.repository.js");
const cloud_service_js_1 = require("../../common/service/cloud.service.js");
const otp_js_1 = require("../../common/utils/multer/otp.js");
const objectId_js_1 = require("../../common/utils/objectId.js");
class PostService {
    cloudService;
    postRepository;
    userRepository;
    friendRequestRepository;
    constructor() {
        this.postRepository = post_repository_js_1.postRepository;
        this.userRepository = new user_repository_js_1.UserRepository();
        this.cloudService = cloud_service_js_1.cloudService;
        this.friendRequestRepository = friendRequest_repository_js_1.friendRequestRepository;
    }
    async create({ allowShare, privacy, content, mentions }, user, files = []) {
        const folderId = (0, otp_js_1.createOtp)();
        let attachments = [];
        if (mentions?.length && (await this.userRepository.find({ filter: { _id: { $in: mentions } } })).length != mentions?.length) {
            throw new Domain_exciption_js_1.NotFoundExciption("Some of mentioned account not exist");
        }
        if (files?.length) {
            attachments = await this.cloudService.uploadAssets({ files, path: `Post/${folderId}` });
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
        });
        return post;
    }
    async update({ postId }, { removeAttachments = [], removeMentions = [], allowShare, privacy, content, mentions = [] }, user, files = []) {
        if (mentions?.length && (await this.userRepository.find({ filter: { _id: { $in: mentions } } })).length != mentions?.length) {
            throw new Domain_exciption_js_1.NotFoundExciption("Some of mentioned account not exist");
        }
        const post = await this.postRepository.findOne({
            filter: { _id: postId, createdBy: user._id }
        });
        if (!post) {
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid postId");
        }
        removeAttachments = removeAttachments.filter(ele => post.attachments.includes(ele));
        const postAttachmentsLength = post.attachments.length + files.length - removeAttachments.length;
        if (postAttachmentsLength > 3) {
            throw new Domain_exciption_js_1.BadRequestExciption("post connot hold more than 3 files");
        }
        const postContent = content ?? post.content;
        if (!postContent && postAttachmentsLength < 1) {
            throw new Domain_exciption_js_1.BadRequestExciption("post cannot be empty");
        }
        let newAttachments = [];
        if (files.length) {
            newAttachments = await this.cloudService.uploadAssets({ files, path: `Post/${post.folderId}` });
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
                                        removeMentions.map(ele => (0, objectId_js_1.ToObjectId)(ele))
                                    ]
                                },
                                mentions.map(ele => (0, objectId_js_1.ToObjectId)(ele))
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
        });
        if (!uPost) {
            if (newAttachments?.length) {
                await this.cloudService.deleteAssets({ Keys: newAttachments });
            }
            if (removeAttachments?.length) {
                await this.cloudService.deleteAssets({ Keys: newAttachments });
            }
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid post");
        }
        return uPost;
    }
}
exports.default = new PostService();
