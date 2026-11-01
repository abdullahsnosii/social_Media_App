"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const encryption_security_js_1 = require("../../common/security/encryption.security.js");
const user_repository_js_1 = require("../../common/repository/user.repository.js");
const cache_service_js_1 = require("../../common/service/cache.service.js");
const token_security_js_1 = require("../../common/security/token.security.js");
const config_js_1 = require("../../config.js");
const Domain_exciption_js_1 = require("../../common/exciption/Domain.exciption.js");
const security_enum_js_1 = require("../../common/enum/security.enum.js");
class UserService {
    userRepository;
    cacheService;
    tokenSecurity;
    constructor() {
        this.cacheService = cache_service_js_1.cacheService;
        this.tokenSecurity = token_security_js_1.tokenSecurity;
        this.userRepository = new user_repository_js_1.UserRepository();
    }
    async profile(user) {
        const { password, ...safeUser } = user.toObject();
        if (user.phone)
            safeUser.phone = await (0, encryption_security_js_1.decryption)(user.phone);
        return { user: safeUser };
    }
    async update(user, data) {
        const allowed = ["firstName", "lastName", "DOB", "gender"];
        const safeData = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
        const account = this.userRepository.findbyIdAndUpdate({
            id: user._id,
            update: safeData
        });
        return account;
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
}
exports.UserService = UserService;
exports.default = new UserService();
