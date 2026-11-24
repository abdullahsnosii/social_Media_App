import { Router, type NextFunction, type Request, type Response } from 'express';
import userService from './user.service.js';
import { authentication, authorization } from '../../middleware/authentication.middleware.js';
import { tokenTypeEnum } from '../../common/enum/security.enum.js';
import { RoleEnum } from '../../common/enum/user.enum.js';
import { responseFormatter } from '../../middleware/index.js';
import { uploadMiddleware } from '../../middleware/multer.middleware.js';
import { fileValidation, localFielupload } from '../../common/utils/multer/local.multer.js';
import type { IResponse } from '../../common/interface/response.interface.js';
import type { IUser } from '../../common/interface/user.interface.js';
import { validation } from '../../middleware/validation.middleware.js';
import * as validators from './user.validation.js';
import { getIssuer } from '../../common/utils/issuer.js';
import type { IFile } from '../../common/types/multer.types.js';
import type { IFriendRequest } from '../../common/interface/friendRequest.interface.js';
import type { AcceptFriendRequestDto, BlockFriendRequestDto, UnFriendRequestDto } from './dto/user.dto.js';
const router = Router();

router.get("/", authentication(), responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
  const data = await userService.profile(req.user!)
  return { data }
}))


router.patch ("/profile-image" ,
  authentication() , 
  uploadMiddleware({
  multerMiddleware: localFielupload({}).single("attachment") ,
  customPath :"User" , 
  validation : fileValidation.image 

    }) ,
     responseFormatter(
         async (req: Request, res: Response, next: NextFunction):Promise<IResponse<IUser>>=>{
         const account = await userService.profileImage(req.file as IFile, req.user)
        return {data  : account}
}))


router.patch ("/profile-cover-image" ,
  authentication() , 
  uploadMiddleware({
  multerMiddleware: localFielupload({}).array("attachments" , 3) ,
  customPath :"User" , 
  validation : fileValidation.image 

    }) ,
     responseFormatter(
         async (req: Request, res: Response, next: NextFunction):Promise<IResponse<IUser>>=>{
         const account = await userService.profileCoverImages(req.files as IFile[] , req.user)
        return {data  : account}
}))

router.patch("/", authentication(), authorization(RoleEnum.USER), responseFormatter(
  async (req: Request, res: Response, next: NextFunction) => {
    await userService.updateProfile(req.body, req.user)

  }
))


router.post("/rotate-token", authentication(tokenTypeEnum.REFRESH), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.rotateToken(req.payload, req.user, getIssuer(req))
    return { status: 200, data }

  }
))


router.post("/follow/:userId", authentication(tokenTypeEnum.ACCESS), validation(validators.followUser), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.followUser(req.validate.params, req.user)
    return { status: 200, data }

  }
))


router.delete("/unfollow/:userId", authentication(tokenTypeEnum.ACCESS), validation(validators.followUser), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.UnFollowUser(req.validate.params, req.user)
    return { status: 200, data }

  }
))

router.get("/search", authentication(tokenTypeEnum.ACCESS), validation(validators.search), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.searchUsers(req.validate.query, req.user)
    return { status: 200, data }

  }
))


router.get("/suggestions", authentication(tokenTypeEnum.ACCESS), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.getUserSuggestions(req.user)
    return { status: 200, data }

  }
))


router.patch("/privacy", authentication(tokenTypeEnum.ACCESS),validation(validators.updatePrivacySchema), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.updatePrivacySettings(req.body, req.user)
    return { status: 200, data }

  }
))


router.get("/suggestions", authentication(tokenTypeEnum.ACCESS), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.getUserSuggestions(req.user)
    return { status: 200, data }

  }
))


router.post("/logout", authentication(), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.logout(req.payload, req.user, req.body)
    return { status: 200, data }
  }
))


router.delete("/deleteAccount", authentication(tokenTypeEnum.ACCESS), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await userService.deleteAccount(req.user)
    return { status: 200, data }

  }
))



router.post("/send-friend-request", authentication(),validation(validators.sendFriendRequest), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IFriendRequest>> => {
    const request = await userService.sendFriendRequest(req.body, req.user)
    return { status: 200, data: request as unknown as IFriendRequest }

  }
))

router.patch("/accept-friend-request/:friendRequestId", authentication(),validation(validators.acceptFriendRequest), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IFriendRequest>> => {
    const request = await userService.acceptFriendRequest(req.params as AcceptFriendRequestDto, req.user)
    return { status: 200, data: request as unknown as IFriendRequest }

  }
))

router.patch("/cancel-friend-request/:friendRequestId", authentication(),validation(validators.acceptFriendRequest), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IFriendRequest>> => {
    const request = await userService.cancelFriendRequest(req.params as AcceptFriendRequestDto, req.user)
    return { status: 200, data: request as unknown as IFriendRequest }

  }
))

router.patch("/un-friend/:friendId", authentication(),validation(validators.unFriend), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IFriendRequest>> => {
    const request = await userService.unFriend(req.params as UnFriendRequestDto, req.user)
    return { status: 200, data: request as unknown as IFriendRequest }

  }
))


router.patch("/block-friend/:friendId", authentication(),validation(validators.blockFriend), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IFriendRequest>> => {
    const request = await userService.blockFriend(req.params as BlockFriendRequestDto, req.user)
    return { status: 200, data: request as unknown as IFriendRequest }

  }
))
export default router;
// router.patch
//   ("/profile-image",
//     authentication(),
//     uploadMiddleware({ multerMiddleware: localFielupload({ maxFileSize: 2 }).single("attachment"), customPath: "users", validation: fileValidation.image }),

//    responseFormatter(
//     async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
//       req.user!.image = req.file!.path
//       await req.user!.save()
//       return { data: { user: req.user } }
//     }))


// router.patch("/", authentication(), authorization(RoleEnum.USER),responseFormatter(
//     async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
//   const data = await userService.update(req.user!, req.body)
//   return { data }
// }))


// router.post("/rotate-token", authentication(tokenTypeEnum.REFRESH),responseFormatter(
//     async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
//   const data = await userService.rotateToken(req.payload!, req.user!, getIssuer(req))
//   console.log(req.payload);

//   return {  data }
// }))




// router.post("/logout", authentication(), responseFormatter(
//     async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
//   const data = await userService.logout(req.payload!, req.user!, req.body)
//   console.log(req.payload);

//   return{ data }
// }))

// // الاجزاء جديده مطلوبه 
// router.get("/search", authentication(), validation(validators.search), responseFormatter(
//   async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
//     const data = await socialService.search(req.user!, req.validate.query)
//     return { data }
//   }))

// router.get("/suggestions", authentication(), validation(validators.suggestions), responseFormatter(
//   async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
//     const data = await socialService.suggestions(req.user!, req.validate.query.limit)
//     return { data }
//   }))

// router.patch("/settings/privacy", authentication(), validation(validators.updatePrivacy), responseFormatter(
//   async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
//     const data = await socialService.updatePrivacy(req.user!, req.validate.body.isPrivate)
//     return { data }
//   }))

// router.post("/:id/follow", authentication(), validation(validators.userIdParam), responseFormatter(
//   async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
//     const data = await socialService.follow(req.user!, req.validate.params.id)
//     return { status: 201, data }
//   }))

// router.delete("/:id/follow", authentication(), validation(validators.userIdParam), responseFormatter(
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     await socialService.unfollow(req.user!, req.validate.params.id)
//     return ;
//   }))
// router.get("/:id", authentication(), validation(validators.userIdParam), responseFormatter(
//   async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
//     const data = await socialService.getUserProfile(req.user!, req.validate.params.id)
//     return { data }
//   }))
