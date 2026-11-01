
import type { Confirmation_LoginDto, ConfirmEmailDto, Enable_2_step_verificationDto, LoginDto, RequestForgotPasswordCodeDto, ResendConfirmEmailDto, SignupDto, VeriryForgotPasswordDto } from "./dto/authentication.dto";
import { BadRequestExciption, ConfilectRrquestExciption, NotFoundExciption, TooManyRequestExciption } from "../../common/exciption/Domain.exciption.js";
import { UserRepository } from "../../common/repository";
import { cacheService, type CacheService } from "../../common/service/cache.service.js";
import { compare, hash } from "../../common/security/hash.security.js";
import { encryption } from "../../common/security/encryption.security.js";
import { EmailSubjectEnum } from "../../common/enum/email.enum.js";
import { userEmailKey, userEmaiTrialsKey } from "../../common/utils/email/send.email.js";
import { emailEvent } from "../../common/utils/email/email.event.js";
import { createOtp } from "../../common/utils/multer/otp.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import type { IUser } from "../../common/interface/user.interface.js";
import { loginTrialsKey } from "../../common/utils/multer/key.login.js";
import { tokenSecurity, type TokenSecurity } from "../../common/security/token.security.js";
import type { HydratedDocument } from "mongoose";
import { OAuth2Client, type TokenPayload } from "google-auth-library"
import { WEB_CLIENT_IDS } from "../../config.js";
import { string } from "zod";
const clientAuth = new OAuth2Client()


export class AuthenticationService {
    private userRepository: UserRepository
    private cacheService: CacheService
    private tokenSecurity: TokenSecurity
    constructor() {
        this.cacheService = cacheService
        this.tokenSecurity = tokenSecurity
        this.userRepository = new UserRepository()

    }




    async sendEmailOtp({ email, subject, title, expiresIn = 120, maxTrials = 3, blockInSeconds = 300 }: { email: string, subject: EmailSubjectEnum, title?: string, expiresIn?: number, maxTrials?: number, blockInSeconds?: number }) {

        const existOTP_TTL = await this.cacheService.ttl({ key: userEmailKey({ email, subject }) })
        if (existOTP_TTL > 0) {
            throw new ConfilectRrquestExciption(`sorry we connot create new otp while existing one still valid please try again later after ${existOTP_TTL}`)
        }

        const oldTrials = await this.cacheService.get({ key: userEmaiTrialsKey({ email, subject }) }) ?? 0;

        if (oldTrials >= maxTrials) {
            throw new TooManyRequestExciption("Max otp trials has been reached")
        }

        const code = createOtp()
        await this.cacheService.set({
            key: userEmailKey({ email, subject }),
            value: await hash(code.toString()),
            ttl: expiresIn
        })

        const currentTrials = await this.cacheService.incrBy({ key: userEmaiTrialsKey({ email, subject }) })
        if (currentTrials == 3) {
            await this.cacheService.expire({ key: userEmaiTrialsKey({ email, subject }), ttl: blockInSeconds })
        }

        emailEvent.emit("send-Email",
            {
                recipients: { to: email },
                subject,
                data: { code, title: title ?? subject }
            })

    }




    async signup({ email, password, username, phone }: SignupDto['body']): Promise<IUser> {

        const duplicatedAccount = await this.userRepository.findOne({
            filter: { email },
            options: { select: "email" }
        })

        if (duplicatedAccount) throw new ConfilectRrquestExciption("Email exists")

        const account = await this.userRepository.createone({
            data: {
                email,
                password: await hash(password),
                phone: await encryption(phone),
                username
            }
        })

        await this.sendEmailOtp({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL })
        return account
    }


    async confirmEmail({ email, otp }: ConfirmEmailDto): Promise<void> {

        const account = await this.userRepository.findOne({
            filter: { email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: false } },
            options: { select: "email" }
        })

        if (!account) throw new NotFoundExciption("Invalid acccount")

        const hashOtp = await this.cacheService.get({ key: userEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }) })
        console.log({ sentOtp: otp, storedOtp: hashOtp });
        if (!hashOtp || !(await compare(otp, hashOtp))) {

            throw new ConfilectRrquestExciption("Invalid OTP")
        }

        account.confirmEmail = new Date() as unknown as string;
        await account.save()

        await this.cacheService.del({ key: await this.cacheService.keys({ prefix: userEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }) }) })

        return

    }



    async resendConfirmEmail({ email }: ResendConfirmEmailDto): Promise<void> {

        const account = await this.userRepository.findOne({

            filter: { email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: false } },
            options: { select: "email" }
        })

        if (!account) throw new NotFoundExciption("Invalid acccount")

        await this.sendEmailOtp({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL })
        return

    }





    async requestForgotPasswordCode({ email }: ResendConfirmEmailDto): Promise<void> {

        const account = await this.userRepository.findOne({
            filter: { email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: true } },
            options: { select: "email" }
        })

        if (!account) throw new NotFoundExciption("Invalid acccount")

        await this.sendEmailOtp({ email, subject: EmailSubjectEnum.FORGOT_PASSWORD })
        return;

    }



    async verifyForgotPasswordCode({ email, otp }:{ email: string, otp: string }):  Promise<HydratedDocument<IUser>> {

        const account = await this.userRepository.findOne({
            filter: { email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: true } },
            options: { select: "email" }
        })

        if (!account) throw new NotFoundExciption("Invalid acccount")

        const hashOtp = await this.cacheService.get({ key: userEmailKey({ email, subject: EmailSubjectEnum.FORGOT_PASSWORD }) })

        if (!hashOtp || !(await compare(otp, hashOtp))) {

            throw new ConfilectRrquestExciption("Invalid OTP")
        }

        return account

    }




    async resetForgotPassword({ email, otp, password }: { email: string, otp: string, password: string }) {

        const account = await this.verifyForgotPasswordCode({ email, otp }) 
        account.password = await hash(password)
        account.changeCredentialsTime = new Date()
        await account.save()

        const result = await Promise.all([
            this.cacheService.keys({ prefix: userEmailKey({ email, subject: EmailSubjectEnum.FORGOT_PASSWORD }) }),
            this.cacheService.keys({ prefix: await this.tokenSecurity.userBaseRevokeTokenKey({ userId: account._id }) })
        ])

        await this.cacheService.del({
            key: [...result[0], ...result[1]]
        })
    }

    async enable_2_step_verification({ email }: Enable_2_step_verificationDto) {

        const account = await this.userRepository.findOne({
            filter: { email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: true } },
            options: { select: "email" }
        })

        if (!account) throw new NotFoundExciption("Invalid acccount")

        await this.sendEmailOtp({ email, subject: EmailSubjectEnum.TWO_STEP_VERIFICATION })
        return;

    }




    async confirm_2_step_verification({ email, otp }: Confirmation_LoginDto): Promise<void> {

        const account = await this.userRepository.findOne({
            filter: { email, provider: ProviderEnum.SYSTEM, twoStepVerification: { $exists: false } },
            options: { select: "email" }
        })

        if (!account) throw new NotFoundExciption("Invalid acccount")

        const hashOtp = await this.cacheService.get({ key: userEmailKey({ email, subject: EmailSubjectEnum.TWO_STEP_VERIFICATION }) })

        if (!hashOtp || !(await compare(otp, hashOtp))) {

            throw new ConfilectRrquestExciption("Invalid OTP")
        }

        account.twoStepVerification = new Date();
        await account.save()

        await this.cacheService.del({ key: await this.cacheService.keys({ prefix: userEmailKey({ email, subject: EmailSubjectEnum.TWO_STEP_VERIFICATION }) }) })

        return

    }

    async login({ email, password }: { email: string, password: string }, issuer: string, maxTrials: number = 5, blockInSeconds: number = 300) {

        const oldTrials = await this.cacheService.get({ key: loginTrialsKey({ email }) }) ?? 0;
        if (oldTrials >= maxTrials) {
            throw new TooManyRequestExciption(`your account is temporarily blocked please try again after ${await this.cacheService.ttl({ key: loginTrialsKey({ email }) })} seconds`)
        }


        const account = await this.userRepository.findOne({
            filter: { email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: true } }
        })
        if (!account) throw new NotFoundExciption("not Exist")
        const matchPassword = await compare(password, account.password)

        if (!matchPassword) {

            const currentTrials = await this.cacheService.incrBy({ key: loginTrialsKey({ email }) })
            if (currentTrials == 5) {
                await this.cacheService.expire({ key: loginTrialsKey({ email }), ttl: blockInSeconds })
                throw new TooManyRequestExciption("Too many falile login attempts. your account is temporarily blocked for 5 minutes")
            }
            throw new NotFoundExciption("Invalid password")
        }

        await this.cacheService.del({ key: loginTrialsKey({ email }) })

        if (account.twoStepVerification) {

            await this.sendEmailOtp({ email, subject: EmailSubjectEnum.LOGIN })
            return { message: "OTP sent to your email" }
        }

        return await this.tokenSecurity.createLoginCredentials({ user: account, issuer })

    }





    async confirmLogin({ email, otp }: { email: string, otp: string }, issuer: string) {

        const account = await this.userRepository.findOne({
            filter: { email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: true } },
            options: { select: "email" }
        })

        if (!account) throw new NotFoundExciption("Invalid acccount")

        const hashOtp = await this.cacheService.get({ key: userEmailKey({ email, subject: EmailSubjectEnum.LOGIN }) })

        if (!hashOtp || !(await compare(otp, hashOtp))) {

            throw new ConfilectRrquestExciption("Invalid OTP")
        }

        await this.cacheService.del({ key: await this.cacheService.keys({ prefix: userEmailKey({ email, subject: EmailSubjectEnum.LOGIN }) }) })

        return await this.tokenSecurity.createLoginCredentials({ user: account, issuer })

    }



async  verifyGoogleAccount(idToken:string):Promise<TokenPayload> {
  const ticket = await clientAuth.verifyIdToken({
      idToken,
      audience: WEB_CLIENT_IDS
  });
  const payload = ticket.getPayload() as TokenPayload;
  if(!payload.email_verified ) throw new BadRequestExciption("email not verified")
  return payload
}


async signupWithGmail  ({idToken}:{idToken:string} , issuer:string):Promise<{status:number , data:{access_token:string , refresh_token:string}}>{

console.log({idToken});

const {name , email , picture} = await this.verifyGoogleAccount(idToken)
console.log({name , email , picture});

let status:number = 201;
const existAccount = await this.userRepository.findOne({
    filter:{email:email as string}
}) as HydratedDocument<IUser> | null

if (existAccount) {
    if (existAccount.provider != ProviderEnum.GOOGLE) {
        throw new ConfilectRrquestExciption("Invalid account provider")
    }
   
    return {status:200  , data: await this.tokenSecurity.createLoginCredentials({user:existAccount , issuer})}
}
 const user = await this.userRepository.createone({
    data:{
        username:name,
        email,
        confirmEmail:new Date(),
        provider:ProviderEnum.GOOGLE,
        image:picture
    }
 }) as HydratedDocument<IUser>
return  {status  , data:await this.tokenSecurity.createLoginCredentials({user , issuer})}

}


    // signup = async ({ email, password, confirmPassword, phone, username }: SignupDto['body']): Promise<IUser> => {
    //     this.cacheService.set({ key: "name", value: "snosii" })
    //     const userExist = await this.userRepository.findOne({
    //         filter: { email },
    //         projection: { email: 1 },
    //         options: { lean: false }
    //     })
    //     console.log(userExist);
    //     if (userExist) {
    //         userExist._id
    //         throw new ConfilectRrquestExciption("Exist email")
    //     }
    //     const account: HUser = await this.userRepository.createone({
    //         data: {
    //             email,
    //             password :await hash(password),
    //             phone : await encryption(phone),
    //             username
    //         },
    //         options: { validateBeforeSave: true }

    //     })
    //     // throw new TooManyRequestExciption("FAIL", "LOL") // ال cause اقدر هنا ابعته text او object او array 
    //     return account
    // }

}

export default new AuthenticationService()   // singleton pattern