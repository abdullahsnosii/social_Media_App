"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const Domain_exciption_js_1 = require("../../common/exciption/Domain.exciption.js");
const repository_1 = require("../../common/repository");
const cache_service_js_1 = require("../../common/service/cache.service.js");
const hash_security_js_1 = require("../../common/security/hash.security.js");
const encryption_security_js_1 = require("../../common/security/encryption.security.js");
const email_enum_js_1 = require("../../common/enum/email.enum.js");
const send_email_js_1 = require("../../common/utils/email/send.email.js");
const email_event_js_1 = require("../../common/utils/email/email.event.js");
const otp_js_1 = require("../../common/utils/multer/otp.js");
const user_enum_js_1 = require("../../common/enum/user.enum.js");
const key_login_js_1 = require("../../common/utils/multer/key.login.js");
const token_security_js_1 = require("../../common/security/token.security.js");
const google_auth_library_1 = require("google-auth-library");
const config_js_1 = require("../../config.js");
const clientAuth = new google_auth_library_1.OAuth2Client();
class AuthenticationService {
    userRepository;
    cacheService;
    tokenSecurity;
    constructor() {
        this.cacheService = cache_service_js_1.cacheService;
        this.tokenSecurity = token_security_js_1.tokenSecurity;
        this.userRepository = new repository_1.UserRepository();
    }
    async sendEmailOtp({ email, subject, title, expiresIn = 120, maxTrials = 3, blockInSeconds = 300 }) {
        const existOTP_TTL = await this.cacheService.ttl({ key: (0, send_email_js_1.userEmailKey)({ email, subject }) });
        if (existOTP_TTL > 0) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption(`sorry we connot create new otp while existing one still valid please try again later after ${existOTP_TTL}`);
        }
        const oldTrials = await this.cacheService.get({ key: (0, send_email_js_1.userEmaiTrialsKey)({ email, subject }) }) ?? 0;
        if (oldTrials >= maxTrials) {
            throw new Domain_exciption_js_1.TooManyRequestExciption("Max otp trials has been reached");
        }
        const code = (0, otp_js_1.createOtp)();
        await this.cacheService.set({
            key: (0, send_email_js_1.userEmailKey)({ email, subject }),
            value: await (0, hash_security_js_1.hash)(code.toString()),
            ttl: expiresIn
        });
        const currentTrials = await this.cacheService.incrBy({ key: (0, send_email_js_1.userEmaiTrialsKey)({ email, subject }) });
        if (currentTrials == 3) {
            await this.cacheService.expire({ key: (0, send_email_js_1.userEmaiTrialsKey)({ email, subject }), ttl: blockInSeconds });
        }
        email_event_js_1.emailEvent.emit("send-Email", {
            recipients: { to: email },
            subject,
            data: { code, title: title ?? subject }
        });
    }
    async signup({ email, password, username, phone }) {
        const duplicatedAccount = await this.userRepository.findOne({
            filter: { email },
            options: { select: "email" }
        });
        if (duplicatedAccount)
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("Email exists");
        const account = await this.userRepository.createone({
            data: {
                email,
                password: await (0, hash_security_js_1.hash)(password),
                phone: await (0, encryption_security_js_1.encryption)(phone),
                username
            }
        });
        await this.sendEmailOtp({ email, subject: email_enum_js_1.EmailSubjectEnum.CONFIRM_EMAIL });
        return account;
    }
    async confirmEmail({ email, otp }) {
        const account = await this.userRepository.findOne({
            filter: { email, provider: user_enum_js_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: false } },
            options: { select: "email" }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid acccount");
        const hashOtp = await this.cacheService.get({ key: (0, send_email_js_1.userEmailKey)({ email, subject: email_enum_js_1.EmailSubjectEnum.CONFIRM_EMAIL }) });
        console.log({ sentOtp: otp, storedOtp: hashOtp });
        if (!hashOtp || !(await (0, hash_security_js_1.compare)(otp, hashOtp))) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("Invalid OTP");
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.cacheService.del({ key: await this.cacheService.keys({ prefix: (0, send_email_js_1.userEmailKey)({ email, subject: email_enum_js_1.EmailSubjectEnum.CONFIRM_EMAIL }) }) });
        return;
    }
    async resendConfirmEmail({ email }) {
        const account = await this.userRepository.findOne({
            filter: { email, provider: user_enum_js_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: false } },
            options: { select: "email" }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid acccount");
        await this.sendEmailOtp({ email, subject: email_enum_js_1.EmailSubjectEnum.CONFIRM_EMAIL });
        return;
    }
    async requestForgotPasswordCode({ email }) {
        const account = await this.userRepository.findOne({
            filter: { email, provider: user_enum_js_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: true } },
            options: { select: "email" }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid acccount");
        await this.sendEmailOtp({ email, subject: email_enum_js_1.EmailSubjectEnum.FORGOT_PASSWORD });
        return;
    }
    async verifyForgotPasswordCode({ email, otp }) {
        const account = await this.userRepository.findOne({
            filter: { email, provider: user_enum_js_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: true } },
            options: { select: "email" }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid acccount");
        const hashOtp = await this.cacheService.get({ key: (0, send_email_js_1.userEmailKey)({ email, subject: email_enum_js_1.EmailSubjectEnum.FORGOT_PASSWORD }) });
        if (!hashOtp || !(await (0, hash_security_js_1.compare)(otp, hashOtp))) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("Invalid OTP");
        }
        return account;
    }
    async resetForgotPassword({ email, otp, password }) {
        const account = await this.verifyForgotPasswordCode({ email, otp });
        account.password = await (0, hash_security_js_1.hash)(password);
        account.changeCredentialsTime = new Date();
        await account.save();
        const result = await Promise.all([
            this.cacheService.keys({ prefix: (0, send_email_js_1.userEmailKey)({ email, subject: email_enum_js_1.EmailSubjectEnum.FORGOT_PASSWORD }) }),
            this.cacheService.keys({ prefix: await this.tokenSecurity.userBaseRevokeTokenKey({ userId: account._id }) })
        ]);
        await this.cacheService.del({
            key: [...result[0], ...result[1]]
        });
    }
    async enable_2_step_verification({ email }) {
        const account = await this.userRepository.findOne({
            filter: { email, provider: user_enum_js_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: true } },
            options: { select: "email" }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid acccount");
        await this.sendEmailOtp({ email, subject: email_enum_js_1.EmailSubjectEnum.TWO_STEP_VERIFICATION });
        return;
    }
    async confirm_2_step_verification({ email, otp }) {
        const account = await this.userRepository.findOne({
            filter: { email, provider: user_enum_js_1.ProviderEnum.SYSTEM, twoStepVerification: { $exists: false } },
            options: { select: "email" }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid acccount");
        const hashOtp = await this.cacheService.get({ key: (0, send_email_js_1.userEmailKey)({ email, subject: email_enum_js_1.EmailSubjectEnum.TWO_STEP_VERIFICATION }) });
        if (!hashOtp || !(await (0, hash_security_js_1.compare)(otp, hashOtp))) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("Invalid OTP");
        }
        account.twoStepVerification = new Date();
        await account.save();
        await this.cacheService.del({ key: await this.cacheService.keys({ prefix: (0, send_email_js_1.userEmailKey)({ email, subject: email_enum_js_1.EmailSubjectEnum.TWO_STEP_VERIFICATION }) }) });
        return;
    }
    async login({ email, password }, issuer, maxTrials = 5, blockInSeconds = 300) {
        const oldTrials = await this.cacheService.get({ key: (0, key_login_js_1.loginTrialsKey)({ email }) }) ?? 0;
        if (oldTrials >= maxTrials) {
            throw new Domain_exciption_js_1.TooManyRequestExciption(`your account is temporarily blocked please try again after ${await this.cacheService.ttl({ key: (0, key_login_js_1.loginTrialsKey)({ email }) })} seconds`);
        }
        const account = await this.userRepository.findOne({
            filter: { email, provider: user_enum_js_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: true } }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("not Exist");
        const matchPassword = await (0, hash_security_js_1.compare)(password, account.password);
        if (!matchPassword) {
            const currentTrials = await this.cacheService.incrBy({ key: (0, key_login_js_1.loginTrialsKey)({ email }) });
            if (currentTrials == 5) {
                await this.cacheService.expire({ key: (0, key_login_js_1.loginTrialsKey)({ email }), ttl: blockInSeconds });
                throw new Domain_exciption_js_1.TooManyRequestExciption("Too many falile login attempts. your account is temporarily blocked for 5 minutes");
            }
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid password");
        }
        await this.cacheService.del({ key: (0, key_login_js_1.loginTrialsKey)({ email }) });
        if (account.twoStepVerification) {
            await this.sendEmailOtp({ email, subject: email_enum_js_1.EmailSubjectEnum.LOGIN });
            return { message: "OTP sent to your email" };
        }
        return await this.tokenSecurity.createLoginCredentials({ user: account, issuer });
    }
    async confirmLogin({ email, otp }, issuer) {
        const account = await this.userRepository.findOne({
            filter: { email, provider: user_enum_js_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: true } },
            options: { select: "email" }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid acccount");
        const hashOtp = await this.cacheService.get({ key: (0, send_email_js_1.userEmailKey)({ email, subject: email_enum_js_1.EmailSubjectEnum.LOGIN }) });
        if (!hashOtp || !(await (0, hash_security_js_1.compare)(otp, hashOtp))) {
            throw new Domain_exciption_js_1.ConfilectRrquestExciption("Invalid OTP");
        }
        await this.cacheService.del({ key: await this.cacheService.keys({ prefix: (0, send_email_js_1.userEmailKey)({ email, subject: email_enum_js_1.EmailSubjectEnum.LOGIN }) }) });
        return await this.tokenSecurity.createLoginCredentials({ user: account, issuer });
    }
    async verifyGoogleAccount(idToken) {
        const ticket = await clientAuth.verifyIdToken({
            idToken,
            audience: config_js_1.WEB_CLIENT_IDS
        });
        const payload = ticket.getPayload();
        if (!payload.email_verified)
            throw new Domain_exciption_js_1.BadRequestExciption("email not verified");
        return payload;
    }
    async signupWithGmail({ idToken }, issuer) {
        console.log({ idToken });
        const { name, email, picture } = await this.verifyGoogleAccount(idToken);
        console.log({ name, email, picture });
        let status = 201;
        const existAccount = await this.userRepository.findOne({
            filter: { email: email }
        });
        if (existAccount) {
            if (existAccount.provider != user_enum_js_1.ProviderEnum.GOOGLE) {
                throw new Domain_exciption_js_1.ConfilectRrquestExciption("Invalid account provider");
            }
            return { status: 200, data: await this.tokenSecurity.createLoginCredentials({ user: existAccount, issuer }) };
        }
        const user = await this.userRepository.createone({
            data: {
                username: name,
                email,
                confirmEmail: new Date(),
                provider: user_enum_js_1.ProviderEnum.GOOGLE,
                image: picture
            }
        });
        return { status, data: await this.tokenSecurity.createLoginCredentials({ user, issuer }) };
    }
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();
