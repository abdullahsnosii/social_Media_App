import { NextFunction, Request, Response, Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import * as validators from './post.validation'
import { responseFormatter, validation } from "../../middleware";
import { IPost, IResponse } from "../../common/interface";
import postService from "./post.service";
import { IFile } from "../../common/types/";
import { updatePostDto } from "./dto/post.dto";
import { fileValidation, localFielupload } from "../../common/utils/multer/local.multer.js";
import { uploadMiddleware } from "../../middleware/multer.middleware.js";


const router = Router();


router.post("/",
    authentication(),
    uploadMiddleware({
        multerMiddleware: localFielupload({}).array("attachment", 3),
        validation: fileValidation.image
    }),
    validation(validators.createPost),
    responseFormatter(async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IPost>> => {    
        const post = await postService.create(req.validate.body , req.user , req.files as IFile[])
        return {  data : post as unknown as IPost}
    })
)


router.patch("/:postId",
    authentication(),
    uploadMiddleware({
        multerMiddleware: localFielupload({}).array("attachment", 3),
        validation: fileValidation.image
    }),
    validation(validators.updatePost),
    responseFormatter(async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IPost>> => {    
        const post = await postService.update(req.params as updatePostDto['params'], req.validate.body , req.user , req.files as IFile[])
        return {  data : post as unknown as IPost}
    })
)




export default router;
