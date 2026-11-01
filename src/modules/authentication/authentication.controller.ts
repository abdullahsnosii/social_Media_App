import { Router, type NextFunction, type Request, type Response } from "express";
import authservise from "./authentication.service";
import { responseFormatter } from "../../middleware/response.middleware";
import * as validators from "./authentication.validation"
import { validation } from "../../middleware/validation.middleware.js";
import type { IResponse } from "../../common/interface/response.interface.js";
import type { IUser } from "../../common/interface/user.interface.js";
import authenticationService from "./authentication.service";
import { authentication } from "../../middleware/authentication.middleware.js";

const router = Router({ strict: true, caseSensitive: true })
// const routers = Router({
// caseSensitive: true, //  (/)  الي ف اخر  routing  اقدر اشلها عادي 
// strict: true,  // بتخليني مينفع احش ف اخر routing (/)
// mergeParams: true  //  عاوز افهمها اكتر لسه
// });

router.post("/signup",
    validation(validators.signup), // validatiobn middleware
    responseFormatter(  // middleware بتهندل الresponse
        async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
            const data = await authservise.signup(req.validate.body)
            return { data, status: 201 }
        }
    )
)

router.patch("/confirm-email", validation(validators.confirmEmail), responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
        const data = await authenticationService.confirmEmail(req.body)
        return { status: 200, data }
    }))


router.patch("/resend-confirm-email", validation(validators.resendConfirmEmail), responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {

        const data = await authenticationService.resendConfirmEmail(req.body)
        return { status: 200, data }
    }))


router.post("/request-forgot-password-code", validation(validators.requestForgotPasswordCode), responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {

        const data = await authenticationService.requestForgotPasswordCode(req.body)
        return { status: 201, data }
    }))

router.post("/verify-forgot-password", validation(validators.confirmEmail), responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {

        const data = await authenticationService.verifyForgotPasswordCode(req.body)
        return { status: 200, data }
    }))


router.patch("/reset-forgot-password", validation(validators.veriryForgotPassword), responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {

        const data = await authenticationService.resetForgotPassword(req.body)
        return { status: 200, data }
    }))


router.post("/signup-with-gmail", responseFormatter(
    async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
        const { status, data } = await authenticationService.signupWithGmail(req.body, `${req.protocol}://${req.host}`)
        return { status: status, data }
    }))


router.post("/enable-2-step-verification", authentication(), validation(validators.enable_2_step_verification), responseFormatter(async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
    const data = await authenticationService.enable_2_step_verification(req.body)
    return { status: 201, data }
}))


router.post("/confirm-2-step-verification", authentication(), validation(validators.confirm_2_step_verification), responseFormatter(async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
    const data = await authenticationService.confirm_2_step_verification(req.body)
    return { status: 201, data }
}))

// const loginLimiter = generatelimiter({ limit: 5, TTL: 5,skipSuccessfulRequests:true })
router.post("/login", validation(validators.login),    responseFormatter(async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {
    const data = await authenticationService.login(req.validate.body, `${req.protocol}://${req.host}`)
    // await del({ key: req.rateLimit.key }) // احذف KEY لو قبلت دخول 
    return {  data }

}))


router.post("/Confirmation-Login", validation(validators.Confirmation_Login), responseFormatter(async (req: Request, res: Response, next: NextFunction): Promise<IResponse<IUser>> => {

    const data = await authenticationService.confirmLogin(req.body, `${req.protocol}://${req.host}`)
    return { data }

}))

export default router