"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenSecurity = exports.TokenSecurity = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const config_js_1 = require("../../config.js");
const security_enum_js_1 = require("../enum/security.enum.js");
const user_enum_js_1 = require("../enum/user.enum.js");
const hash_security_js_1 = require("./hash.security.js");
const node_crypto_1 = require("node:crypto");
const Domain_exciption_js_1 = require("../exciption/Domain.exciption.js");
const user_repository_js_1 = require("../repository/user.repository.js");
const cache_service_js_1 = require("../service/cache.service.js");
const objectId_js_1 = require("../utils/objectId.js");
class TokenSecurity {
    userRepository;
    cacheService;
    constructor() {
        this.cacheService = cache_service_js_1.cacheService;
        this.userRepository = new user_repository_js_1.UserRepository();
    }
    async userBaseKey({ userId }) {
        return `User::${userId.toString()}`;
    }
    async userBaseRevokeTokenKey({ userId }) {
        return `${this.userBaseKey({ userId })}::Revoke_Token`;
    }
    async userRevokeTokenKey({ userId, jti }) {
        return `${this.userBaseRevokeTokenKey({ userId })}::${jti}`;
    }
    async createToken({ payload = {}, secret_key = config_js_1.ACCESS_ADMIN_TOKEN_SIGNUTURE, options = {} }) {
        return jsonwebtoken_1.default.sign(payload, secret_key, options);
    }
    async verifyToken({ token = "", secret_key = config_js_1.ACCESS_USER_TOKEN_SIGNUTURE, }) {
        return (0, jsonwebtoken_1.verify)(token, secret_key);
    }
    async getTokenSignatures({ role = user_enum_js_1.RoleEnum.USER } = {}) {
        let signatures;
        switch (role) {
            case user_enum_js_1.RoleEnum.ADMIN:
                signatures = { accessSignature: config_js_1.ACCESS_ADMIN_TOKEN_SIGNUTURE, refreshSignature: config_js_1.REFRESH_ADMIN_TOKEN_SIGNUTURE };
                break;
            default:
                signatures = { accessSignature: config_js_1.ACCESS_USER_TOKEN_SIGNUTURE, refreshSignature: config_js_1.REFRESH_USER_TOKEN_SIGNUTURE };
                break;
        }
        return signatures;
    }
    async getSignature({ tokenType = security_enum_js_1.tokenTypeEnum.ACCESS, role = user_enum_js_1.RoleEnum.USER } = {}) {
        const signatures = await this.getTokenSignatures({ role });
        return tokenType == security_enum_js_1.tokenTypeEnum.ACCESS ? signatures.accessSignature : signatures.refreshSignature;
    }
    async decodeToken({ authorization = "", tokenType = security_enum_js_1.tokenTypeEnum.ACCESS }) {
        const decoded = jsonwebtoken_1.default.decode(authorization);
        if (!decoded?.aud?.length)
            throw new Domain_exciption_js_1.BadRequestExciption("missing decoded payload");
        const payload = await this.verifyToken({
            token: authorization,
            secret_key: await this.getSignature({ tokenType, role: Number(decoded.aud[0]) })
        });
        if (!payload?.sub)
            throw new Domain_exciption_js_1.BadRequestExciption("missing token payload");
        if (await this.cacheService.exist({ key: await this.userRevokeTokenKey({ userId: payload.sub, jti: payload.jti }) })) {
            throw new Domain_exciption_js_1.UnauthorizedExciption("Expired login credentials");
        }
        const user = await this.userRepository.findbyId({
            id: (0, objectId_js_1.ToObjectId)(payload.sub)
        });
        if (!user)
            throw new Domain_exciption_js_1.NotFoundExciption("Invalid user");
        if ((user.changeCredentialsTime?.getTime() ?? 0) > payload.iat * 1000) {
            throw new Domain_exciption_js_1.UnauthorizedExciption("Expired login credentials");
        }
        return { user, payload };
    }
    async createLoginCredentials({ user, issuer, options = {} }) {
        const { accessSignature, refreshSignature } = await this.getTokenSignatures({ role: user.role });
        const jwtid = (0, node_crypto_1.randomUUID)();
        const access_token = await this.createToken({
            payload: { sub: user._id },
            secret_key: accessSignature,
            options: {
                ...options,
                issuer,
                audience: [String(user.role)],
                expiresIn: config_js_1.ACCESS_TOKEN_EXPIRES_IN,
                jwtid
            }
        });
        const refresh_token = await this.createToken({
            payload: { sub: user._id },
            secret_key: refreshSignature,
            options: {
                ...options,
                issuer,
                audience: [String(user.role)],
                expiresIn: config_js_1.REFRESH_TOKEN_EXPIRES_IN,
                jwtid
            },
        });
        console.log({ accessSignature, refreshSignature });
        return { access_token, refresh_token };
    }
    async createRevokeToken({ payload }) {
        const consumedTime = (Math.ceil(Date.now() / 1000) - payload.iat);
        const refreshExpiredIn = payload.iat + config_js_1.REFRESH_TOKEN_EXPIRES_IN;
        const ttl = refreshExpiredIn - consumedTime;
        console.log({ payload, consumedTime, refreshExpiredIn, ttl });
        await this.cacheService.set({ key: await this.userRevokeTokenKey({ userId: payload.sub, jti: payload.jti }), value: payload.jti, ttl });
        return;
    }
    async basicAuth({ email, password }) {
        const account = await this.userRepository.findOne({
            filter: { email }
        });
        if (!account)
            throw new Domain_exciption_js_1.NotFoundExciption("not Exist");
        const match = await (0, hash_security_js_1.compare)(password, account.password);
        if (!match)
            throw new Domain_exciption_js_1.NotFoundExciption("not Exist");
        return await account;
    }
}
exports.TokenSecurity = TokenSecurity;
exports.tokenSecurity = new TokenSecurity();
