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
import socialService from './user.social.service.js';
const router = Router();

router.get("/", authentication(), responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
  const data = await userService.profile(req.user!)
  return { data }
}))


router.patch
  ("/profile-image",
    authentication(),
    uploadMiddleware({ multerMiddleware: localFielupload({ maxFileSize: 2 }).single("attachment"), customPath: "users", validation: fileValidation.image }),

   responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
      req.user!.image = req.file!.path
      await req.user!.save()
      return { data: { user: req.user } }
    }))


router.patch("/", authentication(), authorization(RoleEnum.USER),responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
  const data = await userService.update(req.user!, req.body)
  return { data }
}))


router.post("/rotate-token", authentication(tokenTypeEnum.REFRESH),responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
  const data = await userService.rotateToken(req.payload!, req.user!, `${req.protocol}://${req.host}`)
  console.log(req.payload);

  return {  data }
}))




router.post("/logout", authentication(), responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
  const data = await userService.logout(req.payload!, req.user!, req.body)
  console.log(req.payload);

  return{ data }
}))

// الاجزاء جديده مطلوبه
router.get("/search", authentication(), validation(validators.search), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await socialService.search(req.user!, req.validate.query)
    return { data }
  }))

router.get("/suggestions", authentication(), validation(validators.suggestions), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await socialService.suggestions(req.user!, req.validate.query.limit)
    return { data }
  }))

router.patch("/settings/privacy", authentication(), validation(validators.updatePrivacy), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await socialService.updatePrivacy(req.user!, req.validate.body.isPrivate)
    return { data }
  }))

router.post("/:id/follow", authentication(), validation(validators.userIdParam), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await socialService.follow(req.user!, req.validate.params.id)
    return { status: 201, data }
  }))

router.delete("/:id/follow", authentication(), validation(validators.userIdParam), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await socialService.unfollow(req.user!, req.validate.params.id)
    return ;
  }))
router.get("/:id", authentication(), validation(validators.userIdParam), responseFormatter(
  async (req: Request, res: Response, next: NextFunction): Promise<IResponse> => {
    const data = await socialService.getUserProfile(req.user!, req.validate.params.id)
    return { data }
  }))
export default router;